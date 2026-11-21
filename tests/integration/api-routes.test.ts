import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { DEMO_TENANT_ID } from "@/features/clinics/demoSeed";
import { GET as getAvailability } from "@/app/api/availability/route";
import { POST as postAppointment } from "@/app/api/appointments/route";
import { PATCH as patchStatus } from "@/app/api/appointments/[id]/status/route";
import { POST as postAssistant } from "@/app/api/assistant/route";

describe("Phase 6 API route integration tests", () => {
  it("checks availability, creates booking, blocks double-booking (409), and enforces RBAC on status", async () => {
    const availReq = new NextRequest(
      `http://localhost/api/availability?tenantId=${DEMO_TENANT_ID}&dateIso=2026-11-27&treatmentId=tr-1&professionalId=staff-1`
    );
    const availRes = await getAvailability(availReq);
    expect(availRes.status).toBe(200);
    const availJson = await availRes.json();
    expect(availJson.slots.length).toBeGreaterThan(0);

    const createReq = new NextRequest("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: DEMO_TENANT_ID,
        patientName: "Fernanda Teste",
        patientPhone: "(11) 99999-1234",
        treatmentId: "tr-1",
        professionalId: "staff-1",
        dateIso: "2026-11-27",
        slotTime: "10:00"
      })
    });
    const createRes = await postAppointment(createReq);
    expect(createRes.status).toBe(201);
    const createdJson = await createRes.json();
    const createdId = createdJson.appointment.id as string;

    // Duplicate slot must return 409 Conflict
    const dupReq = new NextRequest("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: DEMO_TENANT_ID,
        patientName: "Outro Paciente",
        patientPhone: "(11) 98888-1234",
        treatmentId: "tr-1",
        professionalId: "staff-1",
        dateIso: "2026-11-27",
        slotTime: "10:00"
      })
    });
    const dupRes = await postAppointment(dupReq);
    expect(dupRes.status).toBe(409);

    // Visitor cannot confirm appointment (403)
    const forbiddenReq = new NextRequest(
      `http://localhost/api/appointments/${createdId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: DEMO_TENANT_ID,
          role: "visitor",
          nextStatus: "CONFIRMED"
        })
      }
    );
    const forbiddenRes = await patchStatus(forbiddenReq, {
      params: Promise.resolve({ id: createdId })
    });
    expect(forbiddenRes.status).toBe(403);

    // Receptionist can confirm appointment (200)
    const confirmReq = new NextRequest(
      `http://localhost/api/appointments/${createdId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: DEMO_TENANT_ID,
          role: "receptionist",
          nextStatus: "CONFIRMED"
        })
      }
    );
    const confirmRes = await patchStatus(confirmReq, {
      params: Promise.resolve({ id: createdId })
    });
    expect(confirmRes.status).toBe(200);
  });

  it("handles Odonto AI safety and rules via POST /api/assistant", async () => {
    const req = new NextRequest("http://localhost/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: DEMO_TENANT_ID,
        question: "Qual o horário de atendimento?"
      })
    });
    const res = await postAssistant(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reply.mode).toBe("rules_engine");
  });
});
