/**
 * Seed content used by the personalized recommendations. In later phases this
 * moves into Supabase tables (trails, lessons, mentors, groups); the shapes match.
 * Mentor and group entries are fictional sample data and are labeled as such.
 */
import type { AreaId, CareerStageId, GoalId, SkillId, TherapistRecommendation } from "@/lib/domain";

export interface TrailMeta {
  id: string;
  title: string;
  summary: string;
  lessons: number;
  minutes: number;
  /** Skills this trail develops, with how strongly (0–1). */
  skills: Partial<Record<SkillId, number>>;
  areas: AreaId[];
  goals: GoalId[];
  foundation?: boolean;
}

export const TRAILS: TrailMeta[] = [
  {
    id: "market-map",
    title: "Como funciona o mercado financeiro",
    summary: "Quem faz o quê: bancos, gestoras, corretoras, reguladores e onde cada área se encaixa.",
    lessons: 4,
    minutes: 30,
    skills: { macro: 0.4 },
    areas: ["notSure"],
    goals: ["understandMarket", "changeCareer"],
    foundation: true,
  },
  {
    id: "financial-statements",
    title: "Leitura de demonstrações financeiras na prática",
    summary: "DRE, balanço e fluxo de caixa lidos como uma analista, com balanços no estilo real.",
    lessons: 4,
    minutes: 32,
    skills: { statements: 1 },
    areas: ["research", "investmentBanking", "corporateFinance", "privateEquity"],
    goals: ["getInternship", "firstJob"],
  },
  {
    id: "valuation",
    title: "Análise fundamentalista e valuation",
    summary: "Monte um DCF do zero, confira com múltiplos e defenda suas premissas.",
    lessons: 4,
    minutes: 38,
    skills: { valuation: 1, statements: 0.4 },
    areas: ["research", "investmentBanking", "privateEquity", "assetManagement"],
    goals: ["getInternship", "grow"],
  },
  {
    id: "macro",
    title: "Macroeconomia para investidoras",
    summary: "Como juros, inflação e câmbio movem os ativos, e como ler uma ata do Copom.",
    lessons: 5,
    minutes: 40,
    skills: { macro: 1 },
    areas: ["trading", "assetManagement", "wealthManagement", "research"],
    goals: ["understandMarket", "investOwn"],
  },
  {
    id: "portfolio",
    title: "Teoria de carteiras aplicada",
    summary: "Risco, retorno e diversificação com números reais: volatilidade, correlação, índice de Sharpe.",
    lessons: 5,
    minutes: 42,
    skills: { portfolio: 1 },
    areas: ["assetManagement", "wealthManagement", "trading", "riskCompliance"],
    goals: ["investOwn", "certification"],
  },
  {
    id: "excel-python",
    title: "Excel e Python para finanças",
    summary: "Modelos que não quebram: planilhas limpas e, depois, pandas para retornos e risco.",
    lessons: 6,
    minutes: 55,
    skills: { tools: 1 },
    areas: ["investmentBanking", "corporateFinance", "fintech", "riskCompliance", "trading"],
    goals: ["firstJob", "changeCareer", "grow"],
  },
  {
    id: "personal-finance",
    title: "Finanças pessoais para começar bem",
    summary: "Orçamento, reserva de emergência, dívidas e como pensar nos primeiros investimentos.",
    lessons: 4,
    minutes: 28,
    skills: { portfolio: 0.3 },
    areas: ["wealthManagement"],
    goals: ["investOwn", "understandMarket"],
    foundation: true,
  },
  {
    id: "careers",
    title: "Preparação para processos seletivos",
    summary: "Currículo, entrevistas técnicas e comportamentais, cases e networking que não parece forçado.",
    lessons: 5,
    minutes: 45,
    skills: { interviews: 1 },
    areas: ["investmentBanking", "research", "assetManagement", "privateEquity", "wealthManagement"],
    goals: ["getInternship", "firstJob", "changeCareer"],
  },
];

export interface MentorMeta {
  id: string;
  name: string;
  role: string;
  org: string;
  years: number;
  bio: string;
  areas: AreaId[];
  goals: GoalId[];
  stages: CareerStageId[];
}

export const MENTORS: MentorMeta[] = [
  {
    id: "camila-rocha",
    name: "Camila Rocha",
    role: "Gestora de portfólio, ações",
    org: "Asset management",
    years: 11,
    bio: "Começou em research cobrindo utilities. Hoje gere um fundo de ações e adora revisar pitches.",
    areas: ["assetManagement", "research"],
    goals: ["grow", "leadership", "certification"],
    stages: ["growing", "newcomer", "earlyCareer"],
  },
  {
    id: "amara-okafor",
    name: "Amara Okafor",
    role: "Vice-presidente, M&A",
    org: "Investment banking",
    years: 8,
    bio: "Formada em contabilidade, foi para o banco de investimento. Fala abertamente sobre processos seletivos, testes de modelagem e rotina.",
    areas: ["investmentBanking", "corporateFinance", "privateEquity"],
    goals: ["getInternship", "firstJob", "changeCareer"],
    stages: ["internship", "exploring", "transition"],
  },
  {
    id: "mei-tan",
    name: "Mei Lin Tan",
    role: "Head de pesquisa quantitativa",
    org: "Fintech",
    years: 9,
    bio: "Doutora em economia, saiu de um banco central para construir modelos de risco numa fintech de pagamentos.",
    areas: ["fintech", "riskCompliance", "trading"],
    goals: ["changeCareer", "grow", "balance"],
    stages: ["transition", "returning", "growing"],
  },
];

export interface GroupMeta {
  id: string;
  name: string;
  members: number;
  description: string;
  areas: AreaId[];
  goals: GoalId[];
  stages: CareerStageId[];
}

export const GROUPS: GroupMeta[] = [
  {
    id: "valuation-circle",
    name: "Grupo de estudos de valuation",
    members: 48,
    description: "DCFs e debates de múltiplos toda semana. Traga uma empresa, saia com um modelo.",
    areas: ["research", "investmentBanking", "privateEquity", "corporateFinance"],
    goals: ["getInternship", "firstJob", "grow"],
    stages: ["internship", "exploring", "earlyCareer"],
  },
  {
    id: "cfa-l1",
    name: "Preparação CFA Nível I e CPA",
    members: 132,
    description: "Plano de estudos compartilhado, questões semanais e encontros de acompanhamento.",
    areas: ["assetManagement", "wealthManagement", "research"],
    goals: ["certification", "grow"],
    stages: ["earlyCareer", "newcomer", "growing"],
  },
  {
    id: "transition-circle",
    name: "Em transição para finanças",
    members: 74,
    description: "Para quem vem de outras áreas: trocas sobre o que estudar, como contar sua história e onde aplicar.",
    areas: ["notSure", "fintech", "riskCompliance", "wealthManagement"],
    goals: ["changeCareer", "network", "understandMarket"],
    stages: ["transition", "returning", "newcomer"],
  },
];

/**
 * Fictional psychologist recommendations shown as a preview while the community
 * has fewer than three real ones. Always labeled as examples in the UI; no real
 * names, registrations or contacts.
 */
export const SAMPLE_THERAPISTS: TherapistRecommendation[] = [
  {
    id: "sample-therapist-1",
    authorId: "",
    authorName: "Juliana",
    therapistName: "Psicóloga de exemplo A",
    crp: "",
    modality: "online",
    city: "",
    price: "private",
    contact: "",
    themes: ["impostor", "passed-over", "anxiety"],
    comment: "Me ajudou a separar o que era insegurança minha do que era um problema real do ambiente, e a me preparar para a conversa sobre promoção.",
    createdAt: "2026-10-01T12:00:00.000Z",
    sample: true,
  },
  {
    id: "sample-therapist-2",
    authorId: "",
    authorName: "",
    therapistName: "Psicólogo de exemplo B",
    crp: "",
    modality: "both",
    city: "São Paulo",
    price: "social",
    contact: "",
    themes: ["burnout", "anxiety", "career-change"],
    comment: "Atende a preço social e entende bem a rotina de quem trabalha em mesa de operação.",
    createdAt: "2026-09-20T12:00:00.000Z",
    sample: true,
  },
  {
    id: "sample-therapist-3",
    authorId: "",
    authorName: "Renata",
    therapistName: "Psicóloga de exemplo C",
    crp: "",
    modality: "online",
    city: "",
    price: "insurance",
    contact: "",
    themes: ["family", "interrupted", "harassment"],
    comment: "Foi essencial no retorno da licença-maternidade e para lidar com comentários da equipe.",
    createdAt: "2026-09-05T12:00:00.000Z",
    sample: true,
  },
];
