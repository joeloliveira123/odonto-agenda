# Odonto Agenda — Security & LGPD Controls

## Multi-Tenant Isolation
- Every tenant-owned table in `supabase/migrations/` carries `tenant_id` and Row Level Security (`ENABLE ROW LEVEL SECURITY`).
- Public policies only expose active clinic profiles, treatments, staff bios, and `published` FAQs.
- Private operational tables (`patient_contacts`, `appointment_requests`, `audit_events`) require verified staff membership (`public.is_tenant_staff(tenant_id)`).

## Server-Side Authorization & Validation
- All API mutations validate payloads with **Zod** (`src/lib/validation/schemas.ts`).
- Role permissions (`src/lib/auth/rbac.ts`) and status transitions (`src/features/scheduling/stateMachine.ts`) are enforced on the server, never relying solely on hidden UI controls.
- Cross-tenant reads/writes are rejected with `403`.

## Privacy & LGPD
- Patient contact forms collect only minimal contact data (`name`, `phone`).
- WhatsApp handoff links (`buildSafeWhatsAppHandoffUrl`) exclude clinical notes or health details from URL query strings.
- Demo mode is explicitly labeled and stores no real patient records on external servers.
