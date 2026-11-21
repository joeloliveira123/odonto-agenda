"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  AppointmentRequest,
  AppointmentStatus,
  AuditEvent,
  Clinic,
  FAQ,
  Treatment,
  UserRole
} from "@/types/domain";

interface AdminDashboardClientProps {
  initialClinic: Clinic;
  initialTreatments: Treatment[];
  initialFaqs: FAQ[];
  initialAppointments: AppointmentRequest[];
  initialAuditEvents: AuditEvent[];
}

export function AdminDashboardClient({
  initialClinic,
  initialTreatments,
  initialFaqs,
  initialAppointments,
  initialAuditEvents
}: AdminDashboardClientProps) {
  const [role, setRole] = useState<UserRole>("clinic_admin");
  const [clinic, setClinic] = useState<Clinic>(initialClinic);
  const [treatments, setTreatments] = useState<Treatment[]>(initialTreatments);
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>(initialAppointments);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(initialAuditEvents);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleStatusChange(id: string, nextStatus: AppointmentStatus) {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: clinic.tenantId, role, nextStatus })
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback(data.error ?? "Erro ao atualizar status.");
      return;
    }
    setAppointments((prev) => prev.map((a) => (a.id === id ? data.appointment : a)));
    setFeedback(`Status atualizado para ${nextStatus}.`);
  }

  async function handleToggleTreatment(treatmentId: string) {
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: clinic.tenantId,
        role,
        action: "toggle_treatment",
        treatmentId
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback(data.error ?? "Sem permissão.");
      return;
    }
    setTreatments((prev) => prev.map((t) => (t.id === treatmentId ? data.treatment : t)));
    await refreshAudit();
  }

  async function handleToggleFaq(faqId: string) {
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: clinic.tenantId,
        role,
        action: "toggle_faq",
        faqId
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback(data.error ?? "Sem permissão.");
      return;
    }
    setFaqs((prev) => prev.map((f) => (f.id === faqId ? data.faq : f)));
    await refreshAudit();
  }

  async function handleClinicSave(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: clinic.tenantId,
        role,
        action: "update_clinic",
        patch: {
          name: clinic.name,
          subtitle: clinic.subtitle,
          address: clinic.address
        }
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback(data.error ?? "Sem permissão para editar clínica.");
      return;
    }
    setClinic(data.clinic);
    setFeedback("Dados da clínica atualizados no servidor.");
    await refreshAudit();
  }

  async function refreshAudit() {
    const res = await fetch(`/api/admin/audit?tenantId=${clinic.tenantId}`, {
      headers: { "x-demo-role": role }
    });
    if (res.ok) {
      const data = await res.json();
      setAuditEvents(data.events ?? []);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#14212B]">
      <header className="bg-[#14212B] text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[#C87D55] font-bold">
              PORTAL ADMINISTRATIVO · FASE 4 (MODO DEMO)
            </span>
            <h1 className="font-serif text-xl font-semibold">
              Painel da Sua Clínica — {clinic.name}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-slate-300 flex items-center gap-2">
              Simular Perfil:
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="clinic_admin" className="text-black">Admin da Clínica</option>
                <option value="dentist" className="text-black">Dentista</option>
                <option value="receptionist" className="text-black">Recepcionista</option>
                <option value="visitor" className="text-black">Visitante (Bloqueado)</option>
              </select>
            </label>
            <Link
              href="/"
              className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20"
            >
              Ver Site Público →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {feedback && (
          <div className="bg-[#DCE8E2] border border-[#0F4C5C]/20 rounded-xl px-4 py-2.5 text-xs font-semibold text-[#0F4C5C]">
            {feedback}
          </div>
        )}

        {/* INBOX DE AGENDAMENTOS */}
        <section className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-4">
          <h2 className="font-serif text-xl font-semibold">Caixa de Solicitações</h2>
          <div className="space-y-2.5">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 border border-[#E5DFD7] rounded-xl"
              >
                <div>
                  <strong className="block text-sm">
                    {apt.patientName} · {apt.treatmentName}
                  </strong>
                  <span className="text-xs text-[#52606D]">
                    {apt.dateLabel} às {apt.slotTime} · {apt.professionalName} · Status:{" "}
                    <strong>{apt.status}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {apt.status === "REQUESTED" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(apt.id, "CONFIRMED")}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0F4C5C] text-white cursor-pointer"
                    >
                      Confirmar
                    </button>
                  )}
                  {apt.status === "CONFIRMED" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(apt.id, "COMPLETED")}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0F766E] text-white cursor-pointer"
                    >
                      Concluir
                    </button>
                  )}
                  {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(apt.id, "CANCELLED")}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#CFC6BA] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CONFIGURAÇÃO DA CLÍNICA & CONTEÚDO */}
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-4">
            <h2 className="font-serif text-xl font-semibold">Dados Públicos da Clínica</h2>
            <form onSubmit={handleClinicSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nome da Clínica</label>
                <input
                  type="text"
                  value={clinic.name}
                  onChange={(e) => setClinic((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-[#CFC6BA] rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={clinic.subtitle}
                  onChange={(e) => setClinic((prev) => ({ ...prev, subtitle: e.target.value }))}
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
              <button
                type="submit"
                className="bg-[#14212B] text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
              >
                Salvar Dados (Requer Admin)
              </button>
            </form>
          </section>

          <section className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-4">
            <h2 className="font-serif text-xl font-semibold">Catálogo de Tratamentos &amp; FAQs</h2>
            <div className="space-y-2">
              {treatments.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 text-xs p-2.5 border border-[#E5DFD7] rounded-lg"
                >
                  <span>{t.displayName}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleTreatment(t.id)}
                    className="px-2.5 py-1 rounded bg-[#F3EFE9] font-semibold cursor-pointer"
                  >
                    {t.active ? "Ativo" : "Oculto"}
                  </button>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-[#E5DFD7] space-y-2">
              {faqs.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-2 text-xs p-2.5 border border-[#E5DFD7] rounded-lg"
                >
                  <span className="truncate">{f.question}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleFaq(f.id)}
                    className="px-2.5 py-1 rounded bg-[#DCE8E2] text-[#0F4C5C] font-semibold cursor-pointer shrink-0"
                  >
                    {f.publicationStatus}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* AUDIT TRAIL */}
        <section className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-3">
          <h2 className="font-serif text-xl font-semibold">Registro de Auditoria (Audit Trail)</h2>
          {auditEvents.length === 0 ? (
            <p className="text-xs text-[#52606D]">
              Nenhuma ação privilegiada registrada nesta sessão ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {auditEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="text-xs flex flex-wrap justify-between gap-2 p-2.5 bg-[#FAF8F5] border border-[#E5DFD7] rounded-lg"
                >
                  <span>
                    <strong>{ev.action}</strong> · {ev.resourceType} ({ev.resourceId})
                  </span>
                  <span className="text-[#52606D]">
                    {ev.actorId} · {ev.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
