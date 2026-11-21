# Odonto Agenda — Phase 1 Migration & Audit Notes

**Branch:** `feat/phase-1-foundation`  
**Status:** Phase 1 implemented; awaiting review before Phase 2.

## 1. Feature Inventory Preserved from Prototype (`main`)
- Live clinic branding customization (`Sua Odontologia` default, clinic name, address, primary color)
- Treatment catalog with category filters (`Prevenção`, `Estética`, `Ortodontia & Implantes`, `Urgência`) and custom procedure addition
- Dentist selection + 5-day date picker + real-time busy slot blocking
- Explicit `REQUESTED` appointment request state (never silently presented as confirmed production booking)
- Safe WhatsApp administrative handoff link (without health/clinical details in URL query strings)
- Staff demo panel (`Painel da Sua Clínica`) with KPI summary and status actions

## 2. Phase 1 Additions
- Migrated foundation to **Next.js (App Router) + React 19 + TypeScript (`strict`) + Tailwind CSS v4**
- Domain types (`src/types/domain.ts`) and **Zod** validation (`src/lib/validation/schemas.ts`)
- `TenantDataProvider` abstraction (`src/lib/tenancy/provider.ts`) with in-memory demo fallback requiring **zero Supabase secrets**
- Multi-tenant PostgreSQL schema + RLS migration (`supabase/migrations/0001_initial_schema.sql`)
- `.env.example` with placeholders
- Vitest unit tests (`tests/unit/schemas.test.ts`, `tests/unit/demo-provider.test.ts`)

## 3. Remaining Gaps (Intentional for Phases 2–6)
- Supabase Auth login & server-side session enforcement for `/admin` (Phase 3–4)
- Transactional Supabase repository implementation replacing demo fallback when env vars are set (Phase 3)
- Photographic editorial assets, treatment detail pages, and SEO metadata (Phase 2)
- Odonto AI hybrid assistant (Phase 5)
