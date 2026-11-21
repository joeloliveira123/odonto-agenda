"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState } from "react";
import { OdontoAssistantWidget } from "@/components/site/OdontoAssistantWidget";
import type {
  AppointmentRequest,
  AppointmentStatus,
  Clinic,
  FAQ,
  StaffMember,
  Treatment,
  TreatmentCategory
} from "@/types/domain";
import {
  appointmentRequestInputSchema,
  newTreatmentInputSchema
} from "@/lib/validation/schemas";
import { buildSafeWhatsAppHandoffUrl } from "@/lib/tenancy/provider";

interface DayOption {
  iso: string;
  label: string;
  shortDate: string;
}

interface OdontoDemoClientProps {
  initialClinic: Clinic;
  initialStaff: StaffMember[];
  initialTreatments: Treatment[];
  initialFaqs: FAQ[];
  initialAppointments: AppointmentRequest[];
  days: DayOption[];
  supabaseConfigured: boolean;
}

const SLOTS = [
  "08:30",
  "09:15",
  "10:00",
  "10:45",
  "11:30",
  "14:00",
  "14:45",
  "15:30",
  "16:15",
  "17:00",
  "17:45",
  "18:30"
];

const ACTIVE_STATUSES = new Set<AppointmentStatus>([
  "REQUESTED",
  "PENDING_REVIEW",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED"
]);

const STAFF_QUOTES: Record<string, string> = {
  "staff-1":
    "“Acredito que um sorriso bonito nunca deve parecer artificial. Planejamos cada detalhe junto com você na tela antes de tocar no dente.”",
  "staff-2":
    "“Meu papel é devolver a segurança de mastigar e sorrir sem dor, usando planejamento 3D para procedimentos rápidos e previsíveis.”",
  "staff-3":
    "“Muitos pacientes chegam com receio por experiências antigas. Aqui fazemos pausas combinadas e respeitamos o seu tempo.”"
};

const HERO_METRICS = [
  {
    value: "3.500+",
    label: "Pacientes Atendidos",
    desc: "Cuidado humano pensado para eliminar qualquer receio de ir ao consultório.",
    icon: "smile"
  },
  {
    value: "15+ Anos",
    label: "Experiência Clínica",
    desc: "Especialistas dedicados por área com registro CRO ativo e atualização contínua.",
    icon: "award"
  },
  {
    value: "99%",
    label: "Aprovação dos Pacientes",
    desc: "Diagnóstico mostrado na tela com explicação clara antes de qualquer etapa.",
    icon: "thumb"
  },
  {
    value: "4.000+",
    label: "Sorrisos Cuidados",
    desc: "Escaneamento intraoral 3D e orçamento fechado em até 12x sem surpresas.",
    icon: "tooth"
  }
] as const;

const SPECIALTY_SHORTCUTS: {
  cat: TreatmentCategory;
  title: string;
  desc: string;
  icon: "tooth" | "sparkles" | "braces" | "shield";
}[] = [
  {
    cat: "Prevencao",
    title: "Prevenção & Check-up",
    desc: "Limpeza com ultrassom e avaliação completa sem desconforto.",
    icon: "tooth"
  },
  {
    cat: "Estetica",
    title: "Estética & Clareamento",
    desc: "Sorriso mais harmônico com protocolos seguros para sensibilidade.",
    icon: "sparkles"
  },
  {
    cat: "Reabilitacao",
    title: "Ortodontia & Implantes",
    desc: "Planejamento digital 3D preciso e previsibilidade do início ao fim.",
    icon: "braces"
  },
  {
    cat: "Urgencia",
    title: "Urgência no Mesmo Dia",
    desc: "Encaixe rápido e acolhedor para alívio imediato de dor ou fratura.",
    icon: "shield"
  }
];

const PATIENT_TESTIMONIALS = [
  {
    quote:
      "Eu adiava minha ida ao dentista há quase 4 anos por medo de sentir dor. Na primeira consulta a doutora me mostrou tudo na tela, explicou sem pressa e não senti absolutamente nada no procedimento.",
    author: "Mariana Siqueira",
    role: "Prevenção & Clareamento Dental",
    tag: "Zero dor e acolhimento",
    image: "/images/hero-patient.jpg"
  },
  {
    quote:
      "O que mais me conquistou foi a transparência. Fizeram o escaneamento 3D sem aquela massinha desconfortável, simularam todo o plano antes e cumpriram exatamente o orçamento fechado.",
    author: "Rafael Mendes",
    role: "Ortodontia & Alinhadores Transparentes",
    tag: "Planejamento 3D preciso",
    image: "/images/about-dentist-care.jpg"
  },
  {
    quote:
      "Tive uma dor aguda numa terça-feira de manhã, pedi encaixe de urgência direto pelo site e em poucas horas já estava na cadeira com tudo resolvido no mesmo dia.",
    author: "Cláudia Ferreira",
    role: "Atendimento de Urgência",
    tag: "Encaixe no mesmo dia",
    image: "/images/clinic-interior.jpg"
  }
] as const;

const CARE_PILLARS = [
  {
    title: "Equipe Especializada",
    subtitle: "Especialistas com CRO ativo em cada área",
    icon: "team" as const
  },
  {
    title: "Tecnologia Digital 3D",
    subtitle: "Scanner intraoral sem moldagens incômodas",
    icon: "tech" as const
  },
  {
    title: "Ambiente Acolhedor",
    subtitle: "Consultas sem pressa e anestesia suave",
    icon: "heart" as const
  }
];

const CONSULTATION_STEPS = [
  {
    step: "01",
    title: "Escuta Ativa Sem Pressa",
    quote: "“Ouvimos suas prioridades e receios antes de qualquer exame.”",
    desc: "Você conversa diretamente com o dentista, explica o que deseja melhorar ou o que está incomodando e combinamos o ritmo do atendimento."
  },
  {
    step: "02",
    title: "Diagnóstico 3D na Tela",
    quote: "“Você enxerga exatamente o que o especialista está vendo.”",
    desc: "Com escaneamento digital e fotos em alta definição, mostramos cada detalhe em tela grande para que você entenda o diagnóstico sem termos técnicos."
  },
  {
    step: "03",
    title: "Plano Transparente em 12x",
    quote: "“Orçamento fechado, prazos claros e decisão no seu tempo.”",
    desc: "Receba todas as opções por escrito com valores definidos e nota para reembolso antes de iniciar qualquer procedimento."
  }
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "SO";
}

function statusBadgeLabel(status: AppointmentStatus) {
  switch (status) {
    case "CONFIRMED":
      return "Confirmada";
    case "REQUESTED":
    case "PENDING_REVIEW":
      return "Solicitada (Demo)";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
  }
}

function ToothOutlineIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 3C4.8 3 3 4.8 3 7.2c0 2.5 1.3 4.6 2 6.8.7 2.2 1.2 6 2.8 6 1.3 0 1.8-2.8 2.7-4.5.4-.8.9-1.2 1.5-1.2s1.1.4 1.5 1.2c.9 1.7 1.4 4.5 2.7 4.5 1.6 0 2.1-3.8 2.8-6 .7-2.2 2-4.3 2-6.8C21 4.8 19.2 3 17 3c-1.8 0-3.2 1-5 1S8.8 3 7 3Z" />
    </svg>
  );
}

function FeatureIcon({ kind }: { kind: string }) {
  const cls = "w-5 h-5 text-[#0F4C5C]";
  switch (kind) {
    case "smile":
    case "heart":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 14.5c1 1.3 2.1 2 3.5 2s2.5-.7 3.5-2" strokeLinecap="round" />
          <circle cx="9.2" cy="9.8" r="0.8" fill="currentColor" />
          <circle cx="14.8" cy="9.8" r="0.8" fill="currentColor" />
        </svg>
      );
    case "award":
    case "team":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <circle cx="12" cy="9" r="5" />
          <path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "thumb":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <path d="M7 10v11M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a2.5 2.5 0 0 1 3 3.88Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "sparkles":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" strokeLinejoin="round" />
          <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" strokeLinejoin="round" />
        </svg>
      );
    case "braces":
    case "tech":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <rect x="3" y="8" width="18" height="8" rx="3" />
          <path d="M8 8v8M16 8v8M3 12h18" />
        </svg>
      );
    case "shield":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <path d="M12 3 4 6.5V12c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6.5L12 3Z" strokeLinejoin="round" />
          <path d="M12 9v6M9 12h6" strokeLinecap="round" />
        </svg>
      );
    default:
      return <ToothOutlineIcon className={cls} />;
  }
}

export function OdontoDemoClient({
  initialClinic,
  initialStaff,
  initialTreatments,
  initialFaqs,
  initialAppointments,
  days,
  supabaseConfigured
}: OdontoDemoClientProps) {
  const [clinic, setClinic] = useState<Clinic>(initialClinic);
  const [treatments, setTreatments] = useState<Treatment[]>(initialTreatments);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>(initialAppointments);

  const [activeView, setActiveView] = useState<"patient" | "clinic">("patient");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [treatmentCat, setTreatmentCat] = useState<"all" | TreatmentCategory>("all");
  const [treatmentSearch, setTreatmentSearch] = useState("");
  const [faqSearch, setFaqSearch] = useState("");
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>(
    initialTreatments[0]?.id ?? ""
  );
  const [selectedDentistId, setSelectedDentistId] = useState<string>(
    initialStaff[0]?.id ?? "any"
  );
  const [selectedDay, setSelectedDay] = useState<DayOption>(
    days[0] ?? { iso: "2026-11-21", label: "Hoje", shortDate: "21/11" }
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientNotes, setPatientNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [lastRequested, setLastRequested] = useState<AppointmentRequest | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newProcName, setNewProcName] = useState("");
  const [newProcPrice, setNewProcPrice] = useState("");
  const [newProcDur, setNewProcDur] = useState("45");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");

  const selectedTreatment = useMemo(
    () => treatments.find((t) => t.id === selectedTreatmentId) ?? treatments[0],
    [treatments, selectedTreatmentId]
  );

  const selectedDentist = useMemo(
    () => initialStaff.find((s) => s.id === selectedDentistId),
    [initialStaff, selectedDentistId]
  );

  const filteredTreatments = useMemo(() => {
    const q = treatmentSearch.trim().toLowerCase();
    return treatments.filter((t) => {
      if (treatmentCat !== "all" && t.category !== treatmentCat) return false;
      if (!q) return true;
      return `${t.displayName} ${t.overview} ${t.categoryLabel}`.toLowerCase().includes(q);
    });
  }, [treatments, treatmentCat, treatmentSearch]);

  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    if (!q) return initialFaqs;
    return initialFaqs.filter((f) =>
      `${f.question} ${f.answer} ${f.category}`.toLowerCase().includes(q)
    );
  }, [initialFaqs, faqSearch]);

  const busySlots = useMemo(() => {
    return new Set(
      appointments
        .filter((a) => a.dateIso === selectedDay.iso && ACTIVE_STATUSES.has(a.status))
        .map((a) => a.slotTime)
    );
  }, [appointments, selectedDay]);

  const activeAppointments = useMemo(
    () => appointments.filter((a) => ACTIVE_STATUSES.has(a.status)),
    [appointments]
  );

  const confirmedCount = useMemo(
    () => appointments.filter((a) => a.status === "CONFIRMED").length,
    [appointments]
  );

  const requestedCount = useMemo(
    () =>
      appointments.filter(
        (a) => a.status === "REQUESTED" || a.status === "PENDING_REVIEW"
      ).length,
    [appointments]
  );

  const expectedRevenue = useMemo(
    () => activeAppointments.reduce((sum, a) => sum + a.demoPriceBrl, 0),
    [activeAppointments]
  );

  const filteredAppointments = useMemo(() => {
    if (statusFilter === "all") return appointments;
    return appointments.filter((a) => a.status === statusFilter);
  }, [appointments, statusFilter]);

  const activeTestimonial = PATIENT_TESTIMONIALS[testimonialIdx] ?? PATIENT_TESTIMONIALS[0];

  function handleSelectUrgency() {
    const urgencyTreatment = treatments.find((t) => t.category === "Urgencia");
    if (urgencyTreatment) {
      setSelectedTreatmentId(urgencyTreatment.id);
    }
  }

  function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTreatment || !selectedSlot) {
      setFormError("Escolha o tratamento e um horário disponível antes de enviar.");
      return;
    }

    const validation = appointmentRequestInputSchema.safeParse({
      tenantId: clinic.tenantId,
      patientName,
      patientPhone,
      treatmentId: selectedTreatment.id,
      professionalId: selectedDentistId,
      dateIso: selectedDay.iso,
      slotTime: selectedSlot,
      notes: patientNotes || undefined
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    if (busySlots.has(selectedSlot)) {
      setFormError("Este horário acabou de ser ocupado. Selecione outro.");
      return;
    }

    setFormError(null);

    const created: AppointmentRequest = {
      id: `req-${Date.now()}`,
      tenantId: clinic.tenantId,
      patientContactId: `demo-contact-${Date.now()}`,
      patientName: validation.data.patientName,
      patientPhone: validation.data.patientPhone,
      treatmentId: selectedTreatment.id,
      treatmentName: selectedTreatment.displayName,
      professionalId: selectedDentist?.id,
      professionalName: selectedDentist?.displayName ?? "Primeiro horário livre",
      dateIso: selectedDay.iso,
      dateLabel: `${selectedDay.label} (${selectedDay.shortDate})`,
      slotTime: selectedSlot,
      estimatedDurationMinutes: selectedTreatment.estimatedDurationMinutes,
      demoPriceBrl: selectedTreatment.demoPriceBrl,
      notes: validation.data.notes,
      status: "REQUESTED",
      source: "web_demo",
      createdAt: new Date().toISOString()
    };

    setAppointments((prev) => [created, ...prev]);
    setLastRequested(created);
  }

  function handleAddProcedure() {
    const parsed = newTreatmentInputSchema.safeParse({
      displayName: newProcName,
      demoPriceBrl: Number(newProcPrice),
      estimatedDurationMinutes: Number(newProcDur) || 45,
      category: "Estetica"
    });

    if (!parsed.success) return;

    const custom: Treatment = {
      id: `custom-${Date.now()}`,
      tenantId: clinic.tenantId,
      slug: `personalizado-${Date.now()}`,
      category: parsed.data.category,
      categoryLabel: "Procedimento da Sua Clínica",
      displayName: parsed.data.displayName,
      estimatedDurationMinutes: parsed.data.estimatedDurationMinutes,
      demoPriceBrl: parsed.data.demoPriceBrl,
      overview:
        "Procedimento personalizado adicionado no painel de demonstração da sua clínica.",
      clinicDifferential: `Protocolo personalizado configurado pela equipe da ${clinic.name}.`,
      active: true
    };

    setTreatments((prev) => [custom, ...prev]);
    setSelectedTreatmentId(custom.id);
    setNewProcName("");
    setNewProcPrice("");
  }

  async function updateAppointmentStatus(id: string, nextStatus: AppointmentStatus) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
    );
    try {
      await fetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, actorRole: "RECEPTIONIST" })
      });
    } catch {
      // Mantém atualização otimista em sessão demo
    }
  }

  const brandColor = clinic.branding.primaryColor;

  return (
    <div
      style={{ "--brand": brandColor } as React.CSSProperties}
      className="min-h-screen flex flex-col bg-[#F7FAF8] text-[#0D2925]"
    >
      {/* BARRA DE PERSONALIZAÇÃO AO VIVO */}
      <div className="bg-[#0B221E] text-[#ECF7F2] py-2 px-4 border-b border-white/10 text-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <label
            htmlFor="quick-clinic-input"
            className="inline-flex items-center gap-2 text-slate-200"
          >
            <svg
              width="24"
              height="18"
              viewBox="-10 0 215 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="shrink-0"
            >
              <defs>
                <linearGradient id="joTopGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="45%" stopColor="#7DD3FC" />
                  <stop offset="100%" stopColor="#0066FF" />
                </linearGradient>
              </defs>
              <path
                d="M58 38 V104 C58 130 43 144 23 144 C8 144 -3 136 -9 124"
                transform="translate(18,-10)"
                fill="none"
                stroke="url(#joTopGrad)"
                strokeWidth="25"
                strokeLinecap="round"
              />
              <path
                d="M78 97 C78 66 94 27 129 27 C159 27 178 48 178 75 C178 104 158 125 131 125 C109 125 94 115 84 99"
                fill="none"
                stroke="url(#joTopGrad)"
                strokeWidth="25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              Coloque o nome da <strong className="text-emerald-300">Sua Odontologia</strong> e
              veja este site com a sua marca:
            </span>
          </label>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <input
              id="quick-clinic-input"
              type="text"
              value={clinic.name === initialClinic.name ? "" : clinic.name}
              placeholder="Ex: Odontologia Almeida"
              aria-label="Nome da sua clínica"
              onChange={(e) => {
                const value = e.target.value.trim();
                setClinic((prev) => ({
                  ...prev,
                  name: value || initialClinic.name
                }));
              }}
              className="w-full sm:w-56 bg-white/10 border border-white/20 rounded-full px-3.5 py-1 text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-emerald-300"
            />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="bg-emerald-400/20 border border-emerald-300/35 text-emerald-100 hover:bg-emerald-400/30 px-3 py-1 rounded-full font-semibold text-xs cursor-pointer transition"
            >
              Personalizar Clínica
            </button>
          </div>
        </div>
      </div>

      {/* CABEÇALHO LIMPO INSPIRADO EM BRIGHTBITE & SMILEORA */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DCECE5]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5 sm:gap-3">
          <a href="#inicio" className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0 max-w-[55%] sm:max-w-none lg:max-w-[240px]">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border border-[#CFE4DA] bg-[#EAF6F0] shrink-0"
              style={{ color: brandColor }}
              aria-hidden="true"
            >
              <ToothOutlineIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-serif font-bold text-sm sm:text-lg leading-tight text-[#0D2925] truncate">
                {clinic.name}
              </div>
              <div className="text-[11px] font-medium text-[#4A6862] hidden sm:block">
                {clinic.subtitle}
              </div>
            </div>
          </a>

          <nav
            aria-label="Navegação principal"
            className="hidden lg:flex items-center gap-1 text-xs font-semibold text-[#33554E]"
          >
            <a
              href="#inicio"
              className="px-3.5 py-1.5 rounded-full bg-[#E3F2EC] text-[#0D2925] transition whitespace-nowrap"
            >
              Início
            </a>
            <a
              href="#tratamentos"
              className="px-3 py-1.5 rounded-full hover:bg-[#F1F8F4] hover:text-[#0D2925] transition whitespace-nowrap"
            >
              Tratamentos
            </a>
            <a
              href="#sobre"
              className="px-3 py-1.5 rounded-full hover:bg-[#F1F8F4] hover:text-[#0D2925] transition whitespace-nowrap"
            >
              A Clínica
            </a>
            <a
              href="#equipe"
              className="px-3 py-1.5 rounded-full hover:bg-[#F1F8F4] hover:text-[#0D2925] transition whitespace-nowrap"
            >
              Corpo Clínico
            </a>
            <a
              href="#depoimentos"
              className="px-3 py-1.5 rounded-full hover:bg-[#F1F8F4] hover:text-[#0D2925] transition whitespace-nowrap"
            >
              Depoimentos
            </a>
            <a
              href="#duvidas"
              className="px-3 py-1.5 rounded-full hover:bg-[#F1F8F4] hover:text-[#0D2925] transition whitespace-nowrap"
            >
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label="Abrir menu de navegação"
              className="lg:hidden px-2.5 py-1.5 rounded-full border border-[#CFE2D9] text-[11px] sm:text-xs font-semibold text-[#0D2925]"
            >
              Menu
            </button>

            <div
              className="inline-flex bg-[#EEF6F2] p-0.5 sm:p-1 rounded-full border border-[#D7E8E0]"
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "patient"}
                onClick={() => setActiveView("patient")}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer transition whitespace-nowrap ${
                  activeView === "patient"
                    ? "bg-white text-[#0D2925] shadow-xs"
                    : "text-[#4A6862]"
                }`}
              >
                Site
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "clinic"}
                onClick={() => setActiveView("clinic")}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1 sm:gap-1.5 cursor-pointer transition whitespace-nowrap ${
                  activeView === "clinic"
                    ? "bg-white text-[#0D2925] shadow-xs"
                    : "text-[#4A6862]"
                }`}
              >
                Painel
                <span
                  className="text-white text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full leading-none"
                  style={{ backgroundColor: brandColor }}
                >
                  {activeAppointments.length}
                </span>
              </button>
            </div>

            <a
              href="#agendar"
              className="hidden sm:inline-flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-sm hover:brightness-105 transition whitespace-nowrap"
              style={{ backgroundColor: brandColor }}
            >
              <span>Agendar Consulta</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            aria-label="Menu mobile"
            className="lg:hidden border-t border-[#DCECE5] bg-white px-4 py-3 flex flex-wrap gap-3 text-xs font-semibold text-[#264640]"
          >
            <a href="#inicio" onClick={() => setMobileMenuOpen(false)}>
              Início
            </a>
            <a href="#tratamentos" onClick={() => setMobileMenuOpen(false)}>
              Tratamentos
            </a>
            <a href="#sobre" onClick={() => setMobileMenuOpen(false)}>
              A Clínica
            </a>
            <a href="#equipe" onClick={() => setMobileMenuOpen(false)}>
              Corpo Clínico
            </a>
            <a href="#depoimentos" onClick={() => setMobileMenuOpen(false)}>
              Depoimentos
            </a>
            <a href="#duvidas" onClick={() => setMobileMenuOpen(false)}>
              Dúvidas
            </a>
            <a href="#agendar" onClick={() => setMobileMenuOpen(false)} className="font-bold text-[#0F4C5C]">
              Agendar Consulta →
            </a>
          </nav>
        )}
      </header>

      {activeView === "patient" ? (
        <main>
          {/* HERO ORGÂNICO ESTILO BRIGHTBITE + SMILEORA */}
          <section
            id="inicio"
            className="relative bg-gradient-to-b from-white via-[#F5FAF7] to-[#F7FAF8] pt-6 pb-20 lg:pb-24 overflow-hidden"
          >
            <div className="max-w-6xl mx-auto px-4">
              <div className="grid lg:grid-cols-12 gap-5 lg:gap-6 items-stretch relative">
                {/* CARTÃO ESQUERDO MENTA COM CANTOS ORGÂNICOS (BRIGHTBITE) */}
                <div className="lg:col-span-6 bg-[#DCF0E8] border border-[#C6E3D7] rounded-[32px] lg:rounded-tr-[130px] p-7 sm:p-10 lg:pr-14 flex flex-col justify-center space-y-5 relative z-10">
                  <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-white/95 border border-[#C6E3D7] text-[11px] font-bold uppercase tracking-wider text-[#0F4C5C] shadow-2xs">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: brandColor }}
                    />
                    Atendimento Sem Pressa · Tecnologia 3D
                  </div>

                  <h1 className="font-serif text-4xl sm:text-5xl xl:text-[3.25rem] font-bold leading-[1.08] tracking-tight text-[#0D2925]">
                    Sorrisos saudáveis,{" "}
                    <span className="italic font-normal block sm:inline" style={{ color: brandColor }}>
                      vidas mais leves
                    </span>{" "}
                    na {clinic.name}.
                  </h1>

                  <p className="text-[#2E4F49] text-sm sm:text-base leading-relaxed max-w-lg">
                    Cuidado gentil, diagnóstico 3D explicado na tela antes de qualquer procedimento e
                    agendamento online rápido para consultas de rotina ou{" "}
                    <strong className="text-[#0D2925]">encaixe de urgência no mesmo dia</strong>.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href="#agendar"
                      className="inline-flex items-center gap-2 text-white font-bold text-sm px-6 py-3.5 rounded-full shadow-md hover:brightness-105 transition"
                      style={{ backgroundColor: brandColor }}
                    >
                      <span>Agendar Consulta</span>
                      <span aria-hidden="true">→</span>
                    </a>
                    <a
                      href="#agendar"
                      onClick={handleSelectUrgency}
                      className="inline-flex items-center gap-2 bg-white border border-[#BFE0D2] text-[#0D2925] font-bold text-sm px-5 py-3.5 rounded-full shadow-2xs hover:bg-[#F3FAF6] transition"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Urgência Hoje</span>
                    </a>
                  </div>

                  {/* PROVA SOCIAL COMPACTA COM AVATARES (ESTILO SMILEORA) */}
                  <div className="flex items-center gap-3.5 pt-2">
                    <div className="flex -space-x-2.5" aria-hidden="true">
                      <img
                        src="/images/hero-patient.jpg"
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border-2 border-white"
                      />
                      <img
                        src="/images/about-dentist-care.jpg"
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border-2 border-white"
                      />
                      <div
                        className="w-9 h-9 rounded-full border-2 border-white text-white text-xs font-bold flex items-center justify-center"
                        style={{ backgroundColor: brandColor }}
                      >
                        4.9★
                      </div>
                    </div>
                    <div className="text-xs leading-snug">
                      <strong className="block text-[#0D2925]">
                        +340 Avaliações Verificadas
                      </strong>
                      <span className="text-[#45675F]">
                        {supabaseConfigured
                          ? "Agenda integrada em tempo real"
                          : "Modo Demo · Edite o nome da clínica acima"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PALCO FOTOGRÁFICO DIREITO + MEDALHÃO FLUTUANTE + DENTE 3D */}
                <div className="lg:col-span-6 relative rounded-[32px] overflow-hidden min-h-[380px] sm:min-h-[460px] shadow-md border border-[#CFE4DA] bg-[#DCEEE6]">
                  <img
                    src="/images/hero-patient.jpg"
                    alt={`Paciente sorrindo durante atendimento humanizado na ${clinic.name}`}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D2925]/45 via-transparent to-transparent" />

                  {/* MINI CARD FLUTUANTE DENTE 3D (INSPIRAÇÃO SMILEORA) */}
                  <div className="absolute top-4 right-4 sm:top-5 sm:right-5 bg-white/95 backdrop-blur-sm border border-[#DCECE5] rounded-2xl p-2.5 pr-4 shadow-lg flex items-center gap-3 max-w-[235px]">
                    <img
                      src="/images/hero-3d-tooth.jpg"
                      alt="Escaneamento e tecnologia dental 3D"
                      className="w-12 h-12 rounded-xl object-cover border border-[#DCECE5] shrink-0"
                    />
                    <div className="text-xs leading-tight">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#3C6E63]">
                        Scanner Intraoral
                      </span>
                      <strong className="block text-[#0D2925] mt-0.5">
                        Diagnóstico 3D na tela
                      </strong>
                    </div>
                  </div>

                  {/* RODAPÉ DA FOTO COM HORÁRIO E ENDEREÇO */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/92 backdrop-blur-md border border-[#DCECE5] rounded-2xl p-3.5 grid sm:grid-cols-2 gap-2.5 text-xs shadow-md">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#4A6862]">
                        Horário de Atendimento
                      </span>
                      <strong className="text-[#0D2925] block mt-0.5">{clinic.hoursLabel}</strong>
                    </div>
                    <div className="sm:border-l sm:border-[#DCECE5] sm:pl-3">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#4A6862]">
                        Localização
                      </span>
                      <strong className="text-[#0D2925] block mt-0.5 truncate" title={clinic.address}>
                        {clinic.address}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* MEDALHÃO CIRCULAR CENTRAL FLUTUANTE (ESTILO BRIGHTBITE) */}
                <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-40 h-40 rounded-full bg-white shadow-2xl border-[5px] border-[#F7FAF8] flex-col items-center justify-center text-center p-4">
                  <strong className="font-serif text-3xl font-bold text-[#0D2925] leading-none">
                    4.000+
                  </strong>
                  <span className="text-[11px] font-semibold text-[#4A6862] mt-1 leading-tight">
                    Sorrisos renovados com cuidado
                  </span>
                  <div className="flex -space-x-1.5 mt-2" aria-hidden="true">
                    <span className="w-6 h-6 rounded-full bg-[#DCEEE6] border-2 border-white text-[10px] font-bold flex items-center justify-center text-[#0F4C5C]">
                      SO
                    </span>
                    <span className="w-6 h-6 rounded-full bg-[#0F4C5C] border-2 border-white text-[10px] font-bold flex items-center justify-center text-white">
                      3D
                    </span>
                    <span className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white text-[11px] font-bold flex items-center justify-center text-white">
                      +
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAIXA FLUTUANTE DE 4 MÉTRICAS (ESTILO BRIGHTBITE) */}
          <section className="relative z-20 -mt-12 px-4">
            <div className="max-w-5xl mx-auto bg-white border border-[#DCECE5] rounded-[28px] shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E7F2EC]">
              {HERO_METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className="p-6 text-center flex flex-col items-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-full bg-[#E3F3EC] flex items-center justify-center mb-1">
                    <FeatureIcon kind={metric.icon} />
                  </div>
                  <strong className="font-serif text-2xl sm:text-3xl font-bold text-[#0D2925]">
                    {metric.value}
                  </strong>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F4C5C]">
                    {metric.label}
                  </span>
                  <p className="text-xs text-[#4A6862] leading-relaxed">{metric.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* NOSSOS TRATAMENTOS (4 CARDS MINIMALISTAS SMILEORA + LISTA FILTRÁVEL) */}
          <section id="tratamentos" className="py-16 sm:py-20">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="inline-block px-3.5 py-1 rounded-full bg-[#E3F3EC] text-[11px] font-bold uppercase tracking-[0.16em] text-[#0F4C5C]">
                  ★ Nossos Serviços
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D2925] mt-2">
                  Cuidado Odontológico{" "}
                  <span className="italic font-normal" style={{ color: brandColor }}>
                    Completo
                  </span>
                </h2>
                <p className="text-sm text-[#4A6862] mt-2">
                  Escolha uma especialidade abaixo para filtrar ou clique em qualquer procedimento
                  para já reservar o horário ideal na <strong>{clinic.name}</strong>.
                </p>
              </div>

              {/* 4 CARDS ESTILO SMILEORA */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {SPECIALTY_SHORTCUTS.map((card) => {
                  const isActive = treatmentCat === card.cat;
                  return (
                    <button
                      key={card.cat}
                      type="button"
                      onClick={() =>
                        setTreatmentCat((prev) => (prev === card.cat ? "all" : card.cat))
                      }
                      className={`text-left rounded-[24px] p-5 border transition cursor-pointer flex flex-col justify-between space-y-5 ${
                        isActive
                          ? "bg-[#E2F2EB] shadow-md"
                          : "bg-white hover:bg-[#F3FAF6] border-[#DCECE5] shadow-2xs"
                      }`}
                      style={isActive ? { borderColor: brandColor } : undefined}
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#E8F5EF] border border-[#CFE4DA] flex items-center justify-center">
                          <FeatureIcon kind={card.icon} />
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#0D2925]">
                          {card.title}
                        </h3>
                        <p className="text-xs text-[#4A6862] leading-relaxed">{card.desc}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F4C5C]">
                          {isActive ? "Filtro ativo" : "Filtrar área"}
                        </span>
                        <span
                          className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition ${
                            isActive
                              ? "text-white border-transparent"
                              : "border-[#CFE2D9] text-[#0D2925] bg-[#F7FAF8]"
                          }`}
                          style={isActive ? { backgroundColor: brandColor } : undefined}
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* BUSCA E BOTÕES DE FILTRO */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white border border-[#DCECE5] rounded-2xl p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      ["all", "Todos"],
                      ["Prevencao", "Prevenção"],
                      ["Estetica", "Estética"],
                      ["Reabilitacao", "Ortodontia & Implantes"],
                      ["Urgencia", "Urgência"]
                    ] as const
                  ).map(([cat, label]) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTreatmentCat(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition ${
                        treatmentCat === cat
                          ? "text-white shadow-xs"
                          : "bg-[#F3FAF6] text-[#33554E] hover:bg-[#E3F3EC]"
                      }`}
                      style={treatmentCat === cat ? { backgroundColor: brandColor } : undefined}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="search"
                  value={treatmentSearch}
                  onChange={(e) => setTreatmentSearch(e.target.value)}
                  placeholder="Buscar tratamento..."
                  aria-label="Buscar tratamento"
                  className="bg-[#F7FAF8] border border-[#CFE2D9] rounded-full px-4 py-1.5 text-xs min-w-[210px] focus:outline-none focus:border-[#0F4C5C]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {filteredTreatments.map((t) => {
                  const isSelected = selectedTreatment?.id === t.id;
                  return (
                    <article
                      key={t.id}
                      onClick={() => setSelectedTreatmentId(t.id)}
                      className={`rounded-[26px] p-6 border-2 transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-white shadow-lg"
                          : "bg-white hover:shadow-md border-[#DCECE5]"
                      }`}
                      style={isSelected ? { borderColor: brandColor } : undefined}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#E3F3EC] text-[#0F4C5C]">
                            {t.categoryLabel}
                          </span>
                          <span className="text-xs text-[#4A6862] font-semibold">
                            Sessão de ~{t.estimatedDurationMinutes} min
                          </span>
                        </div>

                        <h3 className="font-serif text-xl font-bold text-[#0D2925] mb-2">
                          {t.displayName}
                        </h3>
                        <p className="text-sm text-[#385751] leading-relaxed mb-3">{t.overview}</p>

                        <div
                          className="bg-[#F6FAF8] border-l-4 rounded-r-2xl p-3.5 text-xs text-[#0D2925] mb-4"
                          style={{ borderLeftColor: brandColor }}
                        >
                          <strong
                            className="block text-[11px] uppercase tracking-wider mb-0.5"
                            style={{ color: brandColor }}
                          >
                            Diferencial na {clinic.name}
                          </strong>
                          {t.clinicDifferential}
                        </div>
                      </div>

                      <div className="pt-3.5 border-t border-[#E4EFEA] flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <strong className="text-base font-bold" style={{ color: brandColor }}>
                            {formatBRL(t.demoPriceBrl)}
                          </strong>
                          <span className="text-[11px] text-[#4A6862] ml-1.5">
                            (Referência Demo)
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <Link
                            href={`/tratamentos/${t.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold underline text-[#0F4C5C] hover:text-[#0D2925]"
                          >
                            Ler guia completo →
                          </Link>
                          <a
                            href="#agendar"
                            onClick={() => setSelectedTreatmentId(t.id)}
                            className="px-4 py-1.5 rounded-full font-bold text-white transition"
                            style={{ backgroundColor: brandColor }}
                          >
                            {isSelected ? "Selecionado ✓" : "Agendar"}
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SOBRE A CLÍNICA: FOTO CIRCULAR BRIGHTBITE + PILARES SMILEORA */}
          <section id="sobre" className="py-16 bg-white border-y border-[#DCECE5]">
            <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* COLUNA ESQUERDA: FOTO CIRCULAR + SELO CONFIANÇA */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative w-72 h-72 sm:w-88 sm:h-88">
                  <div className="w-full h-full rounded-full overflow-hidden border-[10px] border-[#DCF0E8] shadow-xl">
                    <img
                      src="/images/about-dentist-care.jpg"
                      alt={`Atendimento odontológico cuidadoso na ${clinic.name}`}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  {/* SELO CIRCULAR MENTA TOP-RIGHT (BRIGHTBITE) */}
                  <div className="absolute -top-2 -right-2 w-24 h-24 rounded-full bg-[#BFE6D6] border-4 border-white shadow-md flex flex-col items-center justify-center text-center p-2">
                    <ToothOutlineIcon className="w-6 h-6 text-[#0D2925]" />
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#0D2925] mt-1 leading-tight">
                      Cuidado
                      <br />
                      CRO Ativo
                    </span>
                  </div>

                  {/* CARD SEGURO & ACOLHEDOR BOTTOM-LEFT (SMILEORA) */}
                  <div className="absolute -bottom-3 -left-2 sm:left-0 bg-white border border-[#DCECE5] rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E3F3EC] flex items-center justify-center">
                      <FeatureIcon kind="shield" />
                    </div>
                    <div className="text-xs leading-tight">
                      <strong className="block text-[#0D2925]">Seguro &amp; Humano</strong>
                      <span className="text-[#4A6862]">Explicação clara na tela</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUNA DIREITA: TEXTO + 3 DESTAQUES VERTICAIS SMILEORA */}
              <div className="lg:col-span-7 space-y-5">
                <span className="inline-block px-3.5 py-1 rounded-full bg-[#E3F3EC] text-[11px] font-bold uppercase tracking-wider text-[#0F4C5C]">
                  ★ Sobre a {clinic.name}
                </span>

                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D2925] leading-tight">
                  Sua Clínica de Confiança para{" "}
                  <span className="italic font-normal" style={{ color: brandColor }}>
                    Cada Sorriso
                  </span>
                </h2>

                <p className="text-[#3C5A54] text-base leading-relaxed">
                  Na <strong className="text-[#0D2925]">{clinic.name}</strong>, acreditamos que
                  todos merecem atendimento tranquilo, transparente e sem pressa. Combinamos
                  diagnóstico digital em alta definição com uma equipe acolhedora para transformar
                  sua experiência no dentista.
                </p>

                <div className="grid sm:grid-cols-3 gap-3.5 pt-1">
                  {CARE_PILLARS.map((pillar) => (
                    <div
                      key={pillar.title}
                      className="bg-[#F7FAF8] border border-[#DCECE5] rounded-2xl p-4 space-y-2"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#E3F3EC] flex items-center justify-center">
                        <FeatureIcon kind={pillar.icon} />
                      </div>
                      <strong className="block text-sm text-[#0D2925]">{pillar.title}</strong>
                      <p className="text-xs text-[#4A6862] leading-relaxed">{pillar.subtitle}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <a
                    href="#estrutura"
                    className="inline-flex items-center gap-2 text-white font-bold text-sm px-6 py-3 rounded-full shadow-sm hover:brightness-105 transition"
                    style={{ backgroundColor: brandColor }}
                  >
                    <span>Conhecer Nossa Estrutura</span>
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ESTRUTURA + PRIMEIRA CONSULTA + CONSULTÓRIO ARQUITETÔNICO */}
          <section id="estrutura" className="py-16">
            <div className="max-w-6xl mx-auto px-4 space-y-12">
              <div className="bg-[#E6F4EE] border border-[#CBE2D8] rounded-[34px] p-6 sm:p-10 grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-white text-[11px] font-bold uppercase tracking-wider text-[#0F4C5C]">
                    Estrutura &amp; Biossegurança
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D2925] leading-tight">
                    Consultório pensado para quem{" "}
                    <span className="italic font-normal" style={{ color: brandColor }}>
                      tem receio de dentista
                    </span>
                  </h2>
                  <p className="text-sm text-[#385751] leading-relaxed">
                    Substituímos moldagens desconfortáveis e atendimentos apressados por tecnologia
                    silenciosa, precisão 3D e protocolos rigorosos de esterilização.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    {[
                      {
                        t: "Anestesia Suave",
                        d: "Anestésico tópico prévio e aplicação lenta sem ardência."
                      },
                      {
                        t: "Escaneamento 3D",
                        d: "Leitura digital em segundos no lugar de massinhas."
                      },
                      {
                        t: "Esterilização Classe B",
                        d: "Kits individuais lacrados com controle hospitalar."
                      },
                      {
                        t: "Orçamento em até 12x",
                        d: "Valores fechados e emissão para reembolso de plano."
                      }
                    ].map((b) => (
                      <div
                        key={b.t}
                        className="bg-white/90 border border-[#D4E7DF] rounded-2xl p-3.5"
                      >
                        <strong className="block text-sm text-[#0D2925]">{b.t}</strong>
                        <span className="text-xs text-[#4A6862] leading-snug block mt-0.5">
                          {b.d}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 relative">
                  <div className="rounded-[26px] overflow-hidden border border-white shadow-lg aspect-[16/10]">
                    <img
                      src="/images/clinic-interior.jpg"
                      alt={`Sala de atendimento moderna e acolhedora da ${clinic.name}`}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>
              </div>

              {/* JORNADA EM 3 PASSOS */}
              <div id="jornada">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#3C6E63]">
                      Passo a passo sem ansiedade
                    </span>
                    <h2 className="font-serif text-3xl font-bold text-[#0D2925] mt-1">
                      Como Funciona Sua Primeira Consulta
                    </h2>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-5">
                  {CONSULTATION_STEPS.map((item) => (
                    <article
                      key={item.step}
                      className="bg-white border border-[#DCECE5] rounded-[26px] p-6 space-y-3 shadow-2xs"
                    >
                      <span
                        className="inline-block text-xs font-bold px-3 py-1 rounded-full text-white"
                        style={{ backgroundColor: brandColor }}
                      >
                        Etapa {item.step}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-[#0D2925]">{item.title}</h3>
                      <p className="text-xs font-semibold italic text-[#0F4C5C] bg-[#F3FAF6] border border-[#DCECE5] rounded-xl p-3">
                        {item.quote}
                      </p>
                      <p className="text-sm text-[#4A6862] leading-relaxed">{item.desc}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CORPO CLÍNICO */}
          <section id="equipe" className="py-16 bg-white border-y border-[#DCECE5]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="max-w-2xl mb-10">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#3C6E63]">
                  Corpo Clínico com CRO Ativo
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D2925] mt-1">
                  Quem Cuida do Seu Sorriso
                </h2>
                <p className="text-sm text-[#4A6862] mt-1">
                  Conheça os especialistas da <strong>{clinic.name}</strong> e o compromisso de cada
                  profissional:
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {initialStaff.map((s) => (
                  <article
                    key={s.id}
                    className="bg-[#F7FAF8] border border-[#DCECE5] rounded-[26px] p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl font-serif font-bold flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: brandColor }}
                        >
                          {getInitials(s.displayName.replace(/^(Dr\.|Dra\.)\s+/i, ""))}
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-[#0D2925]">
                            {s.displayName}
                          </h3>
                          <span className="block text-xs font-bold text-[#3C6E63]">
                            {s.specialty} · {s.croRegistration}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-[#385751] leading-relaxed">{s.bio}</p>
                    </div>

                    <blockquote className="bg-white border border-[#DCECE5] rounded-2xl p-3.5 text-xs italic text-[#0D2925] leading-relaxed">
                      {STAFF_QUOTES[s.id] ??
                        "“Nosso foco é unir precisão técnica e escuta atenta em cada consulta.”"}
                    </blockquote>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* DEPOIMENTOS ESTILO SMILEORA (CARD CENTRAL + RETRATOS + SETAS) */}
          <section id="depoimentos" className="py-16 sm:py-20 bg-[#F7FAF8]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#3C6E63]">
                  — Depoimentos —
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D2925] mt-1">
                  O Que Dizem{" "}
                  <span className="italic font-normal" style={{ color: brandColor }}>
                    Nossos Pacientes
                  </span>
                </h2>
              </div>

              <div className="grid lg:grid-cols-12 gap-6 items-center">
                {/* SETA + RETRATO ESQUERDO */}
                <div className="lg:col-span-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    aria-label="Depoimento anterior"
                    onClick={() =>
                      setTestimonialIdx(
                        (prev) =>
                          (prev - 1 + PATIENT_TESTIMONIALS.length) % PATIENT_TESTIMONIALS.length
                      )
                    }
                    className="w-10 h-10 rounded-full bg-white border border-[#CFE2D9] shadow-xs flex items-center justify-center text-[#0D2925] hover:bg-[#E3F3EC] cursor-pointer transition shrink-0"
                  >
                    ←
                  </button>
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] overflow-hidden border-4 border-[#DCEEE6] shadow-md">
                    <img
                      src={activeTestimonial.image}
                      alt={activeTestimonial.author}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>

                {/* CARD DE DEPOIMENTO CENTRAL */}
                <div className="lg:col-span-6 bg-white border border-[#DCECE5] rounded-[32px] p-7 sm:p-9 shadow-lg text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#E3F3EC] text-[#0F4C5C] font-serif text-2xl font-bold">
                    “
                  </div>
                  <p className="text-base sm:text-lg text-[#0D2925] leading-relaxed italic">
                    “{activeTestimonial.quote}”
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-amber-500 text-sm tracking-widest">★★★★★</span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E3F3EC] text-[#0F4C5C]">
                      {activeTestimonial.tag}
                    </span>
                  </div>
                  <div className="pt-1">
                    <strong className="block text-sm text-[#0D2925]">
                      {activeTestimonial.author}
                    </strong>
                    <span className="text-xs text-[#4A6862]">{activeTestimonial.role}</span>
                  </div>
                </div>

                {/* RETRATO SECUNDÁRIO + SETA DIREITA */}
                <div className="lg:col-span-3 flex items-center justify-center gap-4">
                  <div className="hidden sm:block w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] overflow-hidden border-4 border-[#DCEEE6] shadow-md">
                    <img
                      src={
                        PATIENT_TESTIMONIALS[(testimonialIdx + 1) % PATIENT_TESTIMONIALS.length]
                          ?.image ?? "/images/about-dentist-care.jpg"
                      }
                      alt="Paciente atendido na clínica"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Próximo depoimento"
                    onClick={() =>
                      setTestimonialIdx((prev) => (prev + 1) % PATIENT_TESTIMONIALS.length)
                    }
                    className="w-10 h-10 rounded-full bg-white border border-[#CFE2D9] shadow-xs flex items-center justify-center text-[#0D2925] hover:bg-[#E3F3EC] cursor-pointer transition shrink-0"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* SELETORES RÁPIDOS DE DEPOIMENTO */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {PATIENT_TESTIMONIALS.map((item, idx) => (
                  <button
                    key={item.author}
                    type="button"
                    onClick={() => setTestimonialIdx(idx)}
                    aria-label={`Ver depoimento de ${item.author}`}
                    className={`h-2.5 rounded-full transition cursor-pointer ${
                      idx === testimonialIdx ? "w-7 bg-[#0F4C5C]" : "w-2.5 bg-[#CFE2D9]"
                    }`}
                    style={idx === testimonialIdx ? { backgroundColor: brandColor } : undefined}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* AGENDAMENTO ONLINE EM TEMPO REAL */}
          <section id="agendar" className="py-16 bg-[#EAF4EF] border-y border-[#CFE2D9]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#3C6E63]">
                  — Agenda Online em Tempo Real —
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D2925] mt-1">
                  Reserve Seu Horário na{" "}
                  <span className="italic font-normal" style={{ color: brandColor }}>
                    {clinic.name}
                  </span>
                </h2>
                <p className="text-sm text-[#4A6862] mt-1">
                  Escolha o especialista, o melhor dia e horário e envie sua solicitação em menos de
                  1 minuto.
                </p>
              </div>

              <div className="grid lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <div className="bg-white border border-[#DCECE5] rounded-[26px] p-6 shadow-xs">
                    <h3 className="font-serif text-lg font-bold mb-3">
                      1. Escolha o Especialista
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {initialStaff.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedDentistId(s.id)}
                          className={`text-left p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                            selectedDentistId === s.id
                              ? "bg-[#E3F3EC]/60"
                              : "border-[#DCECE5] bg-white"
                          }`}
                          style={
                            selectedDentistId === s.id ? { borderColor: brandColor } : undefined
                          }
                        >
                          <strong className="block text-sm text-[#0D2925]">{s.displayName}</strong>
                          <span className="text-xs text-[#4A6862]">{s.specialty}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedDentistId("any")}
                        className={`text-left p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                          selectedDentistId === "any"
                            ? "bg-[#E3F3EC]/60"
                            : "border-[#DCECE5] bg-white"
                        }`}
                        style={
                          selectedDentistId === "any" ? { borderColor: brandColor } : undefined
                        }
                      >
                        <strong className="block text-sm text-[#0D2925]">
                          Primeiro horário livre
                        </strong>
                        <span className="text-xs text-[#4A6862]">
                          Qualquer dentista disponível
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-[#DCECE5] rounded-[26px] p-6 shadow-xs">
                    <h3 className="font-serif text-lg font-bold mb-3">
                      2. Escolha o Dia e o Horário
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                      {days.map((d) => (
                        <button
                          key={d.iso}
                          type="button"
                          onClick={() => {
                            setSelectedDay(d);
                            setSelectedSlot(null);
                          }}
                          className={`p-2.5 rounded-2xl border text-center cursor-pointer transition ${
                            selectedDay.iso === d.iso
                              ? "text-white border-transparent shadow-xs"
                              : "bg-white border-[#DCECE5]"
                          }`}
                          style={
                            selectedDay.iso === d.iso
                              ? { backgroundColor: brandColor }
                              : undefined
                          }
                        >
                          <span className="block text-[11px] opacity-80">{d.label}</span>
                          <strong className="text-sm">{d.shortDate}</strong>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {SLOTS.map((slot) => {
                        const isBusy = busySlots.has(slot);
                        const isPicked = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBusy}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 rounded-xl border text-sm font-bold transition ${
                              isBusy
                                ? "bg-[#F1F5F3] text-slate-400 line-through cursor-not-allowed border-[#DCECE5]"
                                : isPicked
                                  ? "text-white border-transparent cursor-pointer shadow-xs"
                                  : "bg-white border-[#DCECE5] cursor-pointer hover:border-[#0F4C5C]"
                            }`}
                            style={
                              isPicked && !isBusy ? { backgroundColor: brandColor } : undefined
                            }
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <aside className="lg:col-span-5 lg:sticky lg:top-24 bg-white border border-[#DCECE5] rounded-[26px] p-6 shadow-md">
                  <h3 className="font-serif text-xl font-bold mb-4 text-[#0D2925]">
                    Resumo da Consulta
                  </h3>

                  <div className="bg-[#F7FAF8] border border-[#DCECE5] rounded-2xl p-4 space-y-2 text-sm mb-4">
                    <div className="flex justify-between gap-2">
                      <span className="text-[#4A6862]">Tratamento</span>
                      <strong className="text-right">
                        {selectedTreatment?.displayName ?? "—"}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#4A6862]">Dentista</span>
                      <strong className="text-right">
                        {selectedDentist?.displayName ?? "Primeiro horário livre"}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#4A6862]">Data e Hora</span>
                      <strong className="text-right">
                        {selectedSlot
                          ? `${selectedDay.label} (${selectedDay.shortDate}) às ${selectedSlot}`
                          : "Escolha o horário"}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-2 pt-2 border-t border-[#DCECE5]">
                      <span className="text-[#4A6862]">Referência (Demo)</span>
                      <strong style={{ color: brandColor }}>
                        {selectedTreatment ? formatBRL(selectedTreatment.demoPriceBrl) : "R$ 0,00"}
                      </strong>
                    </div>
                  </div>

                  {lastRequested ? (
                    <div className="text-center space-y-3 py-2">
                      <div className="w-11 h-11 rounded-full bg-[#DCECE5] text-[#0F4C5C] font-bold text-xl flex items-center justify-center mx-auto">
                        ✓
                      </div>
                      <h4 className="font-serif text-lg font-bold">
                        Solicitação Registrada (Status: REQUESTED)
                      </h4>
                      <p className="text-xs text-[#4A6862]">
                        Em produção, a recepção confirma este pedido antes de efetivar a reserva.
                      </p>
                      <a
                        href={buildSafeWhatsAppHandoffUrl(
                          clinic.whatsappPhone,
                          clinic.name,
                          lastRequested.dateLabel,
                          lastRequested.slotTime
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-[#0F766E] text-white font-bold text-sm py-3 rounded-full"
                      >
                        Falar com a Recepção no WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setLastRequested(null);
                          setSelectedSlot(null);
                          setPatientName("");
                          setPatientPhone("");
                          setPatientNotes("");
                        }}
                        className="text-xs underline font-bold cursor-pointer"
                        style={{ color: brandColor }}
                      >
                        Enviar outra solicitação
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleBookingSubmit} className="space-y-3">
                      <div>
                        <label htmlFor="p-name" className="block text-xs font-bold mb-1">
                          Seu Nome Completo
                        </label>
                        <input
                          id="p-name"
                          type="text"
                          required
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="Ex: Ana Paula Ferreira"
                          className="w-full border border-[#CFE2D9] rounded-xl px-3.5 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="p-phone" className="block text-xs font-bold mb-1">
                          Seu WhatsApp
                        </label>
                        <input
                          id="p-phone"
                          type="tel"
                          required
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="w-full border border-[#CFE2D9] rounded-xl px-3.5 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="p-notes" className="block text-xs font-bold mb-1">
                          Alguma observação ou sensibilidade? (opcional)
                        </label>
                        <input
                          id="p-notes"
                          type="text"
                          value={patientNotes}
                          onChange={(e) => setPatientNotes(e.target.value)}
                          placeholder="Ex: Primeira consulta, preferência à tarde..."
                          className="w-full border border-[#CFE2D9] rounded-xl px-3.5 py-2.5 text-sm"
                        />
                      </div>
                      {formError && (
                        <p className="text-xs font-bold text-red-700">{formError}</p>
                      )}
                      <button
                        type="submit"
                        className="w-full text-white font-bold text-sm py-3.5 rounded-full cursor-pointer shadow-sm"
                        style={{ backgroundColor: brandColor }}
                      >
                        Confirmar Minha Solicitação →
                      </button>
                    </form>
                  )}
                </aside>
              </div>
            </div>
          </section>

          {/* FAQ PESQUISÁVEL */}
          <section id="duvidas" className="py-16">
            <div className="max-w-3xl mx-auto px-4">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#3C6E63]">
                    Perguntas Frequentes
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-[#0D2925] mt-1">
                    Tire Suas Dúvidas
                  </h2>
                </div>
                <input
                  type="search"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Buscar nas dúvidas..."
                  aria-label="Buscar perguntas frequentes"
                  className="bg-white border border-[#CFE2D9] rounded-full px-4 py-2 text-xs min-w-[210px]"
                />
              </div>
              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => (
                  <details
                    key={faq.id}
                    open={index === 0}
                    className="bg-white border border-[#DCECE5] rounded-2xl p-4"
                  >
                    <summary className="font-bold text-sm cursor-pointer text-[#0D2925]">
                      {faq.question}
                    </summary>
                    <p className="text-sm text-[#4A6862] mt-2 leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* BANNER CTA INFERIOR ARREDONDADO ESTILO SMILEORA */}
          <section id="contato" className="pb-16 pt-2">
            <div className="max-w-6xl mx-auto px-4">
              <div
                className="rounded-[34px] p-8 sm:p-11 text-white flex flex-wrap items-center justify-between gap-6 shadow-xl"
                style={{ backgroundColor: brandColor }}
              >
                <div className="flex items-center gap-5 max-w-xl">
                  <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/15 items-center justify-center shrink-0">
                    <ToothOutlineIcon className="w-9 h-9 text-white" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                      Pronto para conquistar seu{" "}
                      <span className="italic font-normal text-emerald-200">melhor sorriso</span>?
                    </h2>
                    <p className="text-sm text-white/85 mt-1">
                      {clinic.address} · {clinic.hoursLabel}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="#agendar"
                    className="bg-white text-[#0D2925] font-bold text-sm px-6 py-3.5 rounded-full shadow-sm hover:brightness-95 transition"
                  >
                    Agendar Consulta →
                  </a>
                  <a
                    href={buildSafeWhatsAppHandoffUrl(
                      clinic.whatsappPhone,
                      clinic.name,
                      "próximos horários",
                      "horário comercial"
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black/25 border border-white/25 text-white font-bold text-sm px-5 py-3.5 rounded-full hover:bg-black/35 transition"
                  >
                    WhatsApp Recepção
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>
      ) : (
        /* PAINEL DA SUA CLÍNICA */
        <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
          <div>
            <span className="text-xs font-bold tracking-[0.14em] text-[#3C6E63]">
              GESTÃO DA RECEPÇÃO (DEMO)
            </span>
            <h2 className="font-serif text-3xl font-bold mt-1 text-[#0D2925]">
              Painel da Sua Clínica — {clinic.name}
            </h2>
            <p className="text-sm text-[#4A6862]">
              Gerencie solicitações de agendamento e acompanhe o faturamento previsto.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#DCECE5] rounded-2xl p-4">
              <span className="block text-xs text-[#4A6862]">Solicitações Ativas</span>
              <strong className="font-serif text-2xl">{activeAppointments.length}</strong>
            </div>
            <div className="bg-white border border-[#DCECE5] rounded-2xl p-4">
              <span className="block text-xs text-[#4A6862]">Confirmadas</span>
              <strong className="font-serif text-2xl">{confirmedCount}</strong>
            </div>
            <div className="bg-white border border-[#DCECE5] rounded-2xl p-4">
              <span className="block text-xs text-[#4A6862]">Aguardando Recepção</span>
              <strong className="font-serif text-2xl">{requestedCount}</strong>
            </div>
            <div className="text-white rounded-2xl p-4" style={{ backgroundColor: brandColor }}>
              <span className="block text-xs text-white/80">Receita Prevista (Demo)</span>
              <strong className="font-serif text-2xl">{formatBRL(expectedRevenue)}</strong>
            </div>
          </div>

          <div className="bg-white border border-[#DCECE5] rounded-[26px] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-serif text-xl font-bold">Seus Clientes Agendados</h3>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["all", "Todos"],
                    ["REQUESTED", "Solicitadas"],
                    ["CONFIRMED", "Confirmadas"],
                    ["CANCELLED", "Canceladas"]
                  ] as const
                ).map(([st, label]) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${
                      statusFilter === st
                        ? "bg-[#0D2925] text-white border-[#0D2925]"
                        : "bg-white text-[#4A6862] border-[#DCECE5]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-[#F7FAF8] border border-[#DCECE5] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <strong className="text-sm block text-[#0D2925]">{apt.patientName}</strong>
                    <span className="text-xs text-[#4A6862]">
                      {apt.treatmentName} · {apt.professionalName}
                    </span>
                    {apt.notes && (
                      <span className="block text-xs italic text-[#4A6862] mt-0.5">
                        Obs: “{apt.notes}”
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-right text-xs">
                      <strong className="block">
                        {apt.dateLabel} às {apt.slotTime}
                      </strong>
                      <span className="text-[#4A6862]">
                        {apt.patientPhone} · {formatBRL(apt.demoPriceBrl)}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        apt.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-900"
                          : apt.status === "CANCELLED"
                            ? "bg-red-100 text-red-900"
                            : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {statusBadgeLabel(apt.status)}
                    </span>
                    <div className="flex gap-1.5">
                      {apt.status !== "CONFIRMED" && (
                        <button
                          type="button"
                          onClick={() => updateAppointmentStatus(apt.id, "CONFIRMED")}
                          className="px-2.5 py-1 rounded-lg border border-[#CFE2D9] bg-white text-xs font-bold text-emerald-800 cursor-pointer"
                        >
                          Confirmar
                        </button>
                      )}
                      {apt.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => updateAppointmentStatus(apt.id, "CANCELLED")}
                          className="px-2.5 py-1 rounded-lg border border-[#CFE2D9] bg-white text-xs font-bold text-red-800 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* DRAWER DE PERSONALIZAÇÃO */}
      {drawerOpen && (
        <aside
          aria-label="Personalize sua clínica"
          className="fixed inset-0 z-50 flex justify-end bg-black/45"
        >
          <div className="bg-white w-full max-w-md h-full p-6 overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#0D2925]">
                Personalize sua Clínica
              </h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full border border-[#DCECE5] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Nome da Sua Odontologia</label>
              <input
                type="text"
                value={clinic.name}
                onChange={(e) =>
                  setClinic((prev) => ({
                    ...prev,
                    name: e.target.value || initialClinic.name
                  }))
                }
                className="w-full border border-[#CFE2D9] rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Endereço</label>
              <input
                type="text"
                value={clinic.address}
                onChange={(e) => setClinic((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full border border-[#CFE2D9] rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Cor Principal da Clínica</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={clinic.branding.primaryColor}
                  onChange={(e) =>
                    setClinic((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, primaryColor: e.target.value }
                    }))
                  }
                />
                {["#0F4C5C", "#134E4A", "#1B4332", "#1E3A5F"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      setClinic((prev) => ({
                        ...prev,
                        branding: { ...prev.branding, primaryColor: c }
                      }))
                    }
                    className="w-6 h-6 rounded-full border border-white shadow cursor-pointer"
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>

            <hr className="border-[#DCECE5]" />

            <div className="space-y-2">
              <label className="block text-xs font-bold">Adicione seu Procedimento</label>
              <input
                type="text"
                value={newProcName}
                onChange={(e) => setNewProcName(e.target.value)}
                placeholder="Nome do procedimento"
                className="w-full border border-[#CFE2D9] rounded-xl px-3.5 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={newProcPrice}
                  onChange={(e) => setNewProcPrice(e.target.value)}
                  placeholder="Valor (R$)"
                  className="border border-[#CFE2D9] rounded-xl px-3.5 py-2 text-sm"
                />
                <input
                  type="number"
                  value={newProcDur}
                  onChange={(e) => setNewProcDur(e.target.value)}
                  placeholder="Minutos"
                  className="border border-[#CFE2D9] rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAddProcedure}
                className="w-full text-white font-bold text-sm py-2.5 rounded-full cursor-pointer"
                style={{ backgroundColor: brandColor }}
              >
                Adicionar à Lista
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* RODAPÉ LIMPO */}
      <footer className="bg-white border-t border-[#DCECE5] text-[#4A6862] py-8 text-xs mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#E3F3EC]"
              style={{ color: brandColor }}
            >
              <ToothOutlineIcon className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-[#0D2925] block">{clinic.name}</strong>
              <span>{clinic.address}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/privacidade" className="hover:text-[#0D2925] underline">
              Privacidade &amp; LGPD
            </Link>
            <Link href="/admin" className="hover:text-[#0D2925] underline">
              Portal Admin
            </Link>
            <span>
              Desenvolvido por <strong className="text-[#0D2925]">Joel Oliveira.</strong>
            </span>
          </div>
        </div>
      </footer>

      <OdontoAssistantWidget tenantId={clinic.tenantId} clinicName={clinic.name} />
    </div>
  );
}
