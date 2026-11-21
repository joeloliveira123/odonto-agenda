import { NextRequest, NextResponse } from "next/server";
import { DEMO_TENANT_ID } from "@/features/clinics/demoSeed";
import { assertTenantScope, hasPermission } from "@/lib/auth/rbac";
import { listAuditEvents } from "@/lib/observability/audit";
import type { UserRole } from "@/types/domain";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId") || DEMO_TENANT_ID;
  const actorTenantId = req.headers.get("x-tenant-id") || DEMO_TENANT_ID;
  const role = (req.headers.get("x-demo-role") || "clinic_admin") as UserRole;

  if (!assertTenantScope(actorTenantId, tenantId)) {
    return NextResponse.json({ error: "Acesso negado entre tenants." }, { status: 403 });
  }
  if (!hasPermission(role, "view_audit_events")) {
    return NextResponse.json({ error: "Sem permissão para visualizar auditoria." }, { status: 403 });
  }

  return NextResponse.json({ tenantId, events: listAuditEvents(tenantId) });
}
