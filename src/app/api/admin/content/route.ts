import { NextRequest, NextResponse } from "next/server";
import { DEMO_TENANT_ID } from "@/features/clinics/demoSeed";
import { assertTenantScope, hasPermission } from "@/lib/auth/rbac";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getServerTenantProvider } from "@/lib/tenancy/serverProvider";
import type { UserRole } from "@/types/domain";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId") || DEMO_TENANT_ID;
  const actorTenantId = req.headers.get("x-tenant-id") || DEMO_TENANT_ID;
  const role = (req.headers.get("x-demo-role") || "clinic_admin") as UserRole;

  if (!assertTenantScope(actorTenantId, tenantId)) {
    return NextResponse.json({ error: "Acesso negado entre tenants." }, { status: 403 });
  }
  if (!hasPermission(role, "manage_bookings")) {
    return NextResponse.json({ error: "Perfil sem acesso administrativo." }, { status: 403 });
  }

  const provider = getServerTenantProvider();
  const [clinic, treatments, faqs, staff, appointments] = await Promise.all([
    provider.getClinic(tenantId),
    provider.listAllTreatments(tenantId),
    provider.listAllFaqs(tenantId),
    provider.listStaff(tenantId),
    provider.listAppointments(tenantId)
  ]);

  return NextResponse.json({ clinic, treatments, faqs, staff, appointments });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = (body.tenantId as string | undefined) || DEMO_TENANT_ID;
    const actorTenantId = req.headers.get("x-tenant-id") || tenantId;
    const role = ((body.role as UserRole | undefined) || "clinic_admin") as UserRole;
    const actorId = (body.actorId as string | undefined) || "demo-staff";

    if (!assertTenantScope(actorTenantId, tenantId)) {
      return NextResponse.json({ error: "Acesso negado entre tenants." }, { status: 403 });
    }

    const provider = getServerTenantProvider();

    if (body.action === "update_clinic") {
      if (!hasPermission(role, "manage_clinic_settings")) {
        return NextResponse.json({ error: "Sem permissão para editar dados da clínica." }, { status: 403 });
      }
      const updated = await provider.updateClinic(tenantId, body.patch ?? {});
      recordAuditEvent({
        tenantId,
        actorId,
        action: "clinic.updated",
        resourceType: "clinic",
        resourceId: updated.id
      });
      return NextResponse.json({ clinic: updated });
    }

    if (body.action === "toggle_treatment") {
      if (!hasPermission(role, "manage_content")) {
        return NextResponse.json({ error: "Sem permissão para editar tratamentos." }, { status: 403 });
      }
      const updated = await provider.toggleTreatmentActive(tenantId, String(body.treatmentId));
      recordAuditEvent({
        tenantId,
        actorId,
        action: "treatment.toggled",
        resourceType: "treatment",
        resourceId: updated.id
      });
      return NextResponse.json({ treatment: updated });
    }

    if (body.action === "toggle_faq") {
      if (!hasPermission(role, "review_clinical_content")) {
        return NextResponse.json({ error: "Sem permissão para publicar FAQs." }, { status: 403 });
      }
      const updated = await provider.toggleFaqPublication(tenantId, String(body.faqId));
      recordAuditEvent({
        tenantId,
        actorId,
        action: "faq.publication_toggled",
        resourceType: "faq",
        resourceId: updated.id
      });
      return NextResponse.json({ faq: updated });
    }

    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao atualizar conteúdo." },
      { status: 400 }
    );
  }
}
