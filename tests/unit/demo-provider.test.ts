import { describe, expect, it } from "vitest";
import {
  buildInitialDemoAppointments,
  DEFAULT_DEMO_CLINIC,
  DEFAULT_DEMO_FAQS,
  DEFAULT_DEMO_STAFF,
  DEFAULT_DEMO_TREATMENTS,
  DEMO_TENANT_ID
} from "@/features/clinics/demoSeed";
import {
  buildSafeWhatsAppHandoffUrl,
  InMemoryTenantDataProvider
} from "@/lib/tenancy/provider";

function createProvider() {
  return new InMemoryTenantDataProvider({
    clinic: DEFAULT_DEMO_CLINIC,
    staff: DEFAULT_DEMO_STAFF,
    treatments: DEFAULT_DEMO_TREATMENTS,
    faqs: DEFAULT_DEMO_FAQS,
    appointments: buildInitialDemoAppointments()
  });
}

describe("InMemoryTenantDataProvider & safety contracts", () => {
  it("creates an appointment request with REQUESTED status", async () => {
    const provider = createProvider();
    const created = await provider.createAppointmentRequest({
      tenantId: DEMO_TENANT_ID,
      patientName: "Carlos Eduardo",
      patientPhone: "(11) 98888-7777",
      treatmentId: "tr-1",
      professionalId: "staff-1",
      dateIso: "2026-11-25",
      slotTime: "14:00"
    });

    expect(created.status).toBe("REQUESTED");
    expect(created.tenantId).toBe(DEMO_TENANT_ID);
  });

  it("prevents double booking the same professional and slot", async () => {
    const provider = createProvider();
    await provider.createAppointmentRequest({
      tenantId: DEMO_TENANT_ID,
      patientName: "Paciente 1",
      patientPhone: "(11) 91111-1111",
      treatmentId: "tr-1",
      professionalId: "staff-1",
      dateIso: "2026-11-26",
      slotTime: "09:15"
    });

    await expect(
      provider.createAppointmentRequest({
        tenantId: DEMO_TENANT_ID,
        patientName: "Paciente 2",
        patientPhone: "(11) 92222-2222",
        treatmentId: "tr-1",
        professionalId: "staff-1",
        dateIso: "2026-11-26",
        slotTime: "09:15"
      })
    ).rejects.toThrow("Horário indisponível");
  });

  it("enforces tenant isolation when querying or updating", async () => {
    const provider = createProvider();
    expect(await provider.getClinic("other-tenant")).toBeNull();
    expect(await provider.listTreatments("other-tenant")).toEqual([]);
  });

  it("builds WhatsApp handoff links without sensitive clinical notes", () => {
    const url = buildSafeWhatsAppHandoffUrl(
      "5511999999999",
      "Sua Odontologia",
      "Hoje (21/11)",
      "10:00"
    );
    expect(url).toContain("https://wa.me/5511999999999?text=");
    expect(decodeURIComponent(url)).not.toContain("dor");
  });
});
