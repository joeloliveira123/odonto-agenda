# Odonto Agenda — Architecture

## Overview
**Odonto Agenda** is a modular Next.js (App Router) + TypeScript (`strict`) + Tailwind CSS v4 platform built around a multi-tenant data boundary (`TenantDataProvider`).

## Layers
1. **Public Patient Website (`src/app/page.tsx`, `src/app/tratamentos/[slug]/page.tsx`, `src/app/privacidade/page.tsx`)**
   - Editorial clinical layout with live demo customization (`OdontoDemoClient.tsx`)
   - Published educational guides (`src/lib/content/publication.ts`)
   - Hybrid assistant widget (`OdontoAssistantWidget.tsx`)
2. **Administrative Portal (`src/app/admin/page.tsx`, `src/components/admin/AdminDashboardClient.tsx`)**
   - Booking inbox, clinic profile editor, treatment/FAQ visibility toggles, and audit trail viewer
3. **API Boundaries (`src/app/api/*`)**
   - `/api/availability` — server-side slot calculation from schedule rules, exceptions, and active reservations
   - `/api/appointments` — Zod-validated request creation with `409 Conflict` double-booking guard
   - `/api/appointments/[id]/status` — state machine + server-side RBAC enforcement
   - `/api/admin/content`, `/api/admin/audit` — tenant-scoped admin mutations with audit logging
   - `/api/assistant` — deterministic Odonto AI rules engine + clinical safety boundaries
4. **Persistence & Multi-Tenancy (`src/lib/tenancy/`, `supabase/migrations/`)**
   - Shared `InMemoryTenantDataProvider` for zero-secret public demos
   - Supabase PostgreSQL migrations (`0001_initial_schema.sql`, `0002_booking_transactions.sql`) with `tenant_id` isolation, RLS, and transactional slot locking
