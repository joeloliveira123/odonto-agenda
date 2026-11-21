import { describe, expect, it } from "vitest";
import { DEMO_TENANT_ID } from "@/features/clinics/demoSeed";
import { assertTenantScope, hasPermission } from "@/lib/auth/rbac";
import { listAuditEvents, recordAuditEvent } from "@/lib/observability/audit";

describe("Phase 4 server-side RBAC, tenant scope, and audit", () => {
  it("enforces role permissions accurately", () => {
    expect(hasPermission("visitor", "manage_bookings")).toBe(false);
    expect(hasPermission("visitor", "view_audit_events")).toBe(false);

    expect(hasPermission("receptionist", "manage_bookings")).toBe(true);
    expect(hasPermission("receptionist", "manage_clinic_settings")).toBe(false);

    expect(hasPermission("dentist", "review_clinical_content")).toBe(true);
    expect(hasPermission("dentist", "manage_clinic_settings")).toBe(false);

    expect(hasPermission("clinic_admin", "manage_clinic_settings")).toBe(true);
    expect(hasPermission("clinic_admin", "view_audit_events")).toBe(true);
  });

  it("blocks cross-tenant access", () => {
    expect(assertTenantScope(DEMO_TENANT_ID, DEMO_TENANT_ID)).toBe(true);
    expect(assertTenantScope(DEMO_TENANT_ID, "other-tenant")).toBe(false);
    expect(assertTenantScope("", DEMO_TENANT_ID)).toBe(false);
  });

  it("records audit events scoped by tenant", () => {
    recordAuditEvent({
      tenantId: DEMO_TENANT_ID,
      actorId: "admin-1",
      action: "clinic.updated",
      resourceType: "clinic",
      resourceId: "clinic-demo-1"
    });
    const events = listAuditEvents(DEMO_TENANT_ID);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0]?.action).toBe("clinic.updated");
    expect(listAuditEvents("other-tenant")).toEqual([]);
  });
});
