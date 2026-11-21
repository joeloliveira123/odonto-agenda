import { NextRequest, NextResponse } from "next/server";
import { DEMO_TENANT_ID } from "@/features/clinics/demoSeed";
import { computeAvailableSlots } from "@/features/scheduling/availability";
import {
  getDemoAvailabilityRules,
  getServerTenantProvider
} from "@/lib/tenancy/serverProvider";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId") || DEMO_TENANT_ID;
  const dateIso = searchParams.get("dateIso") || new Date().toISOString().slice(0, 10);
  const treatmentId = searchParams.get("treatmentId") || "tr-1";
  const professionalId = searchParams.get("professionalId") || "any";

  const provider = getServerTenantProvider();
  const treatments = await provider.listTreatments(tenantId);
  const treatment = treatments.find((t) => t.id === treatmentId);
  if (!treatment) {
    return NextResponse.json({ error: "Tratamento não encontrado." }, { status: 404 });
  }

  const existingAppointments = await provider.listAppointments(tenantId);
  const rules = getDemoAvailabilityRules(tenantId);

  const slots = computeAvailableSlots({
    dateIso,
    durationMinutes: treatment.estimatedDurationMinutes,
    professionalId,
    rules,
    exceptions: [],
    existingAppointments
  });

  return NextResponse.json({
    tenantId,
    dateIso,
    treatmentId,
    durationMinutes: treatment.estimatedDurationMinutes,
    slots
  });
}
