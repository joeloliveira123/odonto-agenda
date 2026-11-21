import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DEFAULT_DEMO_CLINIC,
  DEFAULT_DEMO_FAQS,
  DEFAULT_DEMO_STAFF,
  DEFAULT_DEMO_TREATMENTS
} from "@/features/clinics/demoSeed";
import { DEFAULT_DEMO_ARTICLES } from "@/features/content/demoArticles";
import { getPublishedTreatmentDetail } from "@/lib/content/publication";

export function generateStaticParams() {
  return DEFAULT_DEMO_TREATMENTS.map((t) => ({ slug: t.slug }));
}

export default async function TreatmentDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = getPublishedTreatmentDetail(
    slug,
    DEFAULT_DEMO_TREATMENTS,
    DEFAULT_DEMO_ARTICLES,
    DEFAULT_DEMO_STAFF,
    DEFAULT_DEMO_FAQS
  );

  if (!detail) {
    notFound();
  }

  const { treatment, article, reviewer, relatedFaqs } = detail;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#14212B]">
      <header className="bg-white border-b border-[#E5DFD7]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold text-[#0F4C5C] hover:underline"
          >
            ← Voltar para {DEFAULT_DEMO_CLINIC.name}
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#DCE8E2] text-[#0F4C5C] font-semibold">
            Conteúdo Educativo (Demo)
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C87D55]">
            {treatment.categoryLabel}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">
            {treatment.displayName}
          </h1>
          <p className="text-[#52606D] text-base sm:text-lg">{treatment.overview}</p>
          <div className="flex flex-wrap gap-3 text-xs text-[#52606D] pt-2">
            <span>Duração média estimada: ~{treatment.estimatedDurationMinutes} min</span>
            {reviewer && article?.reviewedAt && (
              <span>
                · Revisão técnica ilustrativa: <strong>{reviewer.displayName}</strong> em{" "}
                {article.reviewedAt}
              </span>
            )}
          </div>
        </div>

        {article ? (
          <div className="grid gap-4">
            <section className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-2">
              <h2 className="font-serif text-xl font-semibold">O que é e indicações gerais</h2>
              <p className="text-sm text-[#52606D]">{article.summary}</p>
              <p className="text-sm text-[#52606D]">{article.generalIndications}</p>
            </section>

            <section className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-2">
              <h2 className="font-serif text-xl font-semibold">Etapas comuns do atendimento</h2>
              <p className="text-sm text-[#52606D]">{article.procedureOverview}</p>
            </section>

            <div className="grid sm:grid-cols-2 gap-4">
              <section className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-2">
                <h2 className="font-serif text-lg font-semibold">Preparo prévio</h2>
                <p className="text-sm text-[#52606D]">{article.preparation}</p>
              </section>
              <section className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-2">
                <h2 className="font-serif text-lg font-semibold">Cuidados após a consulta</h2>
                <p className="text-sm text-[#52606D]">{article.aftercare}</p>
              </section>
            </div>

            <section className="bg-[#F3EFE9] border border-[#E5DFD7] rounded-2xl p-6 space-y-2">
              <h2 className="font-serif text-lg font-semibold">
                Riscos, limitações e necessidade de avaliação
              </h2>
              <p className="text-sm text-[#14212B]">{article.risksAndLimitations}</p>
              <p className="text-xs text-[#52606D] pt-1">
                Este material tem caráter estritamente informativo e não substitui uma avaliação
                odontológica presencial.
              </p>
            </section>
          </div>
        ) : (
          <div className="bg-white border border-[#E5DFD7] rounded-2xl p-6 text-sm text-[#52606D]">
            Guia educativo em revisão técnica.
          </div>
        )}

        {relatedFaqs.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold">Dúvidas relacionadas</h2>
            {relatedFaqs.map((faq) => (
              <details
                key={faq.id}
                className="bg-white border border-[#E5DFD7] rounded-xl p-4"
              >
                <summary className="font-semibold text-sm cursor-pointer">
                  {faq.question}
                </summary>
                <p className="text-sm text-[#52606D] mt-2">{faq.answer}</p>
              </details>
            ))}
          </section>
        )}

        <div className="bg-[#14212B] text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-semibold">
              Quer avaliar a indicação para o seu caso?
            </h2>
            <p className="text-sm text-slate-300">
              Volte à página inicial para solicitar um horário de avaliação presencial.
            </p>
          </div>
          <Link
            href="/#agendar"
            className="bg-[#0F4C5C] hover:brightness-110 text-white text-sm font-semibold px-5 py-3 rounded-lg"
          >
            Solicitar Avaliação
          </Link>
        </div>
      </main>
    </div>
  );
}
