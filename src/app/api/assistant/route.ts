import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_TENANT_ID } from "@/features/clinics/demoSeed";
import { answerWithOdontoAi } from "@/features/assistant/odontoAi";
import { recordAuditEvent } from "@/lib/observability/audit";
import { getServerTenantProvider } from "@/lib/tenancy/serverProvider";

const assistantInputSchema = z.object({
  tenantId: z.string().min(1).optional(),
  question: z.string().trim().min(1, "Digite uma pergunta.").max(400)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = assistantInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Pergunta inválida." },
        { status: 400 }
      );
    }

    const tenantId = parsed.data.tenantId || DEMO_TENANT_ID;
    const provider = getServerTenantProvider();
    const [clinic, treatments, faqs] = await Promise.all([
      provider.getClinic(tenantId),
      provider.listTreatments(tenantId),
      provider.listPublishedFaqs(tenantId)
    ]);

    if (!clinic) {
      return NextResponse.json({ error: "Clínica não encontrada." }, { status: 404 });
    }

    const reply = answerWithOdontoAi({
      question: parsed.data.question,
      clinic,
      treatments,
      faqs
    });

    recordAuditEvent({
      tenantId,
      actorId: "public-visitor",
      action: `assistant.${reply.mode}`,
      resourceType: "assistant",
      resourceId: clinic.id
    });

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Erro no assistente." }, { status: 500 });
  }
}
