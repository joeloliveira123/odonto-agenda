"use client";

import { useState } from "react";
import type { AssistantReply } from "@/features/assistant/odontoAi";

interface OdontoAssistantWidgetProps {
  tenantId: string;
  clinicName: string;
}

const QUICK_QUESTIONS = [
  "Qual o horário de atendimento?",
  "Onde fica a clínica?",
  "Quais tratamentos vocês fazem?",
  "Estou com dor aguda, o que fazer?"
];

export function OdontoAssistantWidget({
  tenantId,
  clinicName
}: OdontoAssistantWidgetProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState<AssistantReply | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, question: text })
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setReply(data.reply);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <div
          className="w-80 sm:w-96 bg-white border border-[#E5DFD7] rounded-2xl shadow-xl overflow-hidden"
          role="dialog"
          aria-label="Assistente informativo da clínica"
        >
          <div className="bg-[#14212B] text-white px-4 py-3 flex items-center justify-between">
            <div>
              <strong className="block text-sm font-serif">Odonto AI · {clinicName}</strong>
              <span className="text-[11px] text-slate-300">
                Assistente informativo (não substitui consulta)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar assistente"
              className="w-7 h-7 rounded-full bg-white/10 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setQuestion(q);
                    void ask(q);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#E5DFD7] hover:border-[#0F4C5C] cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {reply && (
              <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl p-3 text-xs space-y-2">
                <p className="text-[#14212B] leading-relaxed">{reply.answer}</p>
                {reply.suggestedAction && (
                  <a
                    href={reply.suggestedAction.href}
                    className="inline-block font-semibold underline text-[#0F4C5C]"
                  >
                    {reply.suggestedAction.label} →
                  </a>
                )}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void ask(question);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pergunte sobre horários ou tratamentos..."
                className="flex-1 border border-[#CFC6BA] rounded-lg px-3 py-1.5 text-xs"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#0F4C5C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
              >
                {loading ? "..." : "Enviar"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-[#14212B] text-white text-xs font-semibold px-4 py-3 rounded-full shadow-lg border border-white/15 cursor-pointer"
        >
          Tirar Dúvida (Odonto AI)
        </button>
      )}
    </div>
  );
}
