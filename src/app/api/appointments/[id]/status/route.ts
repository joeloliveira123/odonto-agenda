import { NextRequest, NextResponse } from "next/server";
import { DEMO_TENANT_ID } from "@/features/clinics/demoSeed";
import {
  canRolePerformTransition,
  canTransitionStatus
} from "@/features/scheduling/stateMachine";
import { getServerTenantProvider } from "@/lib/tenancy/serverProvider";
import { appointmentStatusTransitionSchema } from "@/lib/validation/schemas";
import type { UserRole } from "@/types/domain";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const tenantId = (body.tenantId as string | undefined) || DEMO_TENANT_ID;
    const role = ((body.role as UserRole | undefined) || "receptionist") as UserRole;

    const parsed = appointmentStatusTransitionSchema.safeParse({
      appointmentId: id,
      nextStatus: body.nextStatus
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Transição inválida." }, { status: 400 });
    }

    if (!canRolePerformTransition(role, parsed.data.nextStatus)) {
      return NextResponse.json(
        { error: "Perfil sem permissão para esta alteração de status." },
        { status: 403 }
      );
    }

    const provider = getServerTenantProvider();
    const list = await provider.listAppointments(tenantId);
    const current = list.find((a) => a.id === id);
    if (!current) {
      return NextResponse.json(
        { error: "Solicitação não encontrada para esta clínica." },
        { status: 404 }
      );
    }

    if (!canTransitionStatus(current.status, parsed.data.nextStatus)) {
      return NextResponse.json(
        {
          error: `Transição de ${current.status} para ${parsed.data.nextStatus} não é permitida.`
        },
        { status: 422 }
      );
    }

    const updated = await provider.updateAppointmentStatus(
      tenantId,
      id,
      parsed.data.nextStatus
    );

    return NextResponse.json({ appointment: updated });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar status." }, { status: 500 });
  }
}
