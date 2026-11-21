import { DEMO_TENANT_ID } from "@/features/clinics/demoSeed";
import type { AppointmentRequest, CRMLead } from "@/types/domain";

export interface CRMAnalyticsSummary {
  totalLeads: number;
  scheduledOrClosed: number;
  conversionRatePct: number;
  bySource: Record<string, number>;
  appointmentConfirmationRatePct: number;
}

export function buildDemoCrmLeads(tenantId: string = DEMO_TENANT_ID): CRMLead[] {
  const now = new Date().toISOString();
  return [
    {
      id: "lead-1",
      tenantId,
      contactId: "demo-contact-1",
      stage: "scheduled",
      source: "Site Público",
      assignedTo: "Recepção",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "lead-2",
      tenantId,
      contactId: "demo-contact-2",
      stage: "contacted",
      source: "WhatsApp",
      assignedTo: "Recepção",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "lead-3",
      tenantId,
      contactId: "demo-contact-3",
      stage: "closed",
      source: "Indicação",
      assignedTo: "Dra. Camila Mendes (Demo)",
      createdAt: now,
      updatedAt: now
    }
  ];
}

export function computeCrmAnalytics(
  leads: CRMLead[],
  appointments: AppointmentRequest[]
): CRMAnalyticsSummary {
  const totalLeads = leads.length;
  const scheduledOrClosed = leads.filter(
    (l) => l.stage === "scheduled" || l.stage === "closed"
  ).length;
  const conversionRatePct =
    totalLeads > 0 ? Math.round((scheduledOrClosed / totalLeads) * 100) : 0;

  const bySource: Record<string, number> = {};
  for (const lead of leads) {
    bySource[lead.source] = (bySource[lead.source] ?? 0) + 1;
  }

  const nonCancelled = appointments.filter((a) => a.status !== "CANCELLED");
  const confirmed = nonCancelled.filter(
    (a) => a.status === "CONFIRMED" || a.status === "COMPLETED"
  );
  const appointmentConfirmationRatePct =
    nonCancelled.length > 0
      ? Math.round((confirmed.length / nonCancelled.length) * 100)
      : 0;

  return {
    totalLeads,
    scheduledOrClosed,
    conversionRatePct,
    bySource,
    appointmentConfirmationRatePct
  };
}
