import type {
  AppointmentRequest,
  Clinic,
  FAQ,
  StaffMember,
  Treatment
} from "@/types/domain";

export const DEMO_TENANT_ID = "demo-tenant-sua-odontologia";

export const DEFAULT_DEMO_CLINIC: Clinic = {
  id: "clinic-demo-1",
  tenantId: DEMO_TENANT_ID,
  name: "Sua Odontologia",
  subtitle: "Odontologia Humanizada · Modo Demonstração",
  address: "Av. Paulista, 1420 · Bela Vista, São Paulo (Exemplo)",
  hoursLabel: "Seg a Sex 08h–19h · Sáb 08h–14h",
  whatsappPhone: "5511999999999",
  isDemo: true,
  branding: {
    primaryColor: "#0F4C5C",
    surfaceColor: "#FAF8F5",
    warmAccentColor: "#C87D55",
    inkColor: "#14212B"
  }
};

export const DEFAULT_DEMO_STAFF: StaffMember[] = [
  {
    id: "staff-1",
    tenantId: DEMO_TENANT_ID,
    role: "dentist",
    displayName: "Dra. Camila Mendes (Demo)",
    specialty: "Ortodontia & Estética",
    croRegistration: "CRO-SP 00000 (Exemplo)",
    bio: "Perfil ilustrativo para demonstração de alinhadores transparentes e planejamento digital.",
    isDemo: true
  },
  {
    id: "staff-2",
    tenantId: DEMO_TENANT_ID,
    role: "dentist",
    displayName: "Dr. Rafael Costa (Demo)",
    specialty: "Implantodontia & Prótese",
    croRegistration: "CRO-SP 00000 (Exemplo)",
    bio: "Perfil ilustrativo para demonstração de reabilitação oral e planejamento 3D.",
    isDemo: true
  },
  {
    id: "staff-3",
    tenantId: DEMO_TENANT_ID,
    role: "dentist",
    displayName: "Dra. Beatriz Lima (Demo)",
    specialty: "Clínica Geral & Endodontia",
    croRegistration: "CRO-SP 00000 (Exemplo)",
    bio: "Perfil ilustrativo para demonstração de prevenção e atendimento acolhedor.",
    isDemo: true
  }
];

export const DEFAULT_DEMO_TREATMENTS: Treatment[] = [
  {
    id: "tr-1",
    tenantId: DEMO_TENANT_ID,
    slug: "avaliacao-limpeza",
    category: "Prevencao",
    categoryLabel: "Prevenção",
    displayName: "Avaliação + Limpeza Completa",
    overview:
      "Check-up odontológico completo com exame clínico, remoção de tártaro com ultrassom e polimento preventivo.",
    clinicDifferential:
      "Orientação clara em tela e plano preventivo transparente antes de qualquer procedimento.",
    estimatedDurationMinutes: 45,
    demoPriceBrl: 180,
    active: true
  },
  {
    id: "tr-2",
    tenantId: DEMO_TENANT_ID,
    slug: "clareamento-laser",
    category: "Estetica",
    categoryLabel: "Estética",
    displayName: "Clareamento Dental a Laser",
    overview:
      "Avaliação prévia da saúde dental seguida de protocolo clareador em consultório com controle de sensibilidade.",
    clinicDifferential:
      "Barreira gengival protetora e protocolo dessensibilizante avaliado pelo dentista.",
    estimatedDurationMinutes: 60,
    demoPriceBrl: 490,
    active: true
  },
  {
    id: "tr-3",
    tenantId: DEMO_TENANT_ID,
    slug: "ortodontia-alinhadores",
    category: "Reabilitacao",
    categoryLabel: "Ortodontia & Implantes",
    displayName: "Ortodontia & Alinhadores",
    overview:
      "Estudo ortodôntico com escaneamento intraoral digital para planejamento de alinhamento dentário.",
    clinicDifferential:
      "Escaneamento 3D que substitui moldagens tradicionais com maior previsibilidade.",
    estimatedDurationMinutes: 40,
    demoPriceBrl: 160,
    active: true
  },
  {
    id: "tr-4",
    tenantId: DEMO_TENANT_ID,
    slug: "lentes-contato-dental",
    category: "Estetica",
    categoryLabel: "Estética",
    displayName: "Lentes de Contato Dental",
    overview:
      "Consulta de planejamento estético para avaliação de indicação, proporção do sorriso e opções restauradoras.",
    clinicDifferential:
      "Planejamento conservador preservando ao máximo a estrutura dentária saudável.",
    estimatedDurationMinutes: 60,
    demoPriceBrl: 350,
    active: true
  },
  {
    id: "tr-5",
    tenantId: DEMO_TENANT_ID,
    slug: "implante-dentario",
    category: "Reabilitacao",
    categoryLabel: "Ortodontia & Implantes",
    displayName: "Implante Dentário (Avaliação 3D)",
    overview:
      "Avaliação clínica e de imagem para planejamento de reabilitação unitária ou múltipla.",
    clinicDifferential:
      "Explicação detalhada das etapas cirúrgicas, prazos e cuidados pós-operatórios.",
    estimatedDurationMinutes: 50,
    demoPriceBrl: 240,
    active: true
  },
  {
    id: "tr-6",
    tenantId: DEMO_TENANT_ID,
    slug: "urgencia-avaliacao",
    category: "Urgencia",
    categoryLabel: "Urgência",
    displayName: "Avaliação de Urgência Odontológica",
    overview:
      "Atendimento prioritário para avaliação de dor aguda, fratura dentária ou restauração solta.",
    clinicDifferential:
      "Horários reservados diariamente para acolhimento rápido e encaminhamento seguro.",
    estimatedDurationMinutes: 30,
    demoPriceBrl: 200,
    active: true
  }
];

export const DEFAULT_DEMO_FAQS: FAQ[] = [
  {
    id: "faq-1",
    tenantId: DEMO_TENANT_ID,
    question: "Como funciona a solicitação de agendamento pelo site?",
    answer:
      "Você escolhe o tratamento, seleciona o profissional ou primeiro horário disponível e envia sua solicitação. A recepção confirma o horário pelos canais oficiais da clínica.",
    category: "agendamento",
    relatedTreatmentIds: ["tr-1"],
    publicationStatus: "published"
  },
  {
    id: "faq-2",
    tenantId: DEMO_TENANT_ID,
    question: "Este ambiente de demonstração salva dados reais de pacientes?",
    answer:
      "Não. Enquanto estiver em Modo Demonstração sem conexão com banco de dados em nuvem, os dados ficam apenas no navegador atual para testes.",
    category: "privacidade",
    relatedTreatmentIds: [],
    publicationStatus: "published"
  },
  {
    id: "faq-3",
    tenantId: DEMO_TENANT_ID,
    question: "Em caso de dor aguda, como devo proceder?",
    answer:
      "Selecione a opção de Avaliação de Urgência ou entre em contato direto com a recepção pelo WhatsApp para orientação imediata de encaixe.",
    category: "urgencia",
    relatedTreatmentIds: ["tr-6"],
    publicationStatus: "published"
  }
];

export function buildUpcomingDemoDays(baseDate: Date = new Date()) {
  const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return Array.from({ length: 5 }, (_, idx) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + idx);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return {
      iso: d.toISOString().slice(0, 10),
      label: idx === 0 ? "Hoje" : (names[d.getDay()] ?? "Dia"),
      shortDate: `${dd}/${mm}`
    };
  });
}

export function buildInitialDemoAppointments(days = buildUpcomingDemoDays()): AppointmentRequest[] {
  const today = days[0] ?? { iso: "2026-11-21", label: "Hoje", shortDate: "21/11" };
  return [
    {
      id: "demo-apt-1",
      tenantId: DEMO_TENANT_ID,
      patientContactId: "demo-contact-1",
      patientName: "Paciente Exemplo A",
      patientPhone: "(11) 90000-0001",
      treatmentId: "tr-1",
      treatmentName: "Avaliação + Limpeza Completa",
      professionalId: "staff-1",
      professionalName: "Dra. Camila Mendes (Demo)",
      dateIso: today.iso,
      dateLabel: `${today.label} (${today.shortDate})`,
      slotTime: "10:00",
      estimatedDurationMinutes: 45,
      demoPriceBrl: 180,
      status: "CONFIRMED",
      source: "web_demo",
      createdAt: new Date().toISOString()
    },
    {
      id: "demo-apt-2",
      tenantId: DEMO_TENANT_ID,
      patientContactId: "demo-contact-2",
      patientName: "Paciente Exemplo B",
      patientPhone: "(11) 90000-0002",
      treatmentId: "tr-2",
      treatmentName: "Clareamento Dental a Laser",
      professionalId: "staff-2",
      professionalName: "Dr. Rafael Costa (Demo)",
      dateIso: today.iso,
      dateLabel: `${today.label} (${today.shortDate})`,
      slotTime: "15:30",
      estimatedDurationMinutes: 60,
      demoPriceBrl: 490,
      status: "REQUESTED",
      source: "web_demo",
      createdAt: new Date().toISOString()
    }
  ];
}
