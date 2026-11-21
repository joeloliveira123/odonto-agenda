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

  const brandColor = clinic.branding.primaryColor;

  return (
    <div
      style={{ ["--brand" as string]: brandColor }}
      className="min-h-screen bg-[#F6F9F7] text-[#112A26]"
    >
      {/* BARRA DE AUTONOMIA DO DENTISTA */}
      <div className="bg-[#0E2925] text-[#F4F8F6] py-2.5 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="quick-clinic-name"
            className="text-xs sm:text-sm text-[#D7E6E0] inline-flex items-center gap-2.5"
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
              className="bg-white/10 border border-white/20 rounded-full px-3.5 py-1.5 text-sm text-white placeholder:text-slate-300 min-w-[210px]"
            />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="bg-[#DCECE5] text-[#0E2925] hover:brightness-95 text-xs font-bold px-4 py-2 rounded-full cursor-pointer"
            >
              Personalizar Clínica
            </button>
          </div>
        </div>
      </div>

      {/* CABEÇALHO ESTILO SMILEORA / BRIGHTBITE */}
      <header className="sticky top-0 z-30 bg-[#F6F9F7]/95 backdrop-blur border-b border-[#DCE8E2]">
        <div className="max-w-6xl mx-auto px-4 min-h-[76px] flex flex-wrap items-center justify-between gap-4">
          <a href="#topo" className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M7 3C4.8 3 3 4.8 3 7.2c0 2.5 1.3 4.6 2 6.8.7 2.2 1.2 6 2.8 6 1.3 0 1.8-2.8 2.7-4.5.4-.8.9-1.2 1.5-1.2s1.1.4 1.5 1.2c.9 1.7 1.4 4.5 2.7 4.5 1.6 0 2.1-3.8 2.8-6 .7-2.2 2-4.3 2-6.8C21 4.8 19.2 3 17 3c-1.8 0-3.2 1-5 1S8.8 3 7 3Z" />
              </svg>
            </div>
            <div>
              <div className="font-serif font-bold text-xl leading-tight text-[#0E2925]">
                {clinic.name}
              </div>
              <div className="text-[11px] font-medium text-[#4A6862]">{clinic.subtitle}</div>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-1 bg-white/80 border border-[#DCE8E2] rounded-full px-2 py-1 text-xs font-semibold text-[#3C5A54]">
            <a
              href="#topo"
              className="px-3.5 py-1.5 rounded-full text-white"
              style={{ backgroundColor: brandColor }}
            >
              Início
            </a>
            <a href="#tratamentos" className="px-3.5 py-1.5 rounded-full hover:text-[#0E2925]">
              Tratamentos
            </a>
            <a href="#sobre" className="px-3.5 py-1.5 rounded-full hover:text-[#0E2925]">
              A Clínica
            </a>
            <a href="#estrutura" className="px-3.5 py-1.5 rounded-full hover:text-[#0E2925]">
              Tecnologia
            </a>
            <a href="#depoimentos" className="px-3.5 py-1.5 rounded-full hover:text-[#0E2925]">
              Pacientes
            </a>
            <a href="#duvidas" className="px-3.5 py-1.5 rounded-full hover:text-[#0E2925]">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label="Abrir menu de navegação"
              className="lg:hidden px-3 py-1.5 rounded-full border border-[#DCE8E2] bg-white text-xs font-semibold"
            >
              Menu
            </button>

            <div
              className="inline-flex bg-[#E4F0EA] p-1 rounded-full border border-[#CFE2D9]"
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "patient"}
                onClick={() => setActiveView("patient")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition ${
                  activeView === "patient"
                    ? "bg-white text-[#0E2925] shadow-sm"
                    : "text-[#3C5A54]"
                }`}
              >
                Visão do Paciente
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "clinic"}
                onClick={() => setActiveView("clinic")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                  activeView === "clinic"
                    ? "bg-white text-[#0E2925] shadow-sm"
                    : "text-[#3C5A54]"
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
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            aria-label="Menu mobile"
            className="lg:hidden border-t border-[#DCE8E2] bg-white px-4 py-3 flex flex-wrap gap-4 text-xs font-semibold text-[#3C5A54]"
          >
            <a href="#tratamentos" onClick={() => setMobileMenuOpen(false)}>
              Tratamentos
            </a>
            <a href="#sobre" onClick={() => setMobileMenuOpen(false)}>
              A Clínica
            </a>
            <a href="#estrutura" onClick={() => setMobileMenuOpen(false)}>
              Tecnologia
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
      <div className="bg-[#E3EFEA] border-b border-[#CFE2D9] py-1.5 px-4 text-center text-xs text-[#112A26]">
        {supabaseConfigured
          ? "Conectado ao ambiente Supabase configurado."
          : "Modo Demonstração ativo: personalize o nome da clínica acima e teste agendamentos localmente."}
      </div>

      {activeView === "patient" ? (
        <main id="topo">
          {/* HERO ORGÂNICO COM FOTOS GERADAS (SMILEORA + BRIGHTBITE) */}
          <section className="relative overflow-hidden pt-10 pb-20">
            <div
              className="pointer-events-none absolute -top-24 right-0 w-[520px] h-[520px] rounded-full opacity-45 blur-3xl"
              style={{ backgroundColor: "#CBE3D8" }}
              aria-hidden="true"
            />
            <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-10 items-center">
              {/* COLUNA ESQUERDA HERO */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E1EFE9] border border-[#C5DDD3] text-xs font-bold text-[#0F4C5C]">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  />
                  Odontologia Moderna &amp; Acolhedora
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-bold leading-[1.08] tracking-tight text-[#0E2925]">
                  Sorriso Saudável,{" "}
                  <span
                    className="italic font-normal block mt-1"
                    style={{ color: brandColor }}
                  >
                    Você Mais Feliz.
                  </span>
                </h1>

                <p className="text-[#45635D] text-base sm:text-lg leading-relaxed max-w-xl">
                  Cuidado odontológico de excelência com toque humano na{" "}
                  <strong className="text-[#0E2925]">{clinic.name}</strong>. Tecnologia 3D sem
                  moldagens desconfortáveis, especialistas com CRO ativo e agendamento online em
                  segundos.
                </p>

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
                    href="#estrutura"
                    className="inline-flex items-center gap-2.5 bg-white border border-[#CFE2D9] text-[#0E2925] font-bold text-sm px-5 py-3.5 rounded-full shadow-sm hover:bg-[#EDF5F1] transition"
                  >
                    <span
                      className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: brandColor }}
                    >
                      ▶
                    </span>
                    <span>Conhecer a Clínica</span>
                  </a>
                </div>

                {/* PROVA SOCIAL COM AVATARES */}
                <div className="flex items-center gap-4 pt-3">
                  <div className="flex -space-x-2.5">
                    {["MS", "RA", "JM", "CF"].map((initials, idx) => (
                      <div
                        key={initials}
                        className="w-10 h-10 rounded-full border-2 border-white text-xs font-bold flex items-center justify-center text-white shadow-sm"
                        style={{
                          backgroundColor: idx % 2 === 0 ? brandColor : "#2A6F62"
                        }}
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0E2925]">
                      +4.000 Pacientes Atendidos
                    </div>
                    <div className="text-xs text-[#4A6862]">
                      ★★★★★ 4.9 · Confiam no cuidado da {clinic.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUNA DIREITA HERO: COMPOSIÇÃO FOTOGRÁFICA + 3D TOOTH CARD */}
              <div className="lg:col-span-6 relative">
                <div className="relative mx-auto max-w-lg">
                  {/* MOLDURA ORGÂNICA PRINCIPAL COM FOTO DA PACIENTE */}
                  <div className="relative rounded-[36px] overflow-hidden border-4 border-white shadow-2xl bg-[#DCECE5] aspect-[4/3]">
                    <img
                      src="/images/hero-patient.jpg"
                      alt={`Paciente sorrindo na ${clinic.name}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E2925]/45 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 text-white">
                      <span className="text-xs font-semibold bg-black/35 backdrop-blur-md px-3 py-1 rounded-full">
                        {clinic.hoursLabel}
                      </span>
                      <span className="text-[11px] bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full">
                        Imagem Ilustrativa Demo
                      </span>
                    </div>
                  </div>

                  {/* SELO FLUTUANTE ESQUERDO (BRIGHTBITE 4,000+ SMILES) */}
                  <div className="hidden sm:flex items-center gap-3 absolute -bottom-6 -left-6 bg-white border border-[#DCE8E2] rounded-2xl p-3.5 shadow-xl">
                    <img
                      src="/images/hero-3d-tooth.jpg"
                      alt="Ícone 3D Odontologia"
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div>
                      <div className="font-serif font-bold text-lg leading-none text-[#0E2925]">
                        Scanner 3D
                      </div>
                      <div className="text-xs text-[#4A6862] mt-0.5">
                        Diagnóstico digital preciso
                      </div>
                    </div>
                  </div>

                  {/* SELO FLUTUANTE SUPERIOR DIREITO */}
                  <div className="hidden sm:flex items-center gap-2.5 absolute -top-5 -right-4 bg-white border border-[#DCE8E2] rounded-full px-4 py-2 shadow-lg">
                    <span
                      className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: brandColor }}
                    >
                      ✓
                    </span>
                    <div className="text-xs">
                      <strong className="block text-[#0E2925]">Sorriso com Confiança</strong>
                      <span className="text-[#4A6862]">Atendimento sem pressa</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* BARRA FLUTUANTE DE 4 INDICADORES (BRIGHTBITE & PURESMILE) */}
          <section className="relative z-10 -mt-10 pb-8">
            <div className="max-w-6xl mx-auto px-4">
              <div className="bg-white border border-[#DCE8E2] rounded-3xl p-6 sm:p-8 shadow-lg grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    num: "3.500+",
                    title: "Pacientes Satisfeitos",
                    desc: "Acolhimento gentil pensado para quem tem receio de dentista."
                  },
                  {
                    num: "15+ Anos",
                    title: "Experiência Clínica",
                    desc: "Especialistas com CRO ativo em cada área da odontologia."
                  },
                  {
                    num: "99%",
                    title: "Aprovação no Atendimento",
                    desc: "Pontualidade, clareza no orçamento e acompanhamento próximo."
                  },
                  {
                    num: "100% 3D",
                    title: "Planejamento Digital",
                    desc: "Escaneamento intraoral rápido sem massinhas de moldagem."
                  }
                ].map((stat) => (
                  <div
                    key={stat.title}
                    className="flex flex-col items-start sm:items-center sm:text-center p-2"
                  >
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3 text-sm font-bold"
                      style={{
                        backgroundColor: "#E3EFEA",
                        color: brandColor
                      }}
                    >
                      ★
                    </div>
                    <strong className="font-serif text-2xl sm:text-3xl font-bold text-[#0E2925]">
                      {stat.num}
                    </strong>
                    <span className="font-bold text-sm text-[#112A26] mt-1">{stat.title}</span>
                    <p className="text-xs text-[#526E68] mt-1 leading-relaxed">{stat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* NOSSOS SERVIÇOS — COMPREHENSIVE DENTAL CARE (SMILEORA CARDS) */}
          <section id="tratamentos" className="py-16">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#3C6E63]">
                  — NOSSAS ESPECIALIDADES —
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0E2925] mt-2">
                  Cuidado Odontológico Completo
                </h2>
                <p className="text-sm sm:text-base text-[#4A6862] mt-2">
                  Da prevenção à reabilitação estética do sorriso: escolha o procedimento na{" "}
                  <strong>{clinic.name}</strong> para ver detalhes ou agendar sua avaliação.
                </p>
              </div>

              {/* FILTROS E BUSCA */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
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
                      className={`px-4 py-2 rounded-full text-xs font-bold border cursor-pointer transition ${
                        treatmentCat === cat
                          ? "text-white border-transparent shadow-sm"
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

                <input
                  type="search"
                  value={treatmentSearch}
                  onChange={(e) => setTreatmentSearch(e.target.value)}
                  placeholder="Buscar tratamento..."
                  aria-label="Buscar tratamento"
                  className="bg-white border border-[#CFE2D9] rounded-full px-4 py-2 text-xs min-w-[220px]"
                />
              </div>

              {/* GRADE DE TRATAMENTOS ESTILO SMILEORA */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTreatments.map((t) => {
                  const isSelected = selectedTreatment?.id === t.id;
                  return (
                    <article
                      key={t.id}
                      onClick={() => setSelectedTreatmentId(t.id)}
                      className={`group rounded-3xl p-6 border-2 transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-white shadow-lg"
                          : "bg-[#ECF3EF]/75 hover:bg-white border-[#DCE8E2] hover:shadow-md"
                      }`}
                      style={isSelected ? { borderColor: brandColor } : undefined}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-[#DCE8E2] shadow-xs"
                            style={{ color: brandColor }}
                          >
                            <svg
                              className="w-6 h-6"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              aria-hidden="true"
                            >
                              <path d="M7 3C4.8 3 3 4.8 3 7.2c0 2.5 1.3 4.6 2 6.8.7 2.2 1.2 6 2.8 6 1.3 0 1.8-2.8 2.7-4.5.4-.8.9-1.2 1.5-1.2s1.1.4 1.5 1.2c.9 1.7 1.4 4.5 2.7 4.5 1.6 0 2.1-3.8 2.8-6 .7-2.2 2-4.3 2-6.8C21 4.8 19.2 3 17 3c-1.8 0-3.2 1-5 1S8.8 3 7 3Z" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white text-[#3C6E63] border border-[#DCE8E2]">
                            {t.categoryLabel}
                          </span>
                        </div>

                        <h3 className="font-serif text-xl font-bold text-[#0E2925] mb-2">
                          {t.displayName}
                        </h3>
                        <p className="text-sm text-[#4A6862] leading-relaxed mb-4">
                          {t.overview}
                        </p>

                        <div className="bg-[#F6F9F7] border border-[#DCE8E2] rounded-2xl p-3 text-xs text-[#112A26] mb-4">
                          <strong
                            className="block text-[11px] uppercase tracking-wider mb-0.5"
                            style={{ color: brandColor }}
                          >
                            Por que na {clinic.name}?
                          </strong>
                          {t.clinicDifferential}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#DCE8E2] flex items-center justify-between gap-2">
                        <div>
                          <strong
                            className="block text-base font-bold"
                            style={{ color: brandColor }}
                          >
                            {formatBRL(t.demoPriceBrl)}
                          </strong>
                          <div className="flex items-center gap-2 text-[11px] text-[#4A6862]">
                            <span>~{t.estimatedDurationMinutes} min</span>
                            <span>·</span>
                            <Link
                              href={`/tratamentos/${t.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold underline hover:text-[#0E2925]"
                            >
                              Guia educativo
                            </Link>
                          </div>
                        </div>

                        <a
                          href="#agendar"
                          onClick={() => setSelectedTreatmentId(t.id)}
                          aria-label={`Agendar ${t.displayName}`}
                          className="w-10 h-10 rounded-full flex items-center justify-center border border-[#CFE2D9] bg-white text-[#0E2925] font-bold group-hover:text-white transition"
                          style={
                            isSelected
                              ? { backgroundColor: brandColor, color: "#FFFFFF" }
                              : undefined
                          }
                        >
                          →
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SOBRE A CLÍNICA — YOUR TRUSTED DENTAL CLINIC (SMILEORA + BRIGHTBITE) */}
          <section id="sobre" className="py-16 bg-white border-y border-[#DCE8E2]">
            <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 relative">
                <div className="rounded-[32px] overflow-hidden border-4 border-[#EAF3EE] shadow-xl aspect-[4/3]">
                  <img
                    src="/images/about-dentist-care.jpg"
                    alt={`Atendimento humanizado na ${clinic.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-4 sm:mt-0 sm:absolute -bottom-5 left-6 bg-white border border-[#DCE8E2] rounded-2xl p-4 shadow-lg inline-flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold"
                    style={{ backgroundColor: brandColor }}
                  >
                    ✓
                  </div>
                  <div>
                    <strong className="block text-sm text-[#0E2925]">
                      Segurança &amp; Confiança
                    </strong>
                    <span className="text-xs text-[#4A6862]">
                      Protocolos rigorosos de biossegurança
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-5">
                <span className="inline-block px-3.5 py-1 rounded-full bg-[#E3EFEA] text-xs font-bold text-[#0F4C5C]">
                  Sobre a {clinic.name} •
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0E2925] leading-tight">
                  Sua Clínica Odontológica{" "}
                  <span className="italic font-normal" style={{ color: brandColor }}>
                    de Confiança
                  </span>
                </h2>
                <p className="text-[#4A6862] text-sm sm:text-base leading-relaxed">
                  Combinamos tecnologia de diagnóstico digital com um atendimento acolhedor e sem
                  pressa. Na <strong>{clinic.name}</strong>, você entende cada etapa do seu
                  tratamento na tela antes de tomar qualquer decisão.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    {
                      title: "Equipe de Especialistas",
                      desc: "Profissionais dedicados por especialidade com registro CRO ativo."
                    },
                    {
                      title: "Tecnologia Moderna 3D",
                      desc: "Câmera intraoral e planejamento digital para tratamentos previsíveis."
                    },
                    {
                      title: "Ambiente Confortável",
                      desc: "Atendimento gentil pensado para eliminar a ansiedade de ir ao dentista."
                    }
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F6F9F7] border border-[#DCE8E2]"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs"
                        style={{ backgroundColor: "#DCECE5", color: brandColor }}
                      >
                        ✓
                      </div>
                      <div>
                        <strong className="block text-sm text-[#0E2925]">{item.title}</strong>
                        <span className="text-xs text-[#4A6862]">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <a
                    href="#agendar"
                    className="inline-flex items-center gap-2 text-white font-bold text-sm px-6 py-3 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  >
                    <span>Agendar Avaliação</span>
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ESTRUTURA & TECNOLOGIA (PURESMILE STATE-OF-THE-ART) */}
          <section id="estrutura" className="py-16">
            <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-5">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#3C6E63]">
                  — ESTRUTURA &amp; TECNOLOGIA (DEMO) —
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0E2925] leading-tight">
                  Consultório Preparado para o Seu Conforto
                </h2>
                <p className="text-sm sm:text-base text-[#4A6862] leading-relaxed">
                  Nossa estrutura foi planejada para tornar cada visita tranquila, rápida e segura —
                  desde a recepção até os equipamentos digitais de última geração.
                </p>

                <ul className="space-y-2.5 text-sm text-[#112A26]">
                  {[
                    "Escaneamento intraoral 3D para planejamento preciso",
                    "Câmera digital de alta definição para diagnóstico visual na tela",
                    "Anestesia cuidadosa e protocolos para pacientes com sensibilidade",
                    "Esterilização hospitalar rastreada a cada atendimento"
                  ].map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full text-white text-[11px] flex items-center justify-center shrink-0"
                        style={{ backgroundColor: brandColor }}
                      >
                        ✓
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-6 relative">
                <div className="rounded-[32px] overflow-hidden border-4 border-white shadow-xl aspect-[16/10]">
                  <img
                    src="/images/clinic-interior.jpg"
                    alt={`Estrutura interna da ${clinic.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* AGENDAMENTO ONLINE EM TEMPO REAL */}
          <section id="agendar" className="py-16 bg-[#E9F2EE] border-y border-[#CFE2D9]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#3C6E63]">
                  — AGENDA ONLINE —
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0E2925] mt-1">
                  Solicite seu Horário na {clinic.name}
                </h2>
                <p className="text-sm text-[#4A6862] mt-1">
                  Selecione o especialista, o melhor dia e envie sua solicitação de consulta.
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
                    Resumo da Solicitação
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
                          Observação administrativa (opcional)
                        </label>
                        <input
                          id="p-notes"
                          type="text"
                          value={patientNotes}
                          onChange={(e) => setPatientNotes(e.target.value)}
                          placeholder="Ex: Preferência de horário à tarde"
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
                        Solicitar Horário →
                      </button>
                    </form>
                  )}
                </aside>
              </div>
            </div>
          </section>

          {/* CORPO CLÍNICO & DEPOIMENTOS (SMILEORA TESTIMONIALS) */}
          <section id="equipe" className="py-16">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#3C6E63]">
                  — CORPO CLÍNICO (EXEMPLO DEMO) —
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0E2925] mt-1">
                  Quem Cuida do Seu Sorriso
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {initialStaff.map((s) => (
                  <article
                    key={s.id}
                    className="bg-white border border-[#DCE8E2] rounded-3xl p-6 shadow-xs"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl font-serif font-bold flex items-center justify-center mb-4 text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      {getInitials(s.displayName.replace(/^(Dr\.|Dra\.)\s+/i, ""))}
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#0E2925]">
                      {s.displayName}
                    </h3>
                    <span className="block text-xs font-bold text-[#3C6E63] mb-2">
                      {s.specialty} · {s.croRegistration}
                    </span>
                    <p className="text-sm text-[#4A6862]">{s.bio}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* DEPOIMENTOS ESTILO SMILEORA */}
          <section id="depoimentos" className="py-14 bg-white border-t border-[#DCE8E2]">
            <div className="max-w-5xl mx-auto px-4 text-center">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#3C6E63]">
                — EXPERIÊNCIA DO PACIENTE (DEMO) —
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0E2925] mt-1 mb-8">
                O Que Nossos Pacientes Dizem
              </h2>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                {[
                  {
                    quote:
                      "Atendimento impecável! A equipe é atenciosa, explicou tudo na tela 3D e tornou minha consulta muito tranquila.",
                    author: "Mariana S. (Depoimento Ilustrativo)",
                    role: "Prevenção & Clareamento"
                  },
                  {
                    quote:
                      "Agendei pelo celular em menos de um minuto, fui atendido no horário exato e com total transparência no plano de tratamento.",
                    author: "Rafael M. (Depoimento Ilustrativo)",
                    role: "Ortodontia & Alinhadores"
                  }
                ].map((item) => (
                  <div
                    key={item.author}
                    className="bg-[#F6F9F7] border border-[#DCE8E2] rounded-3xl p-6 space-y-3"
                  >
                    <div className="text-amber-500 text-sm tracking-widest">★★★★★</div>
                    <p className="text-sm sm:text-base text-[#112A26] italic">
                      “{item.quote}”
                    </p>
                    <div>
                      <strong className="block text-sm text-[#0E2925]">{item.author}</strong>
                      <span className="text-xs text-[#4A6862]">{item.role}</span>
                    </div>
                  </div>
                ))}
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
                    className="bg-white border border-[#DCE8E2] rounded-2xl p-4"
                  >
                    <summary className="font-bold text-sm cursor-pointer text-[#0E2925]">
                      {faq.question}
                    </summary>
                    <p className="text-sm text-[#4A6862] mt-2">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* BANNER CTA INFERIOR ESTILO SMILEORA */}
          <section id="contato" className=" pb-16 pt-4">
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
                      Pronto para Conquistar Seu Melhor Sorriso?
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
                    ["CONFIRMED", "Confirmadas"],
                    ["REQUESTED", "Solicitadas"],
                    ["CANCELLED", "Canceladas"]
                  ] as const
                ).map(([st, label]) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                      statusFilter === st
                        ? "bg-[#0E2925] text-white border-[#0E2925]"
                        : "bg-[#F6F9F7] text-[#4A6862] border-[#DCE8E2]"
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
                  className="flex flex-wrap items-center justify-between gap-3 p-4 border border-[#DCE8E2] rounded-2xl"
                >
                  <div>
                    <strong className="block text-sm text-[#0E2925]">
                      {apt.patientName} · {apt.treatmentName} ({formatBRL(apt.demoPriceBrl)})
                    </strong>
                    <span className="text-xs text-[#4A6862]">
                      {apt.dateLabel} às {apt.slotTime} · {apt.professionalName} ·{" "}
                      {apt.patientPhone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E3EFEA] text-[#0E2925]">
                      {statusBadgeLabel(apt.status)}
                    </span>
                    {apt.status !== "CONFIRMED" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(apt.id, "CONFIRMED")}
                        className="text-xs font-bold px-3 py-1 rounded-full border border-[#CFE2D9] cursor-pointer"
                      >
                        Confirmar
                      </button>
                    )}
                    {apt.status !== "CANCELLED" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(apt.id, "CANCELLED")}
                        className="text-xs font-bold px-3 py-1 rounded-full border border-[#CFE2D9] cursor-pointer"
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
            className="absolute inset-0 bg-[#0E2925]/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white h-full overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold">Personalize sua Clínica</h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full border border-[#DCE8E2] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Nome da Sua Odontologia
              </label>
              <input
                type="text"
                value={clinic.name}
                onChange={(e) =>
                  setClinic((prev) => ({ ...prev, name: e.target.value || initialClinic.name }))
                }
                className="w-full border border-[#CFE2D9] rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Endereço</label>
              <input
                type="text"
                value={clinic.address}
                onChange={(e) => setClinic((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full border border-[#CFE2D9] rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
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
                {["#0F4C5C", "#13403B", "#2563EB", "#1E3A5F"].map((c) => (
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
                className="w-full border border-[#CFE2D9] rounded-xl px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={newProcPrice}
                  onChange={(e) => setNewProcPrice(e.target.value)}
                  placeholder="Valor (R$)"
                  className="border border-[#CFE2D9] rounded-xl px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={newProcDur}
                  onChange={(e) => setNewProcDur(e.target.value)}
                  placeholder="Minutos"
                  className="border border-[#CFE2D9] rounded-xl px-3 py-2 text-sm"
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
      <footer className="bg-[#0E2925] text-slate-300 py-8 text-xs border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <span>
            <strong className="text-white">{clinic.name}</strong> · {clinic.address}
          </span>
          <div className="flex items-center gap-4">
            <Link href="/privacidade" className="underline hover:text-white">
              Privacidade &amp; LGPD
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
