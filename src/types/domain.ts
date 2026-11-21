export type UserRole =
  | "visitor"
  | "receptionist"
  | "dentist"
  | "clinic_admin"
  | "platform_operator";

export type PublicationStatus = "draft" | "reviewed" | "published";

export type AppointmentStatus =
  | "REQUESTED"
  | "PENDING_REVIEW"
  | "CONFIRMED"
  | "RESCHEDULE_REQUESTED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type TreatmentCategory = "Prevencao" | "Estetica" | "Reabilitacao" | "Urgencia";

export interface Tenant {
  id: string;
  slug: string;
  status: "demo" | "active" | "suspended";
  dataLocationStrategy: "shared" | "isolated";
}

export interface ClinicBranding {
  primaryColor: string;
  surfaceColor: string;
  warmAccentColor: string;
  inkColor: string;
}

export interface Clinic {
  id: string;
  tenantId: string;
  name: string;
  subtitle: string;
  address: string;
  hoursLabel: string;
  whatsappPhone: string;
  isDemo: boolean;
  branding: ClinicBranding;
}

export interface StaffMember {
  id: string;
  tenantId: string;
  role: "dentist" | "receptionist" | "clinic_admin";
  displayName: string;
  specialty: string;
  croRegistration?: string;
  bio: string;
  isDemo: boolean;
}

export interface Treatment {
  id: string;
  tenantId: string;
  slug: string;
  category: TreatmentCategory;
  categoryLabel: string;
  displayName: string;
  overview: string;
  clinicDifferential: string;
  estimatedDurationMinutes: number;
  demoPriceBrl: number;
  active: boolean;
}

export interface TreatmentArticle {
  id: string;
  tenantId: string;
  treatmentId: string;
  summary: string;
  generalIndications: string;
  procedureOverview: string;
  preparation: string;
  aftercare: string;
  risksAndLimitations: string;
  reviewerStaffId?: string;
  reviewedAt?: string;
  publicationStatus: PublicationStatus;
  updatedAt: string;
}

export interface FAQ {
  id: string;
  tenantId: string;
  question: string;
  answer: string;
  category: string;
  relatedTreatmentIds: string[];
  publicationStatus: PublicationStatus;
  reviewerStaffId?: string;
  reviewedAt?: string;
}

export interface MediaAsset {
  id: string;
  tenantId: string;
  storageKey: string;
  altText: string;
  usageRights: string;
  attribution?: string;
  isDemo: boolean;
}

export interface AvailabilityRule {
  id: string;
  tenantId: string;
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  timeZone: string;
}

export interface PatientContact {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  consentAcceptedAt: string;
}

export interface AppointmentRequest {
  id: string;
  tenantId: string;
  patientContactId: string;
  patientName: string;
  patientPhone: string;
  treatmentId: string;
  treatmentName: string;
  professionalId?: string;
  professionalName: string;
  dateIso: string;
  dateLabel: string;
  slotTime: string;
  estimatedDurationMinutes: number;
  demoPriceBrl: number;
  notes?: string;
  status: AppointmentStatus;
  source: "web_demo" | "web_public" | "whatsapp_handoff";
  createdAt: string;
}

export interface CRMLead {
  id: string;
  tenantId: string;
  contactId: string;
  stage: "new" | "contacted" | "scheduled" | "closed" | "lost";
  source: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  tenantId: string;
  contactId: string;
  channel: "web" | "whatsapp" | "phone";
  category: string;
  notesMinimized: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
}
