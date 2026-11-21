import Link from "next/link";
import { DEFAULT_DEMO_CLINIC } from "@/features/clinics/demoSeed";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#14212B]">
      <header className="bg-white border-b border-[#E5DFD7]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-[#0F4C5C] hover:underline">
            ← Voltar para {DEFAULT_DEMO_CLINIC.name}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#C87D55]">
          TRANSPARÊNCIA &amp; LGPD
        </span>
        <h1 className="font-serif text-3xl font-semibold">
          Aviso de Privacidade e Modo Demonstração
        </h1>

        <section className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-3 text-sm text-[#52606D]">
          <h2 className="font-serif text-lg font-semibold text-[#14212B]">
            1. Finalidade e minimização de dados
          </h2>
          <p>
            As solicitações de agendamento coletam apenas os dados mínimos de contato (nome e
            telefone/WhatsApp) necessários para que a recepção confirme disponibilidade de horário.
            Não armazenamos prontuário eletrônico ou histórico médico nesta plataforma.
          </p>
        </section>

        <section className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-3 text-sm text-[#52606D]">
          <h2 className="font-serif text-lg font-semibold text-[#14212B]">
            2. Ambiente de demonstração
          </h2>
          <p>
            Enquanto o sistema estiver operando em Modo Demonstração sem banco de dados conectado,
            nenhuma informação é enviada a servidores externos e todos os dados exibidos de equipe,
            valores e endereços são ilustrativos.
          </p>
        </section>

        <section className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-3 text-sm text-[#52606D]">
          <h2 className="font-serif text-lg font-semibold text-[#14212B]">
            3. Conteúdo educativo e atendimento presencial
          </h2>
          <p>
            As informações sobre tratamentos têm caráter exclusivamente educativo e não substituem
            avaliação clínica presencial por cirurgião-dentista regularmente inscrito no CRO.
          </p>
        </section>
      </main>
    </div>
  );
}
