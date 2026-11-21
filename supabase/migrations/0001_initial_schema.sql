-- Odonto Agenda — Phase 1 Multi-Tenant Schema & RLS
-- Shared PostgreSQL schema scoped by tenant_id with strict separation between
-- public published content and private appointment/contact/CRM/audit records.

create extension if not exists "pgcrypto";

create type public.appointment_status as enum (
  'REQUESTED',
  'PENDING_REVIEW',
  'CONFIRMED',
  'RESCHEDULE_REQUESTED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW'
);

create type public.publication_status as enum ('draft', 'reviewed', 'published');

create type public.staff_role as enum ('receptionist', 'dentist', 'clinic_admin');

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null default 'demo' check (status in ('demo', 'active', 'suspended')),
  data_location_strategy text not null default 'shared' check (data_location_strategy in ('shared', 'isolated')),
  created_at timestamptz not null default now()
);

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  subtitle text not null,
  address text not null,
  hours_label text not null,
  whatsapp_phone text not null,
  is_demo boolean not null default true,
  branding jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  role public.staff_role not null,
  display_name text not null,
  specialty text not null,
  cro_registration text,
  bio text not null default '',
  is_active boolean not null default true,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null,
  category text not null,
  category_label text not null,
  display_name text not null,
  overview text not null,
  clinic_differential text not null default '',
  estimated_duration_minutes integer not null check (estimated_duration_minutes > 0),
  active boolean not null default true,
  unique (tenant_id, slug)
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  question text not null,
  answer text not null,
  category text not null default 'geral',
  publication_status public.publication_status not null default 'draft',
  reviewer_staff_id uuid references public.staff_members(id) on delete set null,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.patient_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  phone text not null,
  consent_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_contact_id uuid not null references public.patient_contacts(id) on delete restrict,
  treatment_id uuid not null references public.treatments(id) on delete restrict,
  professional_id uuid references public.staff_members(id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text,
  status public.appointment_status not null default 'REQUESTED',
  source text not null default 'web_public',
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

-- Prevent double-booking active/confirmed slots for the same professional & start time
create unique index if not exists idx_unique_active_slot
  on public.appointment_requests (tenant_id, professional_id, start_at)
  where status in ('REQUESTED', 'PENDING_REVIEW', 'CONFIRMED', 'RESCHEDULE_REQUESTED');

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_id uuid not null,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  created_at timestamptz not null default now()
);

-- Indexes for tenant-scoped queries
create index if not exists idx_clinics_tenant on public.clinics(tenant_id);
create index if not exists idx_staff_tenant on public.staff_members(tenant_id);
create index if not exists idx_treatments_tenant on public.treatments(tenant_id);
create index if not exists idx_faqs_tenant on public.faqs(tenant_id);
create index if not exists idx_appointments_tenant_start on public.appointment_requests(tenant_id, start_at);

-- Enable Row Level Security on every tenant-owned table
alter table public.tenants enable row level security;
alter table public.clinics enable row level security;
alter table public.staff_members enable row level security;
alter table public.treatments enable row level security;
alter table public.faqs enable row level security;
alter table public.patient_contacts enable row level security;
alter table public.appointment_requests enable row level security;
alter table public.audit_events enable row level security;

-- Helper: resolve authenticated user's staff membership inside a tenant
create or replace function public.is_tenant_staff(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.staff_members sm
    where sm.tenant_id = target_tenant_id
      and sm.auth_user_id = auth.uid()
      and sm.is_active = true
  );
$$;

-- Public read-only policies for published clinic data (never private patient/CRM/audit data)
create policy "Public can read active clinic profiles"
  on public.clinics for select
  using (true);

create policy "Public can read active treatments"
  on public.treatments for select
  using (active = true);

create policy "Public can read published FAQs"
  on public.faqs for select
  using (publication_status = 'published');

create policy "Public can read active staff profiles"
  on public.staff_members for select
  using (is_active = true);

-- Staff-only policies for private operational tables (enforced by tenant_id)
create policy "Staff can manage tenant patient contacts"
  on public.patient_contacts for all
  using (public.is_tenant_staff(tenant_id))
  with check (public.is_tenant_staff(tenant_id));

create policy "Staff can manage tenant appointments"
  on public.appointment_requests for all
  using (public.is_tenant_staff(tenant_id))
  with check (public.is_tenant_staff(tenant_id));

create policy "Staff can read tenant audit events"
  on public.audit_events for select
  using (public.is_tenant_staff(tenant_id));
