import { z } from "zod";

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (#RRGGBB).");

export const clinicCustomizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome da clínica (mínimo 2 caracteres).")
    .max(80, "Nome muito longo."),
  subtitle: z.string().trim().min(2).max(100),
  address: z.string().trim().min(4).max(140),
  whatsappPhone: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, "Informe apenas dígitos com DDI/DDD (ex: 5511999999999)."),
  primaryColor: hexColorSchema
});

export const appointmentRequestInputSchema = z.object({
  tenantId: z.string().min(1),
  patientName: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo.")
    .max(100, "Nome muito longo."),
  patientPhone: z
    .string()
    .trim()
    .min(8, "Informe um telefone ou WhatsApp válido.")
    .max(24, "Telefone inválido."),
  treatmentId: z.string().min(1, "Selecione um tratamento."),
  professionalId: z.string().optional(),
  dateIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido."),
  notes: z.string().trim().max(300).optional()
});

export const appointmentStatusTransitionSchema = z.object({
  appointmentId: z.string().min(1),
  nextStatus: z.enum([
    "REQUESTED",
    "PENDING_REVIEW",
    "CONFIRMED",
    "RESCHEDULE_REQUESTED",
    "CANCELLED",
    "COMPLETED",
    "NO_SHOW"
  ])
});

export const newTreatmentInputSchema = z.object({
  displayName: z.string().trim().min(2, "Informe o nome do procedimento.").max(80),
  demoPriceBrl: z.number().positive("Valor deve ser maior que zero.").max(50000),
  estimatedDurationMinutes: z.number().int().min(15).max(240),
  category: z.enum(["Prevencao", "Estetica", "Reabilitacao", "Urgencia"]).default("Estetica")
});

export type ClinicCustomizationInput = z.infer<typeof clinicCustomizationSchema>;
export type AppointmentRequestInput = z.infer<typeof appointmentRequestInputSchema>;
export type NewTreatmentInput = z.infer<typeof newTreatmentInputSchema>;
