# Odonto Agenda — Deployment & Production Readiness Checklist

## Running Locally (Demo Mode — Zero Secrets)
```bash
npm install
npm run dev
```

## Quality Gates
```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Production Provisioning Checklist (Before Real Clinic Go-Live)
- [ ] Create a dedicated Supabase project and apply `supabase/migrations/0001_initial_schema.sql` and `0002_booking_transactions.sql`.
- [ ] Configure `.env.local` / Vercel environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- [ ] Configure Supabase Auth users and link `staff_members.auth_user_id` for `clinic_admin`, `dentist`, and `receptionist` roles.
- [ ] Replace all `(Demo)` / `(Exemplo)` clinic, staff, price, and testimonial copy with dentist-reviewed, CRO-compliant clinic data.
- [ ] Configure automated database backups and LGPD retention policies in Supabase.
