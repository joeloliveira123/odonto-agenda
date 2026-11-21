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
  "staff-camila":
    "“Acredito que um sorriso bonito nunca deve parecer artificial. Planejamos cada detalhe junto com você na tela antes de tocar no dente.”",
  "staff-rafael":
    "“Meu papel é devolver a segurança de mastigar e sorrir sem dor, usando planejamento 3D para procedimentos rápidos e previsíveis.”",
  "staff-juliana":
    "“Muitos pacientes chegam com receio por experiências antigas. Aqui fazemos pausas, explicamos cada passo e respeitamos o seu tempo.”"
};

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
      className="min-h-screen flex flex-col bg-[#F6F9F7] text-[#112A26]"
    >
      {/* BARRA DE AUTONOMIA DO DENTISTA */}
      <div className="bg-[#0B221E] text-[#F1F8F5] py-2.5 px-4 border-b border-white/10 text-xs sm:text-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="quick-clinic-input"
            className="inline-flex items-center gap-2.5 text-slate-200"
          >
            <svg
              width="30"
              height="22"
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
              Coloque o nome da <strong className="text-amber-300">Sua Odontologia</strong> e
              veja este site com a sua marca:
            </span>
          </label>
          <div className="flex items-center gap-2 flex-wrap">
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
              className="bg-white/10 border border-white/20 rounded-full px-3.5 py-1 text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-300"
            />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 hover:bg-emerald-400/30 px-3.5 py-1 rounded-full font-semibold text-xs cursor-pointer transition"
            >
              Personalizar Clínica
            </button>
          </div>
        </div>
      </div>

      {/* CABEÇALHO ESTILO SMILEORA / BRIGHTBITE */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DCE8E2]">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl text-white font-serif font-bold flex items-center justify-center shadow-sm"
              style={{ backgroundColor: brandColor }}
              aria-hidden="true"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 3C4.8 3 3 4.8 3 7.2c0 2.5 1.3 4.6 2 6.8.7 2.2 1.2 6 2.8 6 1.3 0 1.8-2.8 2.7-4.5.4-.8.9-1.2 1.5-1.2s1.1.4 1.5 1.2c.9 1.7 1.4 4.5 2.7 4.5 1.6 0 2.1-3.8 2.8-6 .7-2.2 2-4.3 2-6.8C21 4.8 19.2 3 17 3c-1.8 0-3.2 1-5 1S8.8 3 7 3Z" />
              </svg>
            </div>
            <div>
              <div className="font-serif font-bold text-lg leading-tight text-[#0E2925]">
                {clinic.name}
              </div>
              <div className="text-xs text-[#4A6862]">
                {clinic.subtitle}
              </div>
            </div>
          </div>

          <nav
            aria-label="Navegação principal"
            className="hidden lg:flex items-center gap-1 bg-[#EDF4F0] p-1 rounded-full border border-[#D7E6DF] text-xs font-semibold text-[#264640]"
          >
            <a
              href="#sobre"
              className="px-3.5 py-1.5 rounded-full text-white shadow-xs transition"
              style={{ backgroundColor: brandColor }}
            >
              A Clínica
            </a>
            <a
              href="#tratamentos"
              className="px-3.5 py-1.5 rounded-full hover:text-[#0E2925] transition"
            >
              Tratamentos
            </a>
            <a
              href="#jornada"
              className="px-3.5 py-1.5 rounded-full hover:text-[#0E2925] transition"
            >
              Como Funciona
            </a>
            <a
              href="#equipe"
              className="px-3.5 py-1.5 rounded-full hover:text-[#0E2925] transition"
            >
              Corpo Clínico
            </a>
            <a
              href="#depoimentos"
              className="px-3.5 py-1.5 rounded-full hover:text-[#0E2925] transition"
            >
              Depoimentos
            </a>
            <a
              href="#duvidas"
              className="px-3.5 py-1.5 rounded-full hover:text-[#0E2925] transition"
            >
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label="Abrir menu de navegação"
              className="lg:hidden px-3 py-1.5 rounded-full border border-[#CFE2D9] text-xs font-semibold text-[#112A26]"
            >
              Menu
            </button>

            <div
              className="inline-flex bg-[#EDF4F0] p-1 rounded-full border border-[#D7E6DF]"
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "patient"}
                onClick={() => setActiveView("patient")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                  activeView === "patient"
                    ? "bg-white text-[#0E2925] shadow-xs"
                    : "text-[#4A6862]"
                }`}
              >
                Visão do Paciente
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "clinic"}
                onClick={() => setActiveView("clinic")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition ${
                  activeView === "clinic"
                    ? "bg-white text-[#0E2925] shadow-xs"
                    : "text-[#4A6862]"
                }`}
              >
                Painel da Sua Clínica
                <span
                  className="text-white text-[11px] px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: brandColor }}
                >
                  {activeAppointments.length}
                </span>
              </button>
            </div>

            <a
              href="#agendar"
              className="hidden sm:inline-flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-sm hover:opacity-95 transition"
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
            className="lg:hidden border-t border-[#DCE8E2] bg-white px-4 py-3 flex flex-wrap gap-4 text-xs font-semibold text-[#264640]"
          >
            <a href="#sobre" onClick={() => setMobileMenuOpen(false)}>
              A Clínica
            </a>
            <a href="#tratamentos" onClick={() => setMobileMenuOpen(false)}>
              Tratamentos
            </a>
            <a href="#jornada" onClick={() => setMobileMenuOpen(false)}>
              Como Funciona
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
          </nav>
        )}
      </header>

      {/* AVISO TRANSPARENTE DE MODO DEMO */}
      <div className="bg-[#E3EFEA] border-b border-[#CFE2D9] py-1.5 px-4 text-center text-xs text-[#1D4039]">
        {supabaseConfigured
          ? "Conectado ao ambiente Supabase configurado."
          : "Modo Demonstração ativo: teste agendamentos, personalize o nome/cor da clínica e veja as falas e argumentos pensados para converter pacientes."}
      </div>

      {activeView === "patient" ? (
        <main>
          {/* HERO EQUILIBRADO: TEXTO PERSUASIVO + FALAS REAIS + RETRATO COMPACTO */}
          <section className="relative overflow-hidden bg-gradient-to-b from-[#E5F2EC] via-[#EEF6F2] to-[#F6F9F7] pt-10 pb-16 border-b border-[#DCE8E2]">
            <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-10 items-center">
              {/* COLUNA ESQUERDA (7 COLUNAS): COPY PRINCIPAL, FALAS E PROVA SOCIAL */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DCECE5] border border-[#BFE0D2] text-xs font-bold text-[#0F4C5C] uppercase tracking-wider">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  />
                  Atendimento Sem Pressa · Tecnologia 3D · CRO Ativo
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-[1.12] tracking-tight text-[#0E2925]">
                  Cuidado odontológico gentil e preciso na{" "}
                  <span className="italic font-normal" style={{ color: brandColor }}>
                    {clinic.name}
                  </span>
                  .
                </h1>

                <p className="text-[#385751] text-base sm:text-lg leading-relaxed max-w-2xl">
                  Esqueça a espera no telefone e o receio de ir ao dentista. Aqui você conversa sem
                  pressa com o especialista, enxerga cada detalhe do seu diagnóstico na tela 3D
                  antes de decidir qualquer procedimento e agenda sua consulta ou{" "}
                  <strong className="text-[#0E2925]">encaixe de urgência no mesmo dia</strong> em
                  menos de um minuto.
                </p>

                {/* DESTAQUE DE FALA / COMPROMISSO CLÍNICO NO HERO */}
                <div className="bg-white/85 border-l-4 rounded-r-2xl p-4 shadow-xs text-sm text-[#1E3F39]" style={{ borderLeftColor: brandColor }}>
                  <p className="italic">
                    “Nosso compromisso é simples: nenhum paciente senta na cadeira sem saber
                    exatamente o que será feito, por que será feito e o valor fechado de cada
                    etapa.”
                  </p>
                  <span className="block text-xs font-bold text-[#4A6862] mt-1">
                    — Diretriz de Atendimento Humanizado · {clinic.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <a
                    href="#agendar"
                    className="inline-flex items-center gap-2 text-white font-bold text-sm px-6 py-3.5 rounded-full shadow-md hover:brightness-105 transition"
                    style={{ backgroundColor: brandColor }}
                  >
                    <span>Agendar Minha Consulta</span>
                    <span aria-hidden="true">→</span>
                  </a>
                  <a
                    href="#agendar"
                    onClick={handleSelectUrgency}
                    className="inline-flex items-center gap-2 bg-white border border-[#CFE2D9] text-[#0E2925] font-bold text-sm px-5 py-3.5 rounded-full shadow-xs hover:bg-[#EDF5F1] transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Preciso de Urgência Hoje</span>
                  </a>
                </div>

                {/* FAIXA DE PROVA RÁPIDA (DO ORIGINAL) */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#CFE2D9]/80 max-w-xl">
                  <div>
                    <strong className="font-serif text-lg sm:text-xl font-bold text-[#0E2925] block">
                      4.9 ★
                    </strong>
                    <span className="text-xs text-[#4A6862]">
                      340+ avaliações verificadas
                    </span>
                  </div>
                  <div className="border-l border-[#CFE2D9] pl-3">
                    <strong className="font-serif text-lg sm:text-xl font-bold text-[#0E2925] block">
                      Scanner 3D
                    </strong>
                    <span className="text-xs text-[#4A6862]">
                      Sem moldagens desconfortáveis
                    </span>
                  </div>
                  <div className="border-l border-[#CFE2D9] pl-3">
                    <strong className="font-serif text-lg sm:text-xl font-bold text-[#0E2925] block">
                      Até 12x
                    </strong>
                    <span className="text-xs text-[#4A6862]">
                      Particular e nota p/ reembolso
                    </span>
                  </div>
                </div>
              </div>

              {/* COLUNA DIREITA (5 COLUNAS): CARD DE FALA VERIFICADA DA PACIENTE + FOTO COMPACTA + HORÁRIOS */}
              <div className="lg:col-span-5 space-y-4">
                {/* CARD DE DEPOIMENTO EM DESTAQUE + MINI FOTO */}
                <div className="bg-white border border-[#DCE8E2] rounded-3xl p-6 shadow-lg space-y-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="/images/hero-patient.jpg"
                      alt={`Paciente atendida na ${clinic.name}`}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#DCECE5] shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E3EFEA] text-[#0F4C5C]">
                          Relato de Paciente
                        </span>
                        <span className="text-amber-500 text-xs tracking-widest">★★★★★</span>
                      </div>
                      <strong className="block text-sm text-[#0E2925] mt-1">
                        Mariana Siqueira
                      </strong>
                      <span className="text-xs text-[#4A6862]">
                        Paciente de Clareamento &amp; Profilaxia
                      </span>
                    </div>
                  </div>

                  <blockquote className="text-sm sm:text-[15px] text-[#112A26] leading-relaxed italic bg-[#F6F9F7] border border-[#E2EDE8] rounded-2xl p-4">
                    “Sempre tive receio de dentista, mas aqui fui atendida no horário exato, sem
                    dor e com explicação clara de cada etapa do tratamento na tela.”
                  </blockquote>

                  <div className="grid sm:grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="bg-[#F6F9F7] border border-[#DCE8E2] rounded-2xl p-3">
                      <span className="block text-[11px] font-semibold text-[#4A6862] uppercase">
                        Horário de Atendimento
                      </span>
                      <strong className="text-[#0E2925] block mt-0.5">{clinic.hoursLabel}</strong>
                    </div>
                    <div className="bg-[#F6F9F7] border border-[#DCE8E2] rounded-2xl p-3">
                      <span className="block text-[11px] font-semibold text-[#4A6862] uppercase">
                        Endereço &amp; Acesso
                      </span>
                      <strong className="text-[#0E2925] block mt-0.5">{clinic.address}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* POR QUE A SUA ODONTOLOGIA — MAIS TEXTO, ARGUMENTOS E IMAGEM COMPACTA (4 COLUNAS) */}
          <section id="sobre" className="py-16 bg-white border-b border-[#DCE8E2]">
            <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-10 items-start">
              {/* TEXTO E ARGUMENTOS (8 COLUNAS) */}
              <div className="lg:col-span-8 space-y-5">
                <span className="inline-block px-3.5 py-1 rounded-full bg-[#E3EFEA] text-xs font-bold uppercase tracking-wider text-[#0F4C5C]">
                  Referência em Odontologia Humanizada
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0E2925] leading-tight">
                  Uma das clínicas mais completas da região, com especialistas que realmente
                  escutam você.
                </h2>
                <p className="text-[#3C5A54] text-base leading-relaxed">
                  Na <strong className="text-[#0E2925]">{clinic.name}</strong>, você não é atendido
                  às pressas em consultas de 10 minutos. Reunimos cirurgiões-dentistas especialistas
                  com formação de ponta, diagnóstico por câmera intraoral e um ambiente acolhedor
                  pensado para eliminar a ansiedade de quem adia o tratamento por medo de sentir
                  dor.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-[#F6F9F7] border border-[#DCE8E2] rounded-2xl p-4 space-y-1.5">
                    <strong className="block text-sm text-[#0E2925]">
                      1. Corpo Clínico de Destaque
                    </strong>
                    <p className="text-xs text-[#4A6862] leading-relaxed">
                      Especialistas dedicados por área (Estética, Implantes, Endodontia e
                      Ortodontia) — você passa com quem domina o seu caso.
                    </p>
                  </div>
                  <div className="bg-[#F6F9F7] border border-[#DCE8E2] rounded-2xl p-4 space-y-1.5">
                    <strong className="block text-sm text-[#0E2925]">
                      2. Explicação Clara na Tela
                    </strong>
                    <p className="text-xs text-[#4A6862] leading-relaxed">
                      Fotografamos e escaneamos seu sorriso em alta definição para mostrar na tela
                      o que realmente precisa ser tratado, sem termos técnicos confusos.
                    </p>
                  </div>
                  <div className="bg-[#F6F9F7] border border-[#DCE8E2] rounded-2xl p-4 space-y-1.5">
                    <strong className="block text-sm text-[#0E2925]">
                      3. Zero Surpresas no Orçamento
                    </strong>
                    <p className="text-xs text-[#4A6862] leading-relaxed">
                      Você recebe o plano completo por escrito, com valores transparentes, etapas
                      bem definidas e condições em até 12x antes de iniciar.
                    </p>
                  </div>
                </div>
              </div>

              {/* COLUNA LATERAL COMPACTA (4 COLUNAS): IMAGEM MENOR + LEGENDA */}
              <div className="lg:col-span-4 bg-[#F6F9F7] border border-[#DCE8E2] rounded-3xl p-4 space-y-3">
                <div className="rounded-2xl overflow-hidden aspect-[4/3] border border-[#DCE8E2]">
                  <img
                    src="/images/about-dentist-care.jpg"
                    alt={`Atendimento cuidadoso na ${clinic.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="px-1">
                  <strong className="block text-sm text-[#0E2925]">
                    Tempo Exclusivo para Cada Paciente
                  </strong>
                  <p className="text-xs text-[#4A6862] mt-1 leading-relaxed">
                    “Reservamos janelas amplas na agenda para que você tire todas as dúvidas com
                    calma e faça o procedimento no seu ritmo.”
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* COMO FUNCIONA SUA PRIMEIRA CONSULTA (JORNADA EM TEXTO CLARO) */}
          <section id="jornada" className="py-14 bg-[#EDF5F1] border-b border-[#DCE8E2]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="max-w-2xl mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#3C6E63]">
                  PASSO A PASSO SEM ANSIEDADE
                </span>
                <h2 className="font-serif text-3xl font-bold text-[#0E2925] mt-1">
                  O Que Acontece na Sua Primeira Visita
                </h2>
                <p className="text-sm text-[#4A6862] mt-1">
                  Sabemos que a previsibilidade traz tranquilidade. Veja exatamente como conduzimos
                  o seu atendimento na <strong>{clinic.name}</strong>:
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {[
                  {
                    step: "Etapa 01",
                    title: "Conversa Inicial & Escuta Ativa",
                    quote: "“Primeiro ouvimos o que incomoda você e seu histórico, fora da cadeira odontológica.”",
                    desc: "Antes de qualquer exame clínico, conversamos sobre suas prioridades, eventuais receios, sensibilidade ou urgência para adaptar todo o atendimento ao seu perfil."
                  },
                  {
                    step: "Etapa 02",
                    title: "Check-up Digital 3D na Tela",
                    quote: "“Você vê exatamente o que o dentista está vendo, dente por dente.”",
                    desc: "Realizamos o exame com câmera intraoral e escaneamento digital sem massinhas. Mostramos as imagens na tela para que você compreenda o diagnóstico com total segurança."
                  },
                  {
                    step: "Etapa 03",
                    title: "Plano Fechado & Decisão Sem Pressão",
                    quote: "“Apresentamos as opções, prazos e valores claros para você decidir no seu tempo.”",
                    desc: "Entregamos seu cronograma de tratamento detalhado, opções de parcelamento e documentação para reembolso de convênio, iniciando apenas quando você estiver 100% confortável."
                  }
                ].map((item) => (
                  <article
                    key={item.step}
                    className="bg-white border border-[#DCE8E2] rounded-3xl p-6 space-y-3 shadow-xs"
                  >
                    <span
                      className="inline-block text-xs font-bold px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      {item.step}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#0E2925]">{item.title}</h3>
                    <p className="text-xs font-semibold italic text-[#0F4C5C] bg-[#F6F9F7] border border-[#DCE8E2] rounded-xl p-3">
                      {item.quote}
                    </p>
                    <p className="text-sm text-[#4A6862] leading-relaxed">{item.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* TRATAMENTOS & ESPECIALIDADES COM EXPLICAÇÕES DETALHADAS */}
          <section id="tratamentos" className="py-16">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div className="max-w-xl">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#3C6E63]">
                    ESPECIALIDADES &amp; PROCEDIMENTOS
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0E2925] mt-1">
                    Tratamentos da {clinic.name}
                  </h2>
                  <p className="text-sm text-[#4A6862] mt-1">
                    Clique em qualquer tratamento para selecioná-lo no agendamento ou abra o guia
                    educativo completo com passo a passo e cuidados.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    value={treatmentSearch}
                    onChange={(e) => setTreatmentSearch(e.target.value)}
                    placeholder="Buscar tratamento..."
                    aria-label="Buscar tratamento"
                    className="bg-white border border-[#CFE2D9] rounded-full px-4 py-2 text-xs min-w-[200px]"
                  />
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
                      className={`px-4 py-2 rounded-full text-xs font-bold border cursor-pointer transition ${
                        treatmentCat === cat
                          ? "text-white border-transparent shadow-xs"
                          : "bg-white text-[#3C5A54] border-[#CFE2D9] hover:bg-[#EAF3EE]"
                      }`}
                      style={
                        treatmentCat === cat ? { backgroundColor: brandColor } : undefined
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {filteredTreatments.map((t) => {
                  const isSelected = selectedTreatment?.id === t.id;
                  return (
                    <article
                      key={t.id}
                      onClick={() => setSelectedTreatmentId(t.id)}
                      className={`rounded-3xl p-6 border-2 transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-white shadow-lg"
                          : "bg-white/90 hover:bg-white border-[#DCE8E2] hover:shadow-md"
                      }`}
                      style={isSelected ? { borderColor: brandColor } : undefined}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#E3EFEA] text-[#0F4C5C]">
                            {t.categoryLabel}
                          </span>
                          <span className="text-xs text-[#4A6862] font-semibold">
                            Sessão de ~{t.estimatedDurationMinutes} min
                          </span>
                        </div>

                        <h3 className="font-serif text-xl font-bold text-[#0E2925] mb-2">
                          {t.displayName}
                        </h3>
                        <p className="text-sm text-[#385751] leading-relaxed mb-3">
                          {t.overview}
                        </p>

                        <div
                          className="bg-[#F6F9F7] border-l-4 rounded-r-2xl p-3.5 text-xs text-[#112A26] mb-4"
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

                      <div className="pt-3.5 border-t border-[#DCE8E2] flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <strong
                            className="text-base font-bold"
                            style={{ color: brandColor }}
                          >
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
                            className="font-bold underline text-[#0F4C5C] hover:text-[#0E2925]"
                          >
                            Ler guia completo →
                          </Link>
                          <a
                            href="#agendar"
                            onClick={() => setSelectedTreatmentId(t.id)}
                            className="px-3.5 py-1.5 rounded-full font-bold text-white transition"
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

          {/* CONFORTO, TECNOLOGIA & TRANSPARÊNCIA FINANCEIRA (100% TEXTO EXPLICATIVO, SEM FOTO GIGANTE) */}
          <section id="estrutura" className="py-16 bg-[#0E2925] text-[#F1F8F5]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="max-w-2xl mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                  CONFORTO, PRECISÃO &amp; BIOSSEGURANÇA
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1 text-white">
                  Estrutura Pensada para Quem Tem Receio de Dentista
                </h2>
                <p className="text-sm text-emerald-100/85 mt-2 leading-relaxed">
                  Substituímos procedimentos antigos e demorados por recursos modernos que tornam
                  o atendimento mais rápido, silencioso e previsível:
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <article className="bg-white/6 border border-white/12 rounded-3xl p-5 space-y-2">
                  <h3 className="font-serif text-lg font-bold text-white">
                    Anestesia Cuidadosa &amp; Sem Pressa
                  </h3>
                  <p className="text-sm text-emerald-100/80 leading-relaxed">
                    Utilizamos anestésicos tópicos prévios e controle suave de aplicação para
                    eliminar o desconforto da anestesia tradicional.
                  </p>
                </article>

                <article className="bg-white/6 border border-white/12 rounded-3xl p-5 space-y-2">
                  <h3 className="font-serif text-lg font-bold text-white">
                    Escaneamento Intraoral 3D
                  </h3>
                  <p className="text-sm text-emerald-100/80 leading-relaxed">
                    Substitui as massinhas de moldagem que causam náusea por uma leitura digital em
                    segundos com precisão milimétrica.
                  </p>
                </article>

                <article className="bg-white/6 border border-white/12 rounded-3xl p-5 space-y-2">
                  <h3 className="font-serif text-lg font-bold text-white">
                    Esterilização Hospitalar Classe B
                  </h3>
                  <p className="text-sm text-emerald-100/80 leading-relaxed">
                    Protocolo rigoroso com autoclave hospitalar e kits individuais lacrados e
                    rastreados por paciente em todos os atendimentos.
                  </p>
                </article>

                <article className="bg-white/6 border border-white/12 rounded-3xl p-5 space-y-2">
                  <h3 className="font-serif text-lg font-bold text-white">
                    Transparência Financeira &amp; Reembolso
                  </h3>
                  <p className="text-sm text-emerald-100/80 leading-relaxed">
                    Orçamento fechado antes de iniciar, parcelamento em até 12x e emissão de laudo
                    e nota fiscal para reembolso no seu plano.
                  </p>
                </article>
              </div>
            </div>
          </section>

          {/* CORPO CLÍNICO + A FALA DE CADA ESPECIALISTA */}
          <section id="equipe" className="py-16 bg-white border-b border-[#DCE8E2]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="max-w-2xl mb-10">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#3C6E63]">
                  CORPO CLÍNICO COM CRO ATIVO
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0E2925] mt-1">
                  Quem Cuida do Seu Sorriso — e Como Pensamos
                </h2>
                <p className="text-sm text-[#4A6862] mt-1">
                  Conheça a formação e a filosofia de trabalho de cada especialista da{" "}
                  <strong>{clinic.name}</strong>:
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {initialStaff.map((s) => (
                  <article
                    key={s.id}
                    className="bg-[#F6F9F7] border border-[#DCE8E2] rounded-3xl p-6 flex flex-col justify-between space-y-4"
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
                          <h3 className="font-serif text-lg font-bold text-[#0E2925]">
                            {s.displayName}
                          </h3>
                          <span className="block text-xs font-bold text-[#3C6E63]">
                            {s.specialty} · {s.croRegistration}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-[#385751] leading-relaxed">{s.bio}</p>
                    </div>

                    <blockquote className="bg-white border border-[#DCE8E2] rounded-2xl p-3.5 text-xs italic text-[#112A26] leading-relaxed">
                      {STAFF_QUOTES[s.id] ??
                        "“Nosso foco é unir precisão técnica e escuta atenta em cada consulta.”"}
                    </blockquote>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* FALAS DOS PACIENTES (DEPOIMENTOS DETALHADOS) */}
          <section id="depoimentos" className="py-16 bg-[#F6F9F7]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#3C6E63]">
                  — A VOZ DOS NOSSOS PACIENTES —
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0E2925] mt-1">
                  O Que Dizem Quem Já Transformou o Sorriso Conosco
                </h2>
                <p className="text-sm text-[#4A6862] mt-1">
                  Relatos ilustrativos que demonstram como a comunicação clara e o cuidado sem
                  pressa fazem diferença na experiência do paciente.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {[
                  {
                    quote:
                      "“Eu adiava minha ida ao dentista há quase 4 anos por medo de sentir dor. Na primeira consulta a doutora me mostrou tudo na câmera intraoral, explicou sem pressa e não senti absolutamente nada no procedimento.”",
                    author: "Mariana Siqueira",
                    role: "Prevenção & Clareamento Dental",
                    tag: "Zero dor e acolhimento"
                  },
                  {
                    quote:
                      "“O que mais me conquistou foi a transparência. Fizeram o escaneamento 3D sem aquela massinha desconfortável, simularam o alinhamento dos meus dentes na tela e cumpriram cada prazo prometido.”",
                    author: "Rafael Mendes",
                    role: "Ortodontia & Alinhadores Transparentes",
                    tag: "Planejamento 3D preciso"
                  },
                  {
                    quote:
                      "“Tive uma dor aguda numa terça-feira de manhã, solicitei o encaixe de urgência pelo site e em poucas horas já estava sendo atendida. Resolveram a dor no mesmo dia e explicaram todo o orçamento antes.”",
                    author: "Cláudia Ferreira",
                    role: "Atendimento de Urgência & Endodontia",
                    tag: "Encaixe rápido no mesmo dia"
                  }
                ].map((item) => (
                  <article
                    key={item.author}
                    className="bg-white border border-[#DCE8E2] rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-amber-500 text-sm tracking-widest">★★★★★</span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E3EFEA] text-[#0F4C5C]">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-sm text-[#112A26] leading-relaxed italic">
                        {item.quote}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#DCE8E2]">
                      <strong className="block text-sm text-[#0E2925]">{item.author}</strong>
                      <span className="text-xs text-[#4A6862]">{item.role}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* AGENDAMENTO ONLINE EM TEMPO REAL */}
          <section id="agendar" className="py-16 bg-[#E9F2EE] border-y border-[#CFE2D9]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#3C6E63]">
                  — AGENDA ONLINE EM TEMPO REAL —
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0E2925] mt-1">
                  Reserve seu Horário na {clinic.name}
                </h2>
                <p className="text-sm text-[#4A6862] mt-1">
                  Escolha o especialista, o melhor dia e horário e envie sua solicitação sem
                  depender de espera no telefone.
                </p>
              </div>

              <div className="grid lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <div className="bg-white border border-[#DCE8E2] rounded-3xl p-6 shadow-xs">
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
                              ? "bg-[#E3EFEA]/60"
                              : "border-[#DCE8E2] bg-white"
                          }`}
                          style={
                            selectedDentistId === s.id ? { borderColor: brandColor } : undefined
                          }
                        >
                          <strong className="block text-sm text-[#0E2925]">
                            {s.displayName}
                          </strong>
                          <span className="text-xs text-[#4A6862]">{s.specialty}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedDentistId("any")}
                        className={`text-left p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                          selectedDentistId === "any"
                            ? "bg-[#E3EFEA]/60"
                            : "border-[#DCE8E2] bg-white"
                        }`}
                        style={
                          selectedDentistId === "any" ? { borderColor: brandColor } : undefined
                        }
                      >
                        <strong className="block text-sm text-[#0E2925]">
                          Primeiro horário livre
                        </strong>
                        <span className="text-xs text-[#4A6862]">
                          Qualquer dentista disponível
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-[#DCE8E2] rounded-3xl p-6 shadow-xs">
                    <h3 className="font-serif text-lg font-bold mb-3">
                      2. Escolha o Dia e o Horário
                    </h3>
                    <div className="grid grid-cols-5 gap-2 mb-4">
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
                              : "bg-white border-[#DCE8E2]"
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

                    <div className="grid grid-cols-4 gap-2">
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
                                ? "bg-[#F1F5F3] text-slate-400 line-through cursor-not-allowed border-[#DCE8E2]"
                                : isPicked
                                  ? "text-white border-transparent cursor-pointer shadow-xs"
                                  : "bg-white border-[#DCE8E2] cursor-pointer hover:border-[#0F4C5C]"
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

                <aside className="lg:col-span-5 lg:sticky lg:top-24 bg-white border border-[#DCE8E2] rounded-3xl p-6 shadow-md">
                  <h3 className="font-serif text-xl font-bold mb-4 text-[#0E2925]">
                    Resumo da Consulta
                  </h3>

                  <div className="bg-[#F6F9F7] border border-[#DCE8E2] rounded-2xl p-4 space-y-2 text-sm mb-4">
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
                    <div className="flex justify-between gap-2 pt-2 border-t border-[#DCE8E2]">
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
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#3C6E63]">
                    PERGUNTAS FREQUENTES
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-[#0E2925] mt-1">
                    Tire Suas Dúvidas Antes da Consulta
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
                    className="bg-white border border-[#DCE8E2] rounded-2xl p-4"
                  >
                    <summary className="font-bold text-sm cursor-pointer text-[#0E2925]">
                      {faq.question}
                    </summary>
                    <p className="text-sm text-[#4A6862] mt-2 leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* BANNER CTA INFERIOR ESTILO SMILEORA */}
          <section id="contato" className="pb-16 pt-4">
            <div className="max-w-6xl mx-auto px-4">
              <div
                className="rounded-[32px] p-8 sm:p-10 text-white flex flex-wrap items-center justify-between gap-6 shadow-xl"
                style={{ backgroundColor: brandColor }}
              >
                <div className="flex items-center gap-5 max-w-xl">
                  <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/15 items-center justify-center shrink-0">
                    <svg
                      className="w-9 h-9 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M7 3C4.8 3 3 4.8 3 7.2c0 2.5 1.3 4.6 2 6.8.7 2.2 1.2 6 2.8 6 1.3 0 1.8-2.8 2.7-4.5.4-.8.9-1.2 1.5-1.2s1.1.4 1.5 1.2c.9 1.7 1.4 4.5 2.7 4.5 1.6 0 2.1-3.8 2.8-6 .7-2.2 2-4.3 2-6.8C21 4.8 19.2 3 17 3c-1.8 0-3.2 1-5 1S8.8 3 7 3Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                      Pronto para Cuidar do Seu Sorriso com Tranquilidade?
                    </h2>
                    <p className="text-sm text-white/85 mt-1">
                      {clinic.address} · {clinic.hoursLabel}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="#agendar"
                    className="bg-white text-[#0E2925] font-bold text-sm px-6 py-3.5 rounded-full shadow-sm hover:brightness-95"
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
                    className="bg-black/25 border border-white/25 text-white font-bold text-sm px-5 py-3.5 rounded-full hover:bg-black/35"
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
            <h2 className="font-serif text-3xl font-bold mt-1 text-[#0E2925]">
              Painel da Sua Clínica — {clinic.name}
            </h2>
            <p className="text-sm text-[#4A6862]">
              Gerencie solicitações de agendamento e acompanhe o faturamento previsto.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#DCE8E2] rounded-2xl p-4">
              <span className="block text-xs text-[#4A6862]">Solicitações Ativas</span>
              <strong className="font-serif text-2xl">{activeAppointments.length}</strong>
            </div>
            <div className="bg-white border border-[#DCE8E2] rounded-2xl p-4">
              <span className="block text-xs text-[#4A6862]">Confirmadas</span>
              <strong className="font-serif text-2xl">{confirmedCount}</strong>
            </div>
            <div className="bg-white border border-[#DCE8E2] rounded-2xl p-4">
              <span className="block text-xs text-[#4A6862]">Aguardando Recepção</span>
              <strong className="font-serif text-2xl">{requestedCount}</strong>
            </div>
            <div
              className="text-white rounded-2xl p-4"
              style={{ backgroundColor: brandColor }}
            >
              <span className="block text-xs text-white/80">Receita Prevista (Demo)</span>
              <strong className="font-serif text-2xl">{formatBRL(expectedRevenue)}</strong>
            </div>
          </div>

          <div className="bg-white border border-[#DCE8E2] rounded-3xl p-6">
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
                        ? "bg-[#0E2925] text-white border-[#0E2925]"
                        : "bg-white text-[#4A6862] border-[#DCE8E2]"
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
                  className="bg-[#F6F9F7] border border-[#DCE8E2] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <strong className="text-sm block text-[#0E2925]">{apt.patientName}</strong>
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
              <h3 className="font-serif text-xl font-bold text-[#0E2925]">
                Personalize sua Clínica
              </h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full border border-[#DCE8E2] cursor-pointer"
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
                {["#0F4C5C", "#1B4332", "#1E3A5F", "#8C4A32"].map((c) => (
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

            <hr className="border-[#DCE8E2]" />

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

      {/* RODAPÉ */}
      <footer className="bg-[#0B221E] text-slate-300 py-8 text-xs border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold"
              style={{ backgroundColor: brandColor }}
            >
              SO
            </div>
            <span>
              <strong className="text-white">{clinic.name}</strong> · {clinic.address}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/privacidade" className="underline hover:text-white">
              Privacidade &amp; LGPD
            </Link>
            <Link href="/admin" className="underline hover:text-white">
              Portal Admin
            </Link>
            <span>
              Desenvolvido por <strong className="text-white">Joel Oliveira.</strong>
            </span>
          </div>
        </div>
      </footer>

      <OdontoAssistantWidget tenantId={clinic.tenantId} clinicName={clinic.name} />
    </div>
  );
}
