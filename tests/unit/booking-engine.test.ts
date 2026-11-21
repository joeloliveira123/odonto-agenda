import { describe, expect, it } from "vitest";
import {
  buildInitialDemoAppointments,
  DEFAULT_DEMO_CLINIC,
  DEFAULT_DEMO_FAQS,
  DEFAULT_DEMO_STAFF,
  DEFAULT_DEMO_TREATMENTS,
  DEMO_TENANT_ID
} from "@/features/clinics/demoSeed";
import { computeAvailableSlots } from "@/features/scheduling/availability";
import {
  canRolePerformTransition,
  canTransitionStatus
} from "@/features/scheduling/stateMachine";
import { InMemoryTenantDataProvider } from "@/lib/tenancy/provider";
import { getDemoAvailabilityRules } from "@/lib/tenancy/serverProvider";

describe("Phase 3 production-grade booking engine", () => {
  it("computes availability respecting schedule rules, blocked dates, and bookings", () => {
    const rules = getDemoAvailabilityRules(DEMO_TENANT_ID);
    const existing = buildInitialDemoAppointments();
    // Monday 2026-11-23
    const slots = computeAvailableSlots({
      dateIso: "2026-11-23",
      durationMinutes: 45,
      professionalId: "staff-1",
      rules,
      exceptions: [],
      existingAppointments: existing
    });
    expect(slots.length).toBeGreaterThan(5);
    expect(slots.every((s) => s.available)).toBe(true);

    // Blocked date marks all slots unavailable
    const blocked = computeAvailableSlots({
      dateIso: "2026-11-23",
      durationMinutes: 45,
      professionalId: "staff-1",
      rules,
      exceptions: [
        {
          id: "ex-1",
          tenantId: DEMO_TENANT_ID,
          professionalId: "staff-1",
          dateIso: "2026-11-23",
          reason: "Feriado"
        }
      ],
      existingAppointments: existing
    });
    expect(blocked.every((s) => !s.available && s.reason === "blocked")).toBe(true);
  });

  it("prevents double booking under concurrent requests", async () => {
    const provider = new InMemoryTenantDataProvider({
      clinic: DEFAULT_DEMO_CLINIC,
      staff: DEFAULT_DEMO_STAFF,
      treatments: DEFAULT_DEMO_TREATMENTS,
      faqs: DEFAULT_DEMO_FAQS,
      appointments: []
    });

    const results = await Promise.allSettled([
      provider.createAppointmentRequest({
        tenantId: DEMO_TENANT_ID,
        patientName: "Paciente A",
        patientPhone: "(11) 91111-1111",
        treatmentId: "tr-1",
        professionalId: "staff-1",
        dateIso: "2026-11-24",
        slotTime: "10:00"
      }),
      provider.createAppointmentRequest({
        tenantId: DEMO_TENANT_ID,
        patientName: "Paciente B",
        patientPhone: "(11) 92222-2222",
        treatmentId: "tr-1",
        professionalId: "staff-1",
        dateIso: "2026-11-24",
        slotTime: "10:00"
      })
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });

  it("enforces status transitions and role permissions", () => {
    expect(canTransitionStatus("REQUESTED", "CONFIRMED")).toBe(true);
    expect(canTransitionStatus("CONFIRMED", "COMPLETED")).toBe(true);
    expect(canTransitionStatus("CANCELLED", "CONFIRMED")).toBe(false);

    expect(canRolePerformTransition("visitor", "CONFIRMED")).toBe(false);
    expect(canRolePerformTransition("visitor", "CANCELLED")).toBe(true);
    expect(canRolePerformTransition("receptionist", "CONFIRMED")).toBe(true);
  });
});
