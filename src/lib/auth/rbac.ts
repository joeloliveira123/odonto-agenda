import type { UserRole } from "@/types/domain";

export type AdminPermission =
  | "manage_bookings"
  | "manage_content"
  | "review_clinical_content"
  | "manage_clinic_settings"
  | "view_audit_events";

const ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
  visitor: [],
  receptionist: ["manage_bookings"],
  dentist: ["manage_bookings", "review_clinical_content"],
  clinic_admin: [
    "manage_bookings",
    "manage_content",
    "review_clinical_content",
    "manage_clinic_settings",
    "view_audit_events"
  ],
  platform_operator: [
    "manage_bookings",
    "manage_content",
    "review_clinical_content",
    "manage_clinic_settings",
    "view_audit_events"
  ]
};

export function hasPermission(role: UserRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function assertTenantScope(actorTenantId: string, targetTenantId: string): boolean {
  return Boolean(actorTenantId) && actorTenantId === targetTenantId;
}
