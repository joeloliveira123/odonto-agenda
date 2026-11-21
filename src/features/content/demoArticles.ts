import { DEMO_TENANT_ID } from "@/features/clinics/demoSeed";
import type { TreatmentArticle } from "@/types/domain";

export const DEFAULT_DEMO_ARTICLES: TreatmentArticle[] = [
  {
    id: "art-1",
    tenantId: DEMO_TENANT_ID,
    treatmentId: "tr-1",
    summary:
      "A avaliação odontológica periódica combinada à profilaxia (limpeza profissional) remove biofilme e cálculo dentário (tártaro) que a escovação diária não alcança.",
    generalIndications:
      "Indicada de forma preventiva para adultos e jovens em acompanhamento semestral ou conforme orientação do cirurgião-dentista.",
    procedureOverview:
      "1) Exame clínico e visualização dos dentes e gengivas; 2) Remoção de cálculo com ultrassom e curetas; 3) Polimento coronário e orientação de higiene personalizada. A duração média varia de 35 a 50 minutos conforme o acúmulo de tártaro.",
    preparation:
      "Não há preparo complexo. Recomenda-se higienizar os dentes normalmente antes da consulta e informar uso de medicamentos.",
    aftercare:
      "Manter escovação suave, uso de fio dental diário e evitar alimentos muito pigmentados nas primeiras horas caso seja aplicado flúor.",
    risksAndLimitations:
      "Pode ocorrer sensibilidade temporária ao frio ou leve sangramento gengival em áreas previamente inflamadas. A limpeza não substitui tratamentos periodontais profundos quando indicados.",
    reviewerStaffId: "staff-1",
    reviewedAt: "2026-11-15",
    publicationStatus: "published",
    updatedAt: "2026-11-15"
  },
  {
    id: "art-2",
    tenantId: DEMO_TENANT_ID,
    treatmentId: "tr-2",
    summary:
      "O clareamento dental assistido utiliza agentes clareadores em concentração controlada após avaliação clínica prévia para verificar ausência de cáries ou infiltrações.",
    generalIndications:
      "Pessoas com dentes naturais hígidos que desejam atenuar escurecimento extrínseco ou fisiológico, após exame clínico favorável.",
    procedureOverview:
      "1) Avaliação de cor inicial e proteção dos tecidos gengivais; 2) Aplicação do gel clareador sob supervisão; 3) Aplicação de agente dessensibilizante. A resposta de tonalidade e o número de sessões variam de pessoa para pessoa.",
    preparation:
      "É necessária avaliação prévia e, frequentemente, profilaxia antes do início para remover placa e manchas superficiais.",
    aftercare:
      "Seguir orientações do dentista sobre alimentos ácidos ou pigmentados e utilizar creme dental dessensibilizante se recomendado.",
    risksAndLimitations:
      "Sensibilidade dental transitória pode ocorrer. Restaurações antigas, coroas e próteses não clareiam com o gel e podem exigir troca posterior caso haja diferença de cor.",
    reviewerStaffId: "staff-1",
    reviewedAt: "2026-11-15",
    publicationStatus: "published",
    updatedAt: "2026-11-15"
  },
  {
    id: "art-3",
    tenantId: DEMO_TENANT_ID,
    treatmentId: "tr-3",
    summary:
      "A ortodontia corrige desalinhamentos dentários e alterações de mordida por meio de aparelhos fixos ou alinhadores transparentes planejados digitalmente.",
    generalIndications:
      "Apinhamento, espaçamentos, sobremordida, mordida cruzada ou preparo ortodôntico pré-reabilitador, sempre mediante documentação ortodôntica.",
    procedureOverview:
      "1) Consulta inicial e escaneamento intraoral ou documentação radiográfica; 2) Planejamento das movimentações; 3) Instalação e manutenções periódicas. O tempo total varia conforme a complexidade do caso.",
    preparation:
      "Saúde gengival e ausência de lesões cariosas ativas devem ser estabelecidas antes da movimentação ortodôntica.",
    aftercare:
      "Higiene rigorosa após as refeições, comparecimento às consultas de acompanhamento e uso correto de contenções após a finalização.",
    risksAndLimitations:
      "Desconforto leve nos primeiros dias após ajustes ou trocas de alinhadores é comum. A colaboração do paciente é determinante para o prazo previsto.",
    reviewerStaffId: "staff-1",
    reviewedAt: "2026-11-15",
    publicationStatus: "published",
    updatedAt: "2026-11-15"
  },
  {
    id: "art-4",
    tenantId: DEMO_TENANT_ID,
    treatmentId: "tr-4",
    summary:
      "Lâminas ultrafinas em cerâmica ou resina composta planejadas para harmonizar forma, proporção e cor dentária após estudo estético e funcional.",
    generalIndications:
      "Dentes com alterações de forma, pequenas fraturas, diastemas ou manchas que não respondem ao clareamento, após avaliação oclusal.",
    procedureOverview:
      "1) Avaliação clínica, fotografias e planejamento digital; 2) Prova de ensaio estético (mock-up); 3) Preparo conservador quando necessário e cimentação/confecção.",
    preparation:
      "Avaliação de hábitos como bruxismo e saúde periodontal prévia são indispensáveis.",
    aftercare:
      "Evitar morder objetos duros, manter consultas semestrais de polimento e usar placa miorrelaxante caso haja indicação clínica.",
    risksAndLimitations:
      "Nem todos os casos têm indicação de desgaste zero; fraturas ou descolamentos podem ocorrer sob sobrecarga mastigatória.",
    reviewerStaffId: "staff-2",
    reviewedAt: "2026-11-15",
    publicationStatus: "published",
    updatedAt: "2026-11-15"
  },
  {
    id: "art-5",
    tenantId: DEMO_TENANT_ID,
    treatmentId: "tr-5",
    summary:
      "Os implantes dentários funcionam como raízes artificiais em titânio ou zircônia para suportar coroas unitárias ou próteses fixas após planejamento tomográfico.",
    generalIndications:
      "Reposição de um ou mais dentes ausentes em pacientes com condição sistêmica e volume ósseo compatíveis.",
    procedureOverview:
      "1) Avaliação clínica e solicitação de tomografia 3D; 2) Planejamento cirúrgico e protético; 3) Instalação do implante e período de osseointegração antes da prótese definitiva.",
    preparation:
      "Exames de imagem e revisão do histórico médico geral são obrigatórios antes da definição do plano.",
    aftercare:
      "Seguir rigorosamente a prescrição profissional, repouso relativo inicial, higiene cuidadosa e retornos de controle.",
    risksAndLimitations:
      "Os prazos de cicatrização variam conforme qualidade óssea e saúde sistêmica (como tabagismo ou diabetes não controlado). Necessidade de enxerto ósseo é avaliada caso a caso.",
    reviewerStaffId: "staff-2",
    reviewedAt: "2026-11-15",
    publicationStatus: "published",
    updatedAt: "2026-11-15"
  },
  {
    id: "art-6",
    tenantId: DEMO_TENANT_ID,
    treatmentId: "tr-6",
    summary:
      "A avaliação de urgência prioriza o acolhimento presencial para diagnosticar a causa de dor aguda, fratura dentária, edema ou restauração deslocada.",
    generalIndications:
      "Dor persistente, sensibilidade intensa, trauma dental, inchaço gengival ou perda de prótese/restauração provisória.",
    procedureOverview:
      "1) Triagem presencial e exame clínico/radiográfico direcionado; 2) Conduta inicial para controle do quadro agudo; 3) Orientação sobre o tratamento definitivo necessário.",
    preparation:
      "Informar ao profissional alergias, medicações já tomadas e início dos sintomas. Este site não realiza triagem clínica nem prescreve medicamentos.",
    aftercare:
      "Seguir as orientações específicas entregues pelo dentista após o atendimento e retornar para conclusão do tratamento se indicado.",
    risksAndLimitations:
      "Em quadros com febre alta, dificuldade para engolir ou edema facial progressivo, procure atendimento médico/hospitalar de emergência imediatamente.",
    reviewerStaffId: "staff-3",
    reviewedAt: "2026-11-15",
    publicationStatus: "published",
    updatedAt: "2026-11-15"
  }
];
