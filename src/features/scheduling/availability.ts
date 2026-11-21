import type {
  AppointmentRequest,
  AppointmentStatus,
  AvailabilityRule
} from "@/types/domain";

export interface AvailabilityException {
  id: string;
  tenantId: string;
  professionalId?: string;
  dateIso: string;
  reason: string;
}

export interface SlotAvailability {
  time: string;
  available: boolean;
  reason?: "booked" | "blocked" | "outside_schedule";
}

const ACTIVE_STATUSES = new Set<AppointmentStatus>([
  "REQUESTED",
  "PENDING_REVIEW",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED"
]);

function toMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(":");
  return Number(hStr) * 60 + Number(mStr);
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function computeAvailableSlots(params: {
  dateIso: string;
  durationMinutes: number;
  professionalId?: string;
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  existingAppointments: AppointmentRequest[];
  stepMinutes?: number;
}): SlotAvailability[] {
  const {
    dateIso,
    durationMinutes,
    professionalId,
    rules,
    exceptions,
    existingAppointments,
    stepMinutes = 45
  } = params;

  const dayOfWeek = new Date(`${dateIso}T12:00:00Z`).getUTCDay();

  const isDateBlocked = exceptions.some(
    (ex) =>
      ex.dateIso === dateIso &&
      (!ex.professionalId || !professionalId || ex.professionalId === professionalId)
  );

  const matchingRules = rules.filter(
    (r) =>
      r.weekday === dayOfWeek &&
      (!professionalId || professionalId === "any" || r.professionalId === professionalId)
  );

  if (matchingRules.length === 0) {
    return [];
  }

  const startMin = Math.min(...matchingRules.map((r) => toMinutes(r.startTime)));
  const endMin = Math.max(...matchingRules.map((r) => toMinutes(r.endTime)));

  const activeOnDay = existingAppointments.filter(
    (a) =>
      a.dateIso === dateIso &&
      ACTIVE_STATUSES.has(a.status) &&
      (!professionalId || professionalId === "any" || a.professionalId === professionalId)
  );

  const slots: SlotAvailability[] = [];
  for (let cursor = startMin; cursor + durationMinutes <= endMin; cursor += stepMinutes) {
    const slotTime = fromMinutes(cursor);
    if (isDateBlocked) {
      slots.push({ time: slotTime, available: false, reason: "blocked" });
      continue;
    }

    const slotEnd = cursor + durationMinutes;
    const overlaps = activeOnDay.some((apt) => {
      const aptStart = toMinutes(apt.slotTime);
      const aptEnd = aptStart + apt.estimatedDurationMinutes;
      return cursor < aptEnd && slotEnd > aptStart;
    });

    slots.push({
      time: slotTime,
      available: !overlaps,
      reason: overlaps ? "booked" : undefined
    });
  }

  return slots;
}
