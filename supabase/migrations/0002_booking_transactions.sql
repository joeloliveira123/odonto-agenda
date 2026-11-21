-- Odonto Agenda — Phase 3: Availability Rules, Exceptions & Transactional Booking RPC

create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  professional_id uuid not null references public.staff_members(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  time_zone text not null default 'America/Sao_Paulo',
  check (end_time > start_time)
);

create table if not exists public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  professional_id uuid references public.staff_members(id) on delete cascade,
  exception_date date not null,
  reason text not null default 'Indisponível'
);

create index if not exists idx_avail_rules_tenant on public.availability_rules(tenant_id, professional_id, weekday);
create index if not exists idx_avail_ex_tenant on public.availability_exceptions(tenant_id, exception_date);

alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;

create policy "Public can read tenant availability rules"
  on public.availability_rules for select
  using (true);

create policy "Public can read tenant availability exceptions"
  on public.availability_exceptions for select
  using (true);

create policy "Staff can manage tenant availability rules"
  on public.availability_rules for all
  using (public.is_tenant_staff(tenant_id))
  with check (public.is_tenant_staff(tenant_id));

create policy "Staff can manage tenant availability exceptions"
  on public.availability_exceptions for all
  using (public.is_tenant_staff(tenant_id))
  with check (public.is_tenant_staff(tenant_id));

-- Transactional booking request RPC preventing race conditions / double booking
create or replace function public.request_appointment_slot(
  p_tenant_id uuid,
  p_patient_name text,
  p_patient_phone text,
  p_treatment_id uuid,
  p_professional_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_contact_id uuid;
  v_appointment_id uuid;
  v_conflict boolean;
begin
  -- Serialize concurrent slot checks per tenant/professional
  perform pg_advisory_xact_lock(hashtext(p_tenant_id::text || ':' || coalesce(p_professional_id::text, 'any')));

  select exists (
    select 1
    from public.appointment_requests ar
    where ar.tenant_id = p_tenant_id
      and (p_professional_id is null or ar.professional_id = p_professional_id)
      and ar.status in ('REQUESTED', 'PENDING_REVIEW', 'CONFIRMED', 'RESCHEDULE_REQUESTED')
      and ar.start_at < p_end_at
      and ar.end_at > p_start_at
  ) into v_conflict;

  if v_conflict then
    raise exception 'SLOT_CONFLICT: Horário indisponível.' using errcode = '23505';
  end if;

  insert into public.patient_contacts (tenant_id, name, phone)
  values (p_tenant_id, p_patient_name, p_patient_phone)
  returning id into v_contact_id;

  insert into public.appointment_requests (
    tenant_id,
    patient_contact_id,
    treatment_id,
    professional_id,
    start_at,
    end_at,
    notes,
    status,
    source
  )
  values (
    p_tenant_id,
    v_contact_id,
    p_treatment_id,
    p_professional_id,
    p_start_at,
    p_end_at,
    p_notes,
    'REQUESTED',
    'web_public'
  )
  returning id into v_appointment_id;

  return v_appointment_id;
end;
$$;
