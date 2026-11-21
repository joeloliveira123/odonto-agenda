"use client";

import { useMemo, useState } from "react";
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
  const [treatmentCat, setTreatmentCat] = useState<"all" | TreatmentCategory>("all");
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

  const filteredTreatments = useMemo(
    () =>
      treatments.filter((t) => treatmentCat === "all" || t.category === treatmentCat),
    [treatments, treatmentCat]
  );

  const busySlots = useMemo(() => {
    return new Set(
      appointments
        .filter((a) => a.dateIso === selectedDay.iso && ACTIVE_STATUSES.has(a.status))
        .map((a) => a.slotTime)
    );
  }, [appointments, selectedDay]);

  const activeAppointments = useMemo(
    () => appointments.filter((a) => a.status !== "CANCELLED"),
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

  const filteredAdminList = useMemo(
    () =>
      appointments.filter(
        (a) => statusFilter === "all" || a.status === statusFilter
      ),
    [appointments, statusFilter]
  );

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

    const created: Treatment = {
      id: `tr-${Date.now()}`,
      tenantId: clinic.tenantId,
      slug: `custom-${Date.now()}`,
      category: parsed.data.category,
      categoryLabel: "Personalizado",
      displayName: parsed.data.displayName,
      overview: "Procedimento personalizado adicionado para demonstração da clínica.",
      clinicDifferential: "Configurado sob medida para a apresentação da sua odontologia.",
      estimatedDurationMinutes: parsed.data.estimatedDurationMinutes,
      demoPriceBrl: parsed.data.demoPriceBrl,
      active: true
    };

    setTreatments((prev) => [created, ...prev]);
    setSelectedTreatmentId(created.id);
    setNewProcName("");
    setNewProcPrice("");
  }

  function updateStatus(id: string, nextStatus: AppointmentStatus) {
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
    );
  }

  const brandStyle = {
    ["--brand" as string]: clinic.branding.primaryColor
  };

  return (
    <div style={brandStyle}>
      {/* BARRA DE AUTONOMIA DO DENTISTA */}
      <div className="bg-[#14212B] text-[#FAF8F5] py-2.5 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="quick-clinic-name"
            className="text-xs sm:text-sm text-[#E5DFD7] inline-flex items-center gap-2.5"
          >
            <svg
              width="28"
              height="20"
              viewBox="-10 0 215 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
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
              Coloque o nome da <strong>Sua Odontologia</strong> e teste como se fosse o seu site:
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <input
              id="quick-clinic-name"
              type="text"
              value={clinic.name === initialClinic.name ? "" : clinic.name}
              onChange={(e) =>
                setClinic((prev) => ({
                  ...prev,
                  name: e.target.value.trim() || initialClinic.name
                }))
              }
              placeholder="Ex: Odontologia Almeida"
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-300 min-w-[210px]"
            />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="bg-[#C87D55] hover:brightness-105 text-white text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer"
            >
              Personalizar Clínica
            </button>
          </div>
        </div>
      </div>

      {/* CABEÇALHO */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#E5DFD7]">
        <div className="max-w-6xl mx-auto px-4 min-h-[72px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl text-white font-serif font-bold flex items-center justify-center"
              style={{ backgroundColor: clinic.branding.primaryColor }}
            >
              {getInitials(clinic.name)}
            </div>
            <div>
              <div className="font-serif font-semibold text-lg leading-tight">{clinic.name}</div>
              <div className="text-xs text-[#52606D]">{clinic.subtitle}</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#52606D]">
            <a href="#sobre" className="hover:text-[#0F4C5C]">
              A Clínica
            </a>
            <a href="#tratamentos" className="hover:text-[#0F4C5C]">
              Tratamentos
            </a>
            <a href="#equipe" className="hover:text-[#0F4C5C]">
              Corpo Clínico
            </a>
            <a href="#duvidas" className="hover:text-[#0F4C5C]">
              Dúvidas
            </a>
          </nav>

          <div
            className="inline-flex bg-[#F3EFE9] p-1 rounded-lg border border-[#E5DFD7]"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "patient"}
              onClick={() => setActiveView("patient")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                activeView === "patient"
                  ? "bg-white text-[#14212B] shadow-sm"
                  : "text-[#52606D]"
              }`}
            >
              Visão do Paciente
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "clinic"}
              onClick={() => setActiveView("clinic")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                activeView === "clinic"
                  ? "bg-white text-[#14212B] shadow-sm"
                  : "text-[#52606D]"
              }`}
            >
              Painel da Sua Clínica
              <span
                className="text-white text-[11px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: clinic.branding.primaryColor }}
              >
                {activeAppointments.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* AVISO TRANSPARENTE DE MODO DEMO */}
      <div className="bg-[#DCE8E2]/60 border-b border-[#E5DFD7] py-2 px-4 text-center text-xs text-[#14212B]">
        {supabaseConfigured
          ? "Conectado ao ambiente Supabase configurado."
          : "Modo Demonstração ativo (sem banco de dados conectado): agendamentos ficam apenas nesta sessão do navegador."}
      </div>

      {activeView === "patient" ? (
        <main>
          {/* HERO */}
          <section className="py-12 border-b border-[#E5DFD7]">
            <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-5">
                <p className="text-xs font-bold tracking-[0.14em] text-[#C87D55]">
                  ATENDIMENTO HUMANIZADO · FASE 1 NEXT.JS
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
                  Cuidado odontológico gentil e preciso na{" "}
                  <span style={{ color: clinic.branding.primaryColor }}>{clinic.name}</span>.
                </h1>
                <p className="text-[#52606D] text-base sm:text-lg max-w-xl">
                  Conheça nossos tratamentos, entenda cada etapa com transparência e envie sua
                  solicitação de consulta sem esperar resposta no telefone.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="#agendar"
                    className="text-white font-semibold text-sm px-5 py-3 rounded-lg"
                    style={{ backgroundColor: clinic.branding.primaryColor }}
                  >
                    Agendar Minha Consulta
                  </a>
                  <a
                    href="#tratamentos"
                    className="bg-[#F3EFE9] border border-[#CFC6BA] text-[#14212B] font-semibold text-sm px-5 py-3 rounded-lg"
                  >
                    Ver Tratamentos
                  </a>
                </div>
              </div>

              <div className="md:col-span-5 bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#C87D55]">
                  Informações da Clínica (Demo)
                </div>
                <div>
                  <div className="text-xs text-[#52606D]">Horário de Atendimento</div>
                  <div className="font-semibold text-sm">{clinic.hoursLabel}</div>
                </div>
                <div>
                  <div className="text-xs text-[#52606D]">Endereço</div>
                  <div className="font-semibold text-sm">{clinic.address}</div>
                </div>
                <div className="pt-3 border-t border-[#E5DFD7] text-xs text-[#52606D]">
                  Os horários exibidos abaixo são simulados para demonstração comercial.
                </div>
              </div>
            </div>
          </section>

          {/* REFERÊNCIA */}
          <section id="sobre" className="py-12 bg-white border-b border-[#E5DFD7]">
            <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-5">
                <span className="text-xs font-bold tracking-[0.14em] text-[#C87D55]">
                  REFERÊNCIA EM ODONTOLOGIA
                </span>
                <h2 className="font-serif text-3xl font-semibold mt-1">
                  Atendimento sem pressa, com diagnóstico claro e equipe dedicada.
                </h2>
              </div>
              <div className="md:col-span-7 space-y-5">
                <p className="text-[#52606D]">
                  Na <strong className="text-[#14212B]">{clinic.name}</strong>, cada paciente passa
                  por avaliação detalhada antes de qualquer procedimento, com explicação visual e
                  orçamento transparente.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl p-4">
                    <strong className="block text-sm text-[#0F4C5C] mb-1">
                      Especialistas Dedicados
                    </strong>
                    <span className="text-xs text-[#52606D]">
                      Profissionais organizados por área de atuação.
                    </span>
                  </div>
                  <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl p-4">
                    <strong className="block text-sm text-[#0F4C5C] mb-1">
                      Conteúdo Educativo
                    </strong>
                    <span className="text-xs text-[#52606D]">
                      Explicações claras sobre indicações e cuidados.
                    </span>
                  </div>
                  <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl p-4">
                    <strong className="block text-sm text-[#0F4C5C] mb-1">
                      Transparência Total
                    </strong>
                    <span className="text-xs text-[#52606D]">
                      Planejamento claro antes de iniciar o tratamento.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TRATAMENTOS */}
          <section id="tratamentos" className="py-14">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
                <div>
                  <span className="text-xs font-bold tracking-[0.14em] text-[#C87D55]">
                    ESPECIALIDADES
                  </span>
                  <h2 className="font-serif text-3xl font-semibold mt-1">
                    Tratamentos da {clinic.name}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
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
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                        treatmentCat === cat
                          ? "text-white border-transparent"
                          : "bg-white text-[#52606D] border-[#CFC6BA]"
                      }`}
                      style={
                        treatmentCat === cat
                          ? { backgroundColor: clinic.branding.primaryColor }
                          : undefined
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {filteredTreatments.map((t) => {
                  const isSelected = selectedTreatment?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTreatmentId(t.id)}
                      className={`bg-white rounded-2xl p-5 border-2 cursor-pointer transition ${
                        isSelected ? "bg-[#0F4C5C]/5" : "border-[#E5DFD7]"
                      }`}
                      style={
                        isSelected
                          ? { borderColor: clinic.branding.primaryColor }
                          : undefined
                      }
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#C87D55]">
                        {t.categoryLabel}
                      </span>
                      <h3 className="font-serif text-lg font-semibold mt-1 mb-1.5">
                        {t.displayName}
                      </h3>
                      <p className="text-sm text-[#52606D] mb-3">{t.overview}</p>
                      <div className="bg-[#FAF8F5] border-l-4 border-[#C87D55] rounded-r-lg p-3 text-xs mb-4">
                        <strong className="block text-[#C87D55] uppercase text-[11px] mb-0.5">
                          Diferencial na {clinic.name}
                        </strong>
                        {t.clinicDifferential}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#E5DFD7] text-sm">
                        <strong style={{ color: clinic.branding.primaryColor }}>
                          {formatBRL(t.demoPriceBrl)} (Demo)
                        </strong>
                        <span className="text-xs text-[#52606D]">
                          ~{t.estimatedDurationMinutes} min ·{" "}
                          {isSelected ? "Selecionado ✓" : "Selecionar"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* AGENDAMENTO */}
          <section id="agendar" className="py-14 bg-[#F3EFE9] border-y border-[#E5DFD7]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="mb-7">
                <span className="text-xs font-bold tracking-[0.14em] text-[#C87D55]">
                  SOLICITAÇÃO DE CONSULTA
                </span>
                <h2 className="font-serif text-3xl font-semibold mt-1">
                  Solicite seu Horário
                </h2>
              </div>

              <div className="grid lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <div className="bg-white border border-[#E5DFD7] rounded-2xl p-5">
                    <h3 className="font-serif text-lg font-semibold mb-3">
                      1. Escolha o Especialista
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {initialStaff.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedDentistId(s.id)}
                          className={`text-left p-3.5 rounded-xl border-2 cursor-pointer ${
                            selectedDentistId === s.id
                              ? "bg-[#0F4C5C]/5"
                              : "border-[#E5DFD7] bg-white"
                          }`}
                          style={
                            selectedDentistId === s.id
                              ? { borderColor: clinic.branding.primaryColor }
                              : undefined
                          }
                        >
                          <strong className="block text-sm">{s.displayName}</strong>
                          <span className="text-xs text-[#52606D]">{s.specialty}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedDentistId("any")}
                        className={`text-left p-3.5 rounded-xl border-2 cursor-pointer ${
                          selectedDentistId === "any"
                            ? "bg-[#0F4C5C]/5"
                            : "border-[#E5DFD7] bg-white"
                        }`}
                        style={
                          selectedDentistId === "any"
                            ? { borderColor: clinic.branding.primaryColor }
                            : undefined
                        }
                      >
                        <strong className="block text-sm">Primeiro horário livre</strong>
                        <span className="text-xs text-[#52606D]">
                          Qualquer dentista disponível
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E5DFD7] rounded-2xl p-5">
                    <h3 className="font-serif text-lg font-semibold mb-3">
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
                          className={`p-2 rounded-lg border text-center cursor-pointer ${
                            selectedDay.iso === d.iso
                              ? "text-white border-transparent"
                              : "bg-white border-[#E5DFD7]"
                          }`}
                          style={
                            selectedDay.iso === d.iso
                              ? { backgroundColor: clinic.branding.primaryColor }
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
                            className={`py-2 rounded-lg border text-sm font-semibold ${
                              isBusy
                                ? "bg-[#F3EFE9] text-slate-400 line-through cursor-not-allowed border-[#E5DFD7]"
                                : isPicked
                                  ? "text-white border-transparent cursor-pointer"
                                  : "bg-white border-[#E5DFD7] cursor-pointer"
                            }`}
                            style={
                              isPicked && !isBusy
                                ? { backgroundColor: clinic.branding.primaryColor }
                                : undefined
                            }
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <aside className="lg:col-span-5 lg:sticky lg:top-24 bg-white border border-[#E5DFD7] rounded-2xl p-6 shadow-sm">
                  <h3 className="font-serif text-xl font-semibold mb-4">
                    Resumo da Solicitação
                  </h3>

                  <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl p-4 space-y-2 text-sm mb-4">
                    <div className="flex justify-between gap-2">
                      <span className="text-[#52606D]">Tratamento</span>
                      <strong className="text-right">
                        {selectedTreatment?.displayName ?? "—"}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#52606D]">Dentista</span>
                      <strong className="text-right">
                        {selectedDentist?.displayName ?? "Primeiro horário livre"}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#52606D]">Data e Hora</span>
                      <strong className="text-right">
                        {selectedSlot
                          ? `${selectedDay.label} (${selectedDay.shortDate}) às ${selectedSlot}`
                          : "Escolha o horário"}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-2 pt-2 border-t border-[#E5DFD7]">
                      <span className="text-[#52606D]">Referência (Demo)</span>
                      <strong style={{ color: clinic.branding.primaryColor }}>
                        {selectedTreatment ? formatBRL(selectedTreatment.demoPriceBrl) : "R$ 0,00"}
                      </strong>
                    </div>
                  </div>

                  {lastRequested ? (
                    <div className="text-center space-y-3 py-2">
                      <div className="w-11 h-11 rounded-full bg-[#DCE8E2] text-[#0F4C5C] font-bold text-xl flex items-center justify-center mx-auto">
                        ✓
                      </div>
                      <h4 className="font-serif text-lg font-semibold">
                        Solicitação Registrada (Status: REQUESTED)
                      </h4>
                      <p className="text-xs text-[#52606D]">
                        Em produção, a recepção confirma este pedido antes de confirmar a reserva.
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
                        className="block w-full bg-[#0F766E] text-white font-semibold text-sm py-2.5 rounded-lg"
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
                        className="text-xs underline font-semibold cursor-pointer"
                        style={{ color: clinic.branding.primaryColor }}
                      >
                        Enviar outra solicitação
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleBookingSubmit} className="space-y-3">
                      <div>
                        <label htmlFor="p-name" className="block text-xs font-semibold mb-1">
                          Seu Nome Completo
                        </label>
                        <input
                          id="p-name"
                          type="text"
                          required
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="Ex: Ana Paula Ferreira"
                          className="w-full border border-[#CFC6BA] rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="p-phone" className="block text-xs font-semibold mb-1">
                          Seu WhatsApp
                        </label>
                        <input
                          id="p-phone"
                          type="tel"
                          required
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="w-full border border-[#CFC6BA] rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="p-notes" className="block text-xs font-semibold mb-1">
                          Observação administrativa (opcional)
                        </label>
                        <input
                          id="p-notes"
                          type="text"
                          value={patientNotes}
                          onChange={(e) => setPatientNotes(e.target.value)}
                          placeholder="Ex: Preferência de horário à tarde"
                          className="w-full border border-[#CFC6BA] rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      {formError && (
                        <p className="text-xs font-semibold text-red-700">{formError}</p>
                      )}
                      <button
                        type="submit"
                        className="w-full text-white font-semibold text-sm py-3 rounded-lg cursor-pointer"
                        style={{ backgroundColor: clinic.branding.primaryColor }}
                      >
                        Solicitar Horário
                      </button>
                    </form>
                  )}
                </aside>
              </div>
            </div>
          </section>

          {/* CORPO CLÍNICO */}
          <section id="equipe" className="py-14">
            <div className="max-w-6xl mx-auto px-4">
              <span className="text-xs font-bold tracking-[0.14em] text-[#C87D55]">
                CORPO CLÍNICO (EXEMPLO DEMO)
              </span>
              <h2 className="font-serif text-3xl font-semibold mt-1 mb-6">
                Quem Cuida do Seu Sorriso
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {initialStaff.map((s) => (
                  <article
                    key={s.id}
                    className="bg-white border border-[#E5DFD7] rounded-2xl p-5"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#F3EFE9] text-[#0F4C5C] font-serif font-bold flex items-center justify-center mb-3">
                      {getInitials(s.displayName.replace(/^(Dr\.|Dra\.)\s+/i, ""))}
                    </div>
                    <h3 className="font-serif text-lg font-semibold">{s.displayName}</h3>
                    <span className="block text-xs font-semibold text-[#C87D55] mb-2">
                      {s.specialty} · {s.croRegistration}
                    </span>
                    <p className="text-sm text-[#52606D]">{s.bio}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="duvidas" className="py-14 bg-white border-t border-[#E5DFD7]">
            <div className="max-w-3xl mx-auto px-4">
              <span className="text-xs font-bold tracking-[0.14em] text-[#C87D55]">
                PERGUNTAS FREQUENTES
              </span>
              <h2 className="font-serif text-3xl font-semibold mt-1 mb-6">
                Tire Suas Dúvidas
              </h2>
              <div className="space-y-3">
                {initialFaqs.map((faq, index) => (
                  <details
                    key={faq.id}
                    open={index === 0}
                    className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl p-4"
                  >
                    <summary className="font-semibold text-sm cursor-pointer">
                      {faq.question}
                    </summary>
                    <p className="text-sm text-[#52606D] mt-2">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </main>
      ) : (
        /* PAINEL DA SUA CLÍNICA */
        <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
          <div>
            <span className="text-xs font-bold tracking-[0.14em] text-[#C87D55]">
              GESTÃO DA RECEPÇÃO (DEMO)
            </span>
            <h2 className="font-serif text-3xl font-semibold mt-1">
              Painel da Sua Clínica — {clinic.name}
            </h2>
            <p className="text-sm text-[#52606D]">
              Gerencie solicitações de agendamento e acompanhe o faturamento previsto.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E5DFD7] rounded-xl p-4">
              <span className="block text-xs text-[#52606D]">Solicitações Ativas</span>
              <strong className="font-serif text-2xl">{activeAppointments.length}</strong>
            </div>
            <div className="bg-white border border-[#E5DFD7] rounded-xl p-4">
              <span className="block text-xs text-[#52606D]">Confirmadas</span>
              <strong className="font-serif text-2xl">{confirmedCount}</strong>
            </div>
            <div className="bg-white border border-[#E5DFD7] rounded-xl p-4">
              <span className="block text-xs text-[#52606D]">Aguardando Recepção</span>
              <strong className="font-serif text-2xl">{requestedCount}</strong>
            </div>
            <div className="bg-[#14212B] text-white rounded-xl p-4">
              <span className="block text-xs text-slate-300">Receita Prevista (Demo)</span>
              <strong className="font-serif text-2xl">{formatBRL(expectedRevenue)}</strong>
            </div>
          </div>

          <div className="bg-white border border-[#E5DFD7] rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-serif text-xl font-semibold">Seus Clientes Agendados</h3>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["all", "Todos"],
                    ["CONFIRMED", "Confirmadas"],
                    ["REQUESTED", "Solicitadas"],
                    ["CANCELLED", "Canceladas"]
                  ] as const
                ).map(([st, label]) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      statusFilter === st
                        ? "bg-[#14212B] text-white border-[#14212B]"
                        : "bg-[#FAF8F5] text-[#52606D] border-[#E5DFD7]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredAdminList.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 border border-[#E5DFD7] rounded-xl"
                >
                  <div>
                    <strong className="block text-sm">
                      {apt.patientName} · {apt.treatmentName} ({formatBRL(apt.demoPriceBrl)})
                    </strong>
                    <span className="text-xs text-[#52606D]">
                      {apt.dateLabel} às {apt.slotTime} · {apt.professionalName} ·{" "}
                      {apt.patientPhone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#F3EFE9]">
                      {statusBadgeLabel(apt.status)}
                    </span>
                    {apt.status !== "CONFIRMED" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(apt.id, "CONFIRMED")}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#CFC6BA] cursor-pointer"
                      >
                        Confirmar
                      </button>
                    )}
                    {apt.status !== "CANCELLED" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(apt.id, "CANCELLED")}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#CFC6BA] cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
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
          className="fixed inset-0 z-50 flex justify-end"
          aria-label="Personalize sua clínica"
        >
          <div
            className="absolute inset-0 bg-[#14212B]/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white h-full overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold">Personalize sua Clínica</h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full border border-[#E5DFD7] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Nome da Sua Odontologia
              </label>
              <input
                type="text"
                value={clinic.name}
                onChange={(e) =>
                  setClinic((prev) => ({ ...prev, name: e.target.value || initialClinic.name }))
                }
                className="w-full border border-[#CFC6BA] rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Endereço</label>
              <input
                type="text"
                value={clinic.address}
                onChange={(e) => setClinic((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full border border-[#CFC6BA] rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Cor Principal da Clínica
              </label>
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
                {["#0F4C5C", "#1E3A5F", "#8C4A32", "#1B4332"].map((c) => (
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

            <hr className="border-[#E5DFD7]" />

            <div className="space-y-2">
              <label className="block text-xs font-semibold">Adicione seu Procedimento</label>
              <input
                type="text"
                value={newProcName}
                onChange={(e) => setNewProcName(e.target.value)}
                placeholder="Nome do procedimento"
                className="w-full border border-[#CFC6BA] rounded-lg px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={newProcPrice}
                  onChange={(e) => setNewProcPrice(e.target.value)}
                  placeholder="Valor (R$)"
                  className="border border-[#CFC6BA] rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={newProcDur}
                  onChange={(e) => setNewProcDur(e.target.value)}
                  placeholder="Minutos"
                  className="border border-[#CFC6BA] rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAddProcedure}
                className="w-full text-white font-semibold text-sm py-2.5 rounded-lg cursor-pointer"
                style={{ backgroundColor: clinic.branding.primaryColor }}
              >
                Adicionar à Lista
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* RODAPÉ */}
      <footer className="bg-[#14212B] text-slate-300 py-6 text-xs">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <span>
            <strong className="text-white">{clinic.name}</strong> · {clinic.address}
          </span>
          <span>
            Desenvolvido por <strong className="text-white">Joel Oliveira.</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
