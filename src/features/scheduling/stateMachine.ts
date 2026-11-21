import type { AppointmentStatus, UserRole } from "@/types/domain";

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  REQUESTED: ["PENDING_REVIEW", "CONFIRMED", "RESCHEDULE_REQUESTED", "CANCELLED"],
  PENDING_REVIEW: ["CONFIRMED", "RESCHEDULE_REQUESTED", "CANCELLED"],
  CONFIRMED: ["RESCHEDULE_REQUESTED", "CANCELLED", "COMPLETED", "NO_SHOW"],
  RESCHEDULE_REQUESTED: ["CONFIRMED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: []
};

const STAFF_ROLES = new Set<UserRole>(["receptionist", "dentist", "clinic_admin", "platform_operator"]);

export function canTransitionStatus(
  current: AppointmentStatus,
  next: AppointmentStatus
): boolean {
  return ALLOWED_TRANSITIONS[current].includes(next);
}

export function canRolePerformTransition(
  role: UserRole,
  next: AppointmentStatus
): boolean {
  if (STAFF_ROLES.has(role)) return true;
  // Visitors may only request cancellation or rescheduling of their own request
  return next === "CANCELLED" || next === "RESCHEDULE_REQUESTED";
}
