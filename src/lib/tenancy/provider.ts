import type {
  AppointmentRequest,
  AppointmentStatus,
  Clinic,
  FAQ,
  StaffMember,
  Treatment
} from "@/types/domain";
import {
  appointmentRequestInputSchema,
  type AppointmentRequestInput
} from "@/lib/validation/schemas";

export interface TenantDataProvider {
  getClinic(tenantId: string): Promise<Clinic | null>;
  listStaff(tenantId: string): Promise<StaffMember[]>;
  listTreatments(tenantId: string): Promise<Treatment[]>;
  listPublishedFaqs(tenantId: string): Promise<FAQ[]>;
  listAppointments(tenantId: string): Promise<AppointmentRequest[]>;
  createAppointmentRequest(input: AppointmentRequestInput): Promise<AppointmentRequest>;
  updateAppointmentStatus(
    tenantId: string,
    appointmentId: string,
    nextStatus: AppointmentStatus
  ): Promise<AppointmentRequest>;
}

const ACTIVE_SLOT_STATUSES = new Set<AppointmentStatus>([
  "REQUESTED",
  "PENDING_REVIEW",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED"
]);

export class InMemoryTenantDataProvider implements TenantDataProvider {
  private clinics = new Map<string, Clinic>();
  private staff = new Map<string, StaffMember[]>();
  private treatments = new Map<string, Treatment[]>();
  private faqs = new Map<string, FAQ[]>();
  private appointments = new Map<string, AppointmentRequest[]>();

  constructor(seed: {
    clinic: Clinic;
    staff: StaffMember[];
    treatments: Treatment[];
    faqs: FAQ[];
    appointments: AppointmentRequest[];
  }) {
    const tid = seed.clinic.tenantId;
    this.clinics.set(tid, seed.clinic);
    this.staff.set(tid, seed.staff);
    this.treatments.set(tid, seed.treatments);
    this.faqs.set(tid, seed.faqs);
    this.appointments.set(tid, seed.appointments);
  }

  async getClinic(tenantId: string): Promise<Clinic | null> {
    return this.clinics.get(tenantId) ?? null;
  }

  async listStaff(tenantId: string): Promise<StaffMember[]> {
    return this.staff.get(tenantId) ?? [];
  }

  async listTreatments(tenantId: string): Promise<Treatment[]> {
    return (this.treatments.get(tenantId) ?? []).filter((t) => t.active);
  }

  async listPublishedFaqs(tenantId: string): Promise<FAQ[]> {
    return (this.faqs.get(tenantId) ?? []).filter((f) => f.publicationStatus === "published");
  }

  async listAppointments(tenantId: string): Promise<AppointmentRequest[]> {
    return [...(this.appointments.get(tenantId) ?? [])];
  }

  async listAllFaqs(tenantId: string): Promise<FAQ[]> {
    return [...(this.faqs.get(tenantId) ?? [])];
  }

  async listAllTreatments(tenantId: string): Promise<Treatment[]> {
    return [...(this.treatments.get(tenantId) ?? [])];
  }

  async updateClinic(
    tenantId: string,
    patch: Partial<Pick<Clinic, "name" | "subtitle" | "address" | "hoursLabel" | "whatsappPhone">>
  ): Promise<Clinic> {
    const clinic = this.clinics.get(tenantId);
    if (!clinic) throw new Error("Clínica não encontrada.");
    const updated = { ...clinic, ...patch };
    this.clinics.set(tenantId, updated);
    return updated;
  }

  async toggleTreatmentActive(tenantId: string, treatmentId: string): Promise<Treatment> {
    const list = this.treatments.get(tenantId) ?? [];
    const target = list.find((t) => t.id === treatmentId);
    if (!target) throw new Error("Tratamento não encontrado.");
    target.active = !target.active;
    return target;
  }

  async toggleFaqPublication(tenantId: string, faqId: string): Promise<FAQ> {
    const list = this.faqs.get(tenantId) ?? [];
    const target = list.find((f) => f.id === faqId);
    if (!target) throw new Error("FAQ não encontrada.");
    target.publicationStatus = target.publicationStatus === "published" ? "draft" : "published";
    return target;
  }

  async createAppointmentRequest(input: AppointmentRequestInput): Promise<AppointmentRequest> {
    const parsed = appointmentRequestInputSchema.parse(input);
    const tenantTreatments = this.treatments.get(parsed.tenantId) ?? [];
    const treatment = tenantTreatments.find((t) => t.id === parsed.treatmentId);
    if (!treatment) {
      throw new Error("Tratamento não encontrado para esta clínica.");
    }

    const existing = this.appointments.get(parsed.tenantId) ?? [];
    const conflict = existing.some(
      (a) =>
        a.dateIso === parsed.dateIso &&
        a.slotTime === parsed.slotTime &&
        ACTIVE_SLOT_STATUSES.has(a.status) &&
        (!parsed.professionalId ||
          parsed.professionalId === "any" ||
          a.professionalId === parsed.professionalId)
    );

    if (conflict) {
      throw new Error("Horário indisponível. Escolha outro horário livre.");
    }

    const staffList = this.staff.get(parsed.tenantId) ?? [];
    const pro = staffList.find((s) => s.id === parsed.professionalId);

    const created: AppointmentRequest = {
      id: `req-${Date.now()}`,
      tenantId: parsed.tenantId,
      patientContactId: `contact-${Date.now()}`,
      patientName: parsed.patientName,
      patientPhone: parsed.patientPhone,
      treatmentId: treatment.id,
      treatmentName: treatment.displayName,
      professionalId: pro?.id,
      professionalName: pro?.displayName ?? "Primeiro horário livre",
      dateIso: parsed.dateIso,
      dateLabel: parsed.dateIso,
      slotTime: parsed.slotTime,
      estimatedDurationMinutes: treatment.estimatedDurationMinutes,
      demoPriceBrl: treatment.demoPriceBrl,
      notes: parsed.notes,
      status: "REQUESTED",
      source: "web_demo",
      createdAt: new Date().toISOString()
    };

    this.appointments.set(parsed.tenantId, [created, ...existing]);
    return created;
  }

  async updateAppointmentStatus(
    tenantId: string,
    appointmentId: string,
    nextStatus: AppointmentStatus
  ): Promise<AppointmentRequest> {
    const list = this.appointments.get(tenantId) ?? [];
    const target = list.find((a) => a.id === appointmentId);
    if (!target) {
      throw new Error("Solicitação não encontrada neste tenant.");
    }
    target.status = nextStatus;
    return target;
  }
}

/**
 * Builds a WhatsApp administrative contact link without putting clinical/health
 * details or sensitive patient notes into URL query strings (MASTER_SPEC §7).
 */
export function buildSafeWhatsAppHandoffUrl(
  whatsappPhone: string,
  clinicName: string,
  dateLabel: string,
  slotTime: string
): string {
  const digits = whatsappPhone.replace(/\D/g, "") || "5511999999999";
  const text = encodeURIComponent(
    `Olá ${clinicName}, enviei uma solicitação de agendamento pelo site para ${dateLabel} às ${slotTime} e gostaria de confirmar a disponibilidade.`
  );
  return `https://wa.me/${digits}?text=${text}`;
}
