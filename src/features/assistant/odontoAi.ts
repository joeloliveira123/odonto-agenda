import type { Clinic, FAQ, Treatment } from "@/types/domain";
import { buildSafeWhatsAppHandoffUrl } from "@/lib/tenancy/provider";

export interface AssistantReply {
  answer: string;
  mode: "rules_engine" | "safety_boundary" | "emergency_handoff";
  suggestedAction?: {
    label: string;
    href: string;
  };
}

export interface AIProvider {
  name: string;
  generateGroundedAnswer(prompt: string, context: string): Promise<string | null>;
}

const CLINICAL_RISK_PATTERNS = [
  /rem[eé]dio/i,
  /antib[ií]otico/i,
  /anti-?inflamat[oó]rio/i,
  /analg[eé]sico/i,
  /receita/i,
  /prescrev/i,
  /diagn[oó]stic/i,
  /o que eu tenho/i,
  /posso tomar/i,
  /qual dose/i
];

const EMERGENCY_PATTERNS = [
  /febre/i,
  /incha[cç]o/i,
  /dificuldade para engolir/i,
  /sangramento intenso/i,
  /urg[eê]ncia/i,
  /muita dor/i,
  /dor aguda/i
];

const INJECTION_PATTERNS = [
  /ignore (all |previous )?instructions/i,
  /system prompt/i,
  /bypass/i,
  /mostre (as )?senhas/i,
  /dados de outros pacientes/i
];

export function answerWithOdontoAi(params: {
  question: string;
  clinic: Clinic;
  treatments: Treatment[];
  faqs: FAQ[];
}): AssistantReply {
  const { question, clinic, treatments, faqs } = params;
  const q = question.trim();

  if (!q) {
    return {
      answer: "Digite sua dúvida sobre horários, endereço, tratamentos ou como solicitar uma avaliação.",
      mode: "rules_engine"
    };
  }

  // 1. Prompt injection / unauthorized data access boundary
  if (INJECTION_PATTERNS.some((rx) => rx.test(q))) {
    return {
      answer:
        "Posso responder apenas informações públicas da clínica, tratamentos publicados e orientações para solicitação de horário.",
      mode: "safety_boundary"
    };
  }

  // 2. Emergency escalation (never attempt automated clinical triage)
  if (EMERGENCY_PATTERNS.some((rx) => rx.test(q))) {
    return {
      answer:
        "Para quadros de dor aguda, trauma ou urgência, não realizamos triagem clínica automática pelo chat. Caso apresente febre, inchaço progressivo ou dificuldade para engolir, procure atendimento médico/hospitalar imediatamente. Para encaixe odontológico presencial, fale direto com a recepção.",
      mode: "emergency_handoff",
      suggestedAction: {
        label: "Falar com a Recepção no WhatsApp",
        href: buildSafeWhatsAppHandoffUrl(
          clinic.whatsappPhone,
          clinic.name,
          "atendimento prioritário",
          "horário comercial"
        )
      }
    };
  }

  // 3. Refusal of diagnosis / prescriptions
  if (CLINICAL_RISK_PATTERNS.some((rx) => rx.test(q))) {
    return {
      answer:
        "Não posso indicar medicamentos, dosagens ou realizar diagnóstico clínico pelo assistente. A conduta segura depende de avaliação presencial com um cirurgião-dentista.",
      mode: "safety_boundary",
      suggestedAction: {
        label: "Solicitar Avaliação Presencial",
        href: "/#agendar"
      }
    };
  }

  // 4. Deterministic rules engine for verified clinic facts
  if (/hor[aá]rio|funciona|abre|fecha|atendimento/i.test(q)) {
    return {
      answer: `O horário de atendimento informado para ${clinic.name} é: ${clinic.hoursLabel}.`,
      mode: "rules_engine",
      suggestedAction: { label: "Ver horários disponíveis", href: "/#agendar" }
    };
  }

  if (/endere[cç]o|onde fica|localiza[cç][aã]o|chegar/i.test(q)) {
    return {
      answer: `Endereço configurado para ${clinic.name}: ${clinic.address}.`,
      mode: "rules_engine",
      suggestedAction: { label: "Ver seção de contato", href: "/#contato" }
    };
  }

  if (/tratamento|servi[cç]o|clareamento|limpeza|implante|aparelho|lente/i.test(q)) {
    const activeList = treatments
      .filter((t) => t.active)
      .map((t) => `${t.displayName} (~${t.estimatedDurationMinutes} min)`)
      .join(", ");
    return {
      answer: `Tratamentos disponíveis na demonstração de ${clinic.name}: ${activeList}. Você pode abrir o guia educativo de cada um na seção Tratamentos.`,
      mode: "rules_engine",
      suggestedAction: { label: "Ver Tratamentos", href: "/#tratamentos" }
    };
  }

  // 5. Match against clinic-published FAQs
  const publishedFaqs = faqs.filter((f) => f.publicationStatus === "published");
  const words = q
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  const matchedFaq = publishedFaqs.find((f) =>
    words.some((w) => `${f.question} ${f.answer}`.toLowerCase().includes(w))
  );

  if (matchedFaq) {
    return {
      answer: matchedFaq.answer,
      mode: "rules_engine"
    };
  }

  // 6. Safe fallback + human handoff
  return {
    answer:
      "Posso ajudar com horários, endereço, lista de tratamentos e orientações gerais de agendamento. Para dúvidas específicas, fale diretamente com a recepção.",
    mode: "rules_engine",
    suggestedAction: {
      label: "Falar com a Recepção no WhatsApp",
      href: buildSafeWhatsAppHandoffUrl(
        clinic.whatsappPhone,
        clinic.name,
        "atendimento",
        "horário comercial"
      )
    }
  };
}
