import { NextRequest, NextResponse } from "next/server";
import { DEMO_TENANT_ID } from "@/features/clinics/demoSeed";
import { getServerTenantProvider } from "@/lib/tenancy/serverProvider";
import { appointmentRequestInputSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId") || DEMO_TENANT_ID;
  const provider = getServerTenantProvider();
  const appointments = await provider.listAppointments(tenantId);
  return NextResponse.json({ tenantId, appointments });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = appointmentRequestInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const provider = getServerTenantProvider();
    const created = await provider.createAppointmentRequest(parsed.data);
    return NextResponse.json({ appointment: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao processar solicitação.";
    const status = message.includes("indisponível") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
