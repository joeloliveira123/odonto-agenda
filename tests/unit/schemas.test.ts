import { describe, expect, it } from "vitest";
import {
  appointmentRequestInputSchema,
  clinicCustomizationSchema,
  newTreatmentInputSchema
} from "@/lib/validation/schemas";

describe("Validation schemas (Phase 1)", () => {
  it("accepts valid appointment request input", () => {
    const res = appointmentRequestInputSchema.safeParse({
      tenantId: "demo-tenant-sua-odontologia",
      patientName: "Ana Paula Ferreira",
      patientPhone: "(11) 99999-9999",
      treatmentId: "tr-1",
      professionalId: "staff-1",
      dateIso: "2026-11-21",
      slotTime: "10:00",
      notes: "Preferência pela manhã"
    });
    expect(res.success).toBe(true);
  });

  it("rejects invalid date or slot format", () => {
    const res = appointmentRequestInputSchema.safeParse({
      tenantId: "demo-tenant-sua-odontologia",
      patientName: "Ana Paula",
      patientPhone: "11999999999",
      treatmentId: "tr-1",
      dateIso: "21/11/2026",
      slotTime: "10h"
    });
    expect(res.success).toBe(false);
  });

  it("validates hex branding color and clinic name", () => {
    expect(
      clinicCustomizationSchema.safeParse({
        name: "Clínica Exemplo",
        subtitle: "Odontologia",
        address: "Av. Paulista, 1420",
        whatsappPhone: "5511999999999",
        primaryColor: "#0F4C5C"
      }).success
    ).toBe(true);

    expect(
      clinicCustomizationSchema.safeParse({
        name: "A",
        subtitle: "Odonto",
        address: "Rua X",
        whatsappPhone: "123",
        primaryColor: "blue"
      }).success
    ).toBe(false);
  });

  it("validates new treatment input", () => {
    expect(
      newTreatmentInputSchema.safeParse({
        displayName: "Faceta em Resina",
        demoPriceBrl: 350,
        estimatedDurationMinutes: 60
      }).success
    ).toBe(true);
  });
});
