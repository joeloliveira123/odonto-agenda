# ODONTO AGENDA — MASTER SPEC

**Version:** 1.0  
**Status:** Approved product direction; implementation pending  
**Repository:** https://github.com/joeloliveira123/odonto-agenda  
**Purpose:** Source of truth for incremental implementation by Codex or another coding agent.

> This document specifies the intended product. Features described here are **not** claims that they already exist. The agent must inspect the repository before editing it.

## 1. Product vision

Build **Odonto Agenda**, a commercial, modular dental clinic website and operations platform. Each clinic gets a distinct, premium, human-centered public website while sharing reusable booking, content, CRM, and administrative components. The platform should answer routine patient questions with dentist-reviewed educational content and streamline appointment requests without replacing professional care.

**Primary outcomes:** an attractive commercial demonstration; a clear patient journey; less repetitive receptionist work; a reusable codebase for different clinics; secure operations suitable for eventual real-world use.

**Non-goals for the initial MVP:** electronic health records, clinical diagnosis, prescriptions, insurance billing, online payment processing, or a fully autonomous clinical assistant.

## 2. Approved decisions

| Area | Decision |
|---|---|
| Visual direction | Premium + humanized; refined, warm, photographic, accessible |
| Commercial architecture | Hybrid: shared reusable platform with bespoke clinic websites |
| Customization | Complete: identity, photography, sections, page layouts, animations, content, and clinic-specific extensions |
| Appointment model | Hybrid: on-site appointment requests and WhatsApp contact |
| Frontend | Next.js App Router + React + TypeScript (strict) |
| Styling | Tailwind CSS, design tokens, CSS and Motion where justified |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Media | Supabase Storage |
| Validation | Zod at all trust boundaries |
| Data architecture | Shared multi-tenant initially; adapter boundaries allow isolated databases later |
| Admin | Advanced roadmap: scheduling, patients, CRM, content, automation, reports, roles |
| AI | Hybrid: deterministic rules + optional LLM grounded in clinic-approved content |
| AI autonomy | Advanced operational actions with identity checks, explicit consent/confirmation, authorization, and audit logs |

## 3. Existing repository and migration rules

The repository was previously inspected and contained `index.html`, `styles.css`, `app.js`, `favicon.svg`, and `.gitignore`. The prototype includes clinic customization, treatment and dentist information, booking demonstration, an admin-like view, and WhatsApp links. At the time of inspection, clinic settings and appointments were stored in browser `localStorage`. **Reinspect the current branch; this snapshot may be outdated.**

1. Audit all files and identify behavior to preserve.
2. Work on a feature branch; do not destroy the functioning prototype.
3. Capture a feature inventory and migration checklist before changing architecture.
4. Migrate incrementally to Next.js/TypeScript/Tailwind, with meaningful checkpoints and tests.
5. Treat browser-local booking data as demo-only. Never silently present it as a shared, confirmed production appointment.
6. Do not assume an existing Supabase project, credentials, deployed domain, or configured AI provider.
7. Never commit secrets. Provide `.env.example` with placeholders.

## 4. User roles and boundaries

- **Visitor / patient:** browse public content, search FAQs, view real clinic details, request appointments, contact WhatsApp.
- **Receptionist:** handle appointment requests, schedule, contact data and permitted administrative interactions.
- **Dentist:** manage own availability, view assigned appointments and approved administrative data; review clinical educational content.
- **Clinic admin:** manage team, public content, service catalog, scheduling rules, CRM and analytics for their clinic.
- **Platform operator:** manage tenant provisioning and shared platform configuration, with audited, least-privilege access.

Authorization must be server-enforced, not based only on hidden UI controls. Do not grant receptionists access to clinical data by default.

## 5. Public website — premium and humanized

### Design language
- Editorial layouts with generous whitespace, warm ivory/white surfaces, deep teal, soft sage, warm sand, dark readable text.
- Suggested starting tokens: `#FAF8F5`, `#FFFFFF`, `#0F4C5C`, `#DCE8E2`, `#F3EFE9`, `#14212B`. All overridable per clinic.
- Distinctive photographic hero, polished typography, thoughtful asymmetry, and a cohesive art direction.
- Genuine/authorized images of team, reception, facilities and equipment. Clearly mark stock/demo photos; do not imply they depict a real client clinic.
- Subtle image reveals, transitions and interactive affordances. Honor `prefers-reduced-motion`; prioritize Core Web Vitals.
- Fully responsive, keyboard accessible, semantic markup, appropriate contrast and focus states.

### Core sections/pages
1. Home: hero, clinic value proposition, clear booking and WhatsApp CTAs, verified trust signals.
2. About: philosophy, team, location, actual facilities and available technology.
3. Treatments: categories, search/filter, treatment detail pages.
4. Professionals: name, verified CRO number, actual qualifications, photo, biography, services and available schedules.
5. Patient information: practical pre-visit guidance and dentist-reviewed educational materials.
6. FAQ: searchable/filterable, linked to relevant treatments and next actions.
7. Booking: step-by-step appointment request with accurate state and clear confirmation.
8. Contact: verified address, hours, phone, WhatsApp, map and accessibility information.
9. Legal: privacy notice and applicable consent/terms content.

### Clinic-specific personalization
Support clinic branding, logo, typography, imagery, navigation, section order, page templates, animation presets, treatment catalog, staff profiles, verified testimonials, FAQ, contact information, booking policy, and optional custom pages. The shared engine must not hard-code one clinic's identity or content.

## 6. Educational content ontology / domain model

Educational content is a key differentiator: patients should understand general procedures and administrative steps without needing to ask repetitive questions. It must **not** substitute for a dental evaluation.

Define strongly typed models, validation and database mappings for:

- `Tenant`: id, slug, status, configuration, data-location strategy.
- `Clinic`: id, tenantId, name, verified business/contact data, location, hours, branding.
- `StaffMember`: id, tenantId, role, displayName, verified professional credentials where applicable.
- `Treatment`: id, tenantId, slug, category, displayName, overview, active, estimatedDurationMinutes where applicable.
- `TreatmentArticle`: id, tenantId, treatmentId, summary, generalIndications, procedureOverview, preparation, aftercare, risksAndLimitations, FAQs, reviewerStaffId, reviewedAt, publicationStatus, updatedAt.
- `FAQ`: id, tenantId, question, answer, category, relatedTreatmentIds, publicationStatus, reviewerStaffId, reviewedAt.
- `MediaAsset`: id, tenantId, storageKey, altText, usageRights, attribution, isDemo.
- `AvailabilityRule`: id, tenantId, professionalId, day/time windows, exceptions, timeZone.
- `AppointmentRequest`: id, tenantId, patientContactId, treatmentId, professionalId?, startAt, endAt, status, source, createdAt.
- `PatientContact`: id, tenantId, name, verified contact channel as available, privacy/consent metadata.
- `CRMLead`: id, tenantId, contactId, stage, source, assignedTo?, timestamps.
- `Interaction`: id, tenantId, contactId, channel, category, notesMinimized, timestamps.
- `AuditEvent`: id, tenantId, actorId, action, resourceType, resourceId, timestamp, metadata without sensitive payloads.

Model IDs, relations, indexes, and constraints explicitly. Separate educational content, operational scheduling and CRM contexts. Use shared references rather than copying patient contact data between modules. Avoid storing medical histories in this MVP.

### Content rules
- Each treatment article answers: what it is, general indications, common stages, variability in duration, preparation, recovery/aftercare, risks/limitations, and when an evaluation is needed.
- Initial topics: cleaning/prevention, whitening, implants, orthodontics, endodontics, restorations, and emergency evaluation.
- Distinguish clinic policy from general dental education.
- Draft content may be demo-only; production publication requires review and approval by a qualified dentist.
- Never invent credentials, testimonials, review counts, prices, equipment, insurance acceptance or clinical outcomes.
- Avoid guarantees of painlessness, results, recovery time, or suitability.
- Provide review dates and reviewer attribution for clinical articles.

## 7. Hybrid booking

**Patient flow:** choose treatment → choose professional or first available → choose date/time from server-backed availability → enter minimum necessary contact data → review → explicitly submit request → see `REQUESTED` status → clinic confirms or proposes alternative → patient receives accurate status.

Suggested states: `REQUESTED`, `PENDING_REVIEW`, `CONFIRMED`, `RESCHEDULE_REQUESTED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`. Define permitted transitions and role authorization; avoid overlapping/ambiguous states in final code.

- Booking availability must account for professional schedules, exceptions, duration and existing confirmed reservations.
- Use server-side transactions/constraints to prevent double booking and race conditions.
- Never treat a client-selected slot as authoritative.
- WhatsApp deep links may prefill administrative messages, but opening a link is **not** evidence of delivery, booking or confirmation.
- Do not put health details or other sensitive data into WhatsApp URL query strings.
- MVP may show a clearly labeled demo mode until production persistence and authentication are ready.

## 8. Administrative platform

### MVP baseline
- Authenticated clinic admin and receptionist roles.
- Booking inbox, calendar, appointment status actions and scheduling settings.
- Professionals, treatments, FAQs and basic public-site content management.
- Clinic configuration and image management.
- Basic administrative contact records, with data minimization.
- Audit trail for privileged actions.

### Advanced capabilities, staged after baseline
- CRM lead pipeline, interaction tracking, ownership and conversion reports.
- Automated reminders, internal notifications, configurable templates and opt-outs.
- Reports: requests, confirmations, cancellations, lead sources and appointment occupancy.
- Granular role permissions, multi-location support where needed.
- Marketing content/campaign management with explicit consent controls.

Do not claim external notifications are sent without a working authorized provider integration. Prefer low-cost deterministic internal flows for initial demonstrations.

## 9. Odonto AI — hybrid assistant

### Architecture
1. **Rules engine:** deterministic answers for verified hours, location, service availability, booking policies and workflow navigation.
2. **Optional LLM layer:** intent understanding and natural-language answers strictly grounded in clinic-approved, published content. Use a provider abstraction; no dependency on a specific paid provider.
3. **Tools/actions:** typed, server-authorized functions for reading available slots, creating appointment requests, requesting rescheduling, checking status after identity verification, and escalating to staff.
4. **Human handoff:** provide a clear route to receptionist/WhatsApp when uncertain or clinically sensitive.

### Safety and correctness
- No diagnosis, prescriptions, individualized treatment recommendations or fabricated clinical claims.
- Clearly state uncertainty and suggest professional evaluation when appropriate.
- Never invent appointments, prices, schedules or policies; obtain them from authoritative records.
- Identity verification before disclosing patient-specific status.
- Explicit patient confirmation before creating/changing appointments; sensitive or destructive actions require stronger authorization.
- Tool calls must enforce tenant scope and user permissions on the server; never trust model output as authorization.
- Audit action requests and outcomes without storing unnecessary sensitive conversation data.
- Rate-limit public endpoints and mitigate prompt injection; retrieved content is data, not instructions.
- If LLM unavailable, deterministic FAQs, search and booking must continue to work.

**MVP approach:** deliver rules-based FAQ/navigation first; integrate the optional LLM and operational tools after secure booking APIs exist. “Advanced autonomy” is a target capability, not permission to skip guardrails.

## 10. Multi-tenant hybrid data architecture

- Shared Supabase PostgreSQL initially, with `tenant_id` on tenant-owned records.
- RLS on all tenant-owned tables, backed by server-side authorization and verified tenant resolution.
- Do not rely on a browser-supplied tenant ID or client-only filters.
- Separate public published content policies from private appointment/contact/CRM data policies.
- Use storage paths/policies scoped by tenant and appropriate privacy settings.
- Model a `TenantDataProvider` / repository abstraction so a future tenant may use an isolated database without rewriting domain logic.
- Do not build isolated-database provisioning in the MVP unless explicitly requested.
- Test cross-tenant read, write, booking, storage and administrative access denial.

## 11. Architecture and repository organization

Suggested target structure; adapt to repository conventions after inspection:

```text
src/
  app/
    (public)/
    (admin)/
    api/
  components/
    ui/
    site/
    booking/
    admin/
  features/
    clinics/
    treatments/
    content/
    staff/
    scheduling/
    crm/
    assistant/
  lib/
    auth/
    db/
    tenancy/
    validation/
    observability/
  themes/
  types/
supabase/
  migrations/
  seed/
tests/
  unit/
  integration/
  e2e/
docs/
  architecture.md
  security.md
  content-guidelines.md
  deployment.md
  roadmap.md
.env.example
```

Use Next.js server components by default where suitable, explicit server boundaries for mutations, TypeScript strict, Zod schemas, and accessible reusable UI primitives. Avoid unnecessary dependencies and premature microservices.

## 12. Privacy, ethics and compliance

- Follow LGPD principles: purpose limitation, minimization, access control, retention, secure handling and appropriate transparency.
- Patient contact details are private. Do not store identifiable patient information in browser `localStorage` in production.
- Do not expose real patient data in demos, screenshots, seed scripts or logs.
- Protect secrets and service-role keys on the server.
- Clinical and advertising content must be reviewed for applicable Brazilian dental professional requirements before real deployment.
- Avoid fabricated reviews, CRO registrations, equipment, staff, availability and claims.
- For dental emergencies, provide contact/escalation guidance, not automated clinical triage or definitive advice.

## 13. Delivery phases

### Phase 1 — Foundation and migration (START HERE)
- Inspect repository and inventory existing features.
- Establish a safe migration plan and a working feature branch.
- Initialize or migrate to Next.js App Router, TypeScript strict, Tailwind and a consistent design token system.
- Preserve demo customization, treatment listing, appointment request flow, WhatsApp links and basic admin preview where feasible.
- Create modular feature boundaries, typed contracts and Zod schemas.
- Set up Supabase integration **without requiring credentials to run the public demo**; include `.env.example`.
- Prepare tenant-aware database migrations and RLS policies, with explicit security tests.
- Add lint/typecheck/test/build scripts and initial tests.
- Document remaining gaps; do not imply production readiness.

**Phase 1 acceptance:** app builds; public demo works without secrets; core prototype flows are preserved or any unavoidable gaps are documented; TypeScript checks pass; initial tests pass; schema/RLS migration files are reviewed; no fake real-world data claims; no secrets committed.

### Phase 2 — Premium patient website
- Photographic editorial homepage, treatment pages, professional profiles, facilities, FAQ and responsive navigation.
- Reusable visual system plus configurable clinic-specific page composition.
- Accessible animation, SEO and image optimization.

**Acceptance:** mobile/desktop polished; keyboard/reduced-motion works; demo imagery labeled; clinical content publication rules enforced.

### Phase 3 — Production-grade booking
- Shared persistence, authenticated staff, schedule rules, transactional availability, booking status workflow, WhatsApp handoff.

**Acceptance:** no double booking under concurrent requests; accurate request/confirmation semantics; tenant isolation tested.

### Phase 4 — Admin and content
- Staff dashboard, bookings, content editor, team/treatment management, roles and audit events.

**Acceptance:** role checks enforced server-side; no unauthorized cross-tenant access; clinic updates reflected on public site.

### Phase 5 — Advanced management and AI
- CRM pipeline, internal reminders, analytics, rule-based assistant, optional grounded LLM, guarded booking tools and human handoff.

**Acceptance:** no unverified medical answers; fallback works without LLM; sensitive operations require confirmation/authorization; audited actions.

### Phase 6 — Commercial readiness
- Performance, accessibility, security and integration tests; deployment documentation; tenant demo provisioning; backup/retention planning; production-readiness checklist.

**Acceptance:** all critical flows tested and limitations documented; no real deployment claimed without verification.

## 14. Engineering acceptance and quality gates

- Preserve functioning prototype features unless change is explicitly documented.
- Strong typing, validated external inputs and centralized errors.
- Server-side tenant/role checks and RLS tests.
- No fake reviews, credentials or unapproved clinical claims.
- No hardcoded API secrets; `.env.example` is complete.
- Test responsive layouts, keyboard navigation, reduced motion and key flows.
- Run typecheck, lint, tests and production build where possible; report actual results, not assumptions.
- Provide migration notes and rollback considerations for breaking changes.
- Stop after each phase for review; **do not automatically implement the entire roadmap**.

## 15. Codex execution protocol

1. Inspect the current repository and read the existing source and configuration.
2. Produce a concise audit: what exists, what is demo-only, what must be migrated, and risks.
3. Propose file-level changes for **Phase 1 only**.
4. Implement actual code, migrations, tests and documentation; do not stop at a design proposal.
5. Run the available checks and fix failures attributable to the changes.
6. Summarize files changed, verified behavior, test outputs, blockers and next steps.
7. Wait for explicit approval before Phase 2.

**Do not** invent Supabase credentials, AI provider access, deployed infrastructure or live clinical data. Ask for necessary external setup only when implementation genuinely requires it.