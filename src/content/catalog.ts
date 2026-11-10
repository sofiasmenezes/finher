/**
 * Seed content used by the personalized recommendations. In later phases this
 * moves into Supabase tables (trails, materials, mentors, groups); the shapes match.
 * Mentor and group entries are fictional sample data and are labeled as such.
 */
import type { AreaId, CareerStageId, GoalId, MaterialRecommendation, SkillId, TalentProfile, TherapistRecommendation } from "@/lib/domain";

/** Kinds of material a trail can point to. Same ids as community materials. */
export type TrailMaterialType = "book" | "video" | "course" | "author" | "article" | "podcast";

/**
 * An external material recommended by the FinHer team. FinHer has no lessons of its
 * own yet, so each trail is a curated list of books, video lessons, courses and authors.
 * Books without a link get a search link in the UI.
 */
export interface TrailMaterial {
  id: string;
  title: string;
  /** Author, teacher or organization. */
  creator: string;
  type: TrailMaterialType;
  why: string;
  url?: string;
  free?: boolean;
  /** Only when it isn't Portuguese. */
  language?: string;
}

export interface TrailMeta {
  id: string;
  title: string;
  summary: string;
  /** External materials, in the order we suggest using them. */
  materials: TrailMaterial[];
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
    materials: [
      {
        id: "b3-edu",
        title: "Hub de educação da B3",
        creator: "B3",
        type: "course",
        why: "Cursos curtos e gratuitos da própria bolsa para entender como o mercado funciona, do básico ao intermediário.",
        url: "https://edu.b3.com.br/",
        free: true,
      },
      {
        id: "portal-investidor",
        title: "Portal do Investidor",
        creator: "CVM",
        type: "article",
        why: "O site educativo do regulador: conceitos, produtos e direitos explicados sem jargão.",
        url: "https://www.gov.br/investidor/",
        free: true,
      },
      {
        id: "assaf-mercado",
        title: "Mercado financeiro",
        creator: "Alexandre Assaf Neto",
        type: "book",
        why: "Um panorama completo do sistema financeiro brasileiro, muito usado nas faculdades.",
      },
    ],
    skills: { macro: 0.4 },
    areas: ["notSure"],
    goals: ["understandMarket", "changeCareer"],
    foundation: true,
  },
  {
    id: "financial-statements",
    title: "Leitura de demonstrações financeiras",
    summary: "DRE, balanço e fluxo de caixa lidos como uma analista.",
    materials: [
      {
        id: "fea-contabilidade",
        title: "Contabilidade introdutória",
        creator: "Equipe de professores da FEA-USP",
        type: "book",
        why: "A base de contabilidade que toda analista usa, com exercícios.",
      },
      {
        id: "wharton-accounting",
        title: "Introduction to Financial Accounting",
        creator: "Wharton School (Coursera)",
        type: "course",
        why: "Videoaulas que mostram como ler e montar as demonstrações. Dá para assistir de graça no modo ouvinte.",
        url: "https://www.coursera.org/learn/wharton-accounting",
        language: "Inglês, com legendas",
      },
      {
        id: "assaf-balancos",
        title: "Estrutura e análise de balanços",
        creator: "Alexandre Assaf Neto",
        type: "book",
        why: "Indicadores, margens e análise de empresas brasileiras na prática.",
      },
    ],
    skills: { statements: 1 },
    areas: ["research", "investmentBanking", "corporateFinance", "privateEquity"],
    goals: ["getInternship", "firstJob"],
  },
  {
    id: "valuation",
    title: "Análise fundamentalista e valuation",
    summary: "Fluxo de caixa descontado, múltiplos e como defender suas premissas.",
    materials: [
      {
        id: "damodaran",
        title: "Aswath Damodaran",
        creator: "Professor de finanças da NYU Stern",
        type: "author",
        why: "Referência mundial em valuation. Publica aulas completas, planilhas e dados de graça no site dele.",
        url: "https://pages.stern.nyu.edu/~adamodar/",
        free: true,
        language: "Inglês",
      },
      {
        id: "damodaran-valuation",
        title: "Valuation: como avaliar empresas e escolher as melhores ações",
        creator: "Aswath Damodaran",
        type: "book",
        why: "A porta de entrada para o método do Damodaran, em linguagem acessível.",
      },
      {
        id: "mckinsey-valuation",
        title: "Valuation: Measuring and Managing the Value of Companies",
        creator: "McKinsey & Company (Tim Koller, Marc Goedhart e David Wessels)",
        type: "book",
        why: "O manual de referência dos bancos e consultorias para quem quer se aprofundar.",
        language: "Inglês",
      },
    ],
    skills: { valuation: 1, statements: 0.4 },
    areas: ["research", "investmentBanking", "privateEquity", "assetManagement"],
    goals: ["getInternship", "grow"],
  },
  {
    id: "macro",
    title: "Macroeconomia para o mercado",
    summary: "Como juros, inflação e câmbio movem os ativos, e como ler uma ata do Copom.",
    materials: [
      {
        id: "dalio-machine",
        title: "Como funciona a máquina econômica",
        creator: "Ray Dalio",
        type: "video",
        why: "Em 30 minutos de animação, crédito, dívida e ciclos econômicos ficam claros.",
        url: "https://www.youtube.com/watch?v=PHe0bXAIuk0",
        free: true,
        language: "Inglês, com legendas em português",
      },
      {
        id: "bcb-copom",
        title: "Copom: o que é e como decide os juros",
        creator: "Banco Central do Brasil",
        type: "article",
        why: "A fonte oficial sobre a Selic, com as atas e os comunicados de cada reunião.",
        url: "https://www.bcb.gov.br/controleinflacao/copom",
        free: true,
      },
      {
        id: "mankiw-macro",
        title: "Macroeconomia",
        creator: "N. Gregory Mankiw",
        type: "book",
        why: "O livro-texto clássico para firmar os conceitos.",
      },
      {
        id: "zeina-latif",
        title: "Zeina Latif",
        creator: "Economista, autora de \"Nós do Brasil\"",
        type: "author",
        why: "Uma das economistas mais ouvidas do país. Escreve sobre a economia brasileira de um jeito acessível.",
      },
    ],
    skills: { macro: 1 },
    areas: ["trading", "assetManagement", "wealthManagement", "research"],
    goals: ["understandMarket", "investOwn"],
  },
  {
    id: "portfolio",
    title: "Teoria de carteiras aplicada",
    summary: "Risco, retorno e diversificação: volatilidade, correlação e índice de Sharpe.",
    materials: [
      {
        id: "shiller-markets",
        title: "Financial Markets",
        creator: "Robert Shiller, Universidade Yale (Coursera)",
        type: "course",
        why: "Videoaulas de um prêmio Nobel sobre risco, mercados e instituições. Gratuito no modo ouvinte.",
        url: "https://www.coursera.org/learn/financial-markets-global",
        language: "Inglês, com legendas",
      },
      {
        id: "bkm-investimentos",
        title: "Investimentos",
        creator: "Zvi Bodie, Alex Kane e Alan J. Marcus",
        type: "book",
        why: "O livro-texto de referência em teoria de carteiras, usado no CFA e no mestrado.",
      },
      {
        id: "malkiel-passeio",
        title: "Um passeio aleatório por Wall Street",
        creator: "Burton G. Malkiel",
        type: "book",
        why: "Diversificação e eficiência de mercado contadas de forma leve.",
      },
    ],
    skills: { portfolio: 1 },
    areas: ["assetManagement", "wealthManagement", "trading", "riskCompliance"],
    goals: ["investOwn", "certification"],
  },
  {
    id: "excel-python",
    title: "Excel e Python para finanças",
    summary: "Planilhas limpas e, depois, Python para analisar dados de mercado.",
    materials: [
      {
        id: "ev-excel",
        title: "Cursos de Excel da Escola Virtual",
        creator: "Fundação Bradesco",
        type: "course",
        why: "Cursos gratuitos, do básico ao avançado, com certificado.",
        url: "https://www.ev.org.br/",
        free: true,
      },
      {
        id: "curso-em-video-python",
        title: "Curso de Python",
        creator: "Gustavo Guanabara (Curso em Vídeo)",
        type: "video",
        why: "Videoaulas gratuitas para quem nunca programou.",
        url: "https://www.cursoemvideo.com/",
        free: true,
      },
      {
        id: "mckinney-python",
        title: "Python para análise de dados",
        creator: "Wes McKinney",
        type: "book",
        why: "Escrito pelo criador do pandas, a biblioteca mais usada para dados financeiros.",
      },
      {
        id: "hilpisch-python",
        title: "Python for Finance",
        creator: "Yves Hilpisch",
        type: "book",
        why: "Retornos, risco e simulações em Python, com exemplos de mercado.",
        language: "Inglês",
      },
    ],
    skills: { tools: 1 },
    areas: ["investmentBanking", "corporateFinance", "fintech", "riskCompliance", "trading"],
    goals: ["firstJob", "changeCareer", "grow"],
  },
  {
    id: "personal-finance",
    title: "Finanças pessoais para começar bem",
    summary: "Orçamento, reserva de emergência, dívidas e como pensar nos primeiros investimentos.",
    materials: [
      {
        id: "me-poupe",
        title: "Me poupe! 10 passos para nunca mais faltar dinheiro no seu bolso",
        creator: "Nathalia Arcuri",
        type: "book",
        why: "Organização financeira direta e sem culpa.",
      },
      {
        id: "carol-sandler",
        title: "Carol Sandler",
        creator: "Criadora do Finanças Femininas",
        type: "author",
        why: "Educação financeira pensada para mulheres, com artigos e cursos.",
        url: "https://financasfemininas.com.br/",
      },
      {
        id: "bcb-cidadania",
        title: "Cidadania Financeira",
        creator: "Banco Central do Brasil",
        type: "article",
        why: "Cadernos e materiais gratuitos de educação financeira, de orçamento a crédito.",
        url: "https://www.bcb.gov.br/cidadaniafinanceira",
        free: true,
      },
    ],
    skills: { portfolio: 0.3 },
    areas: ["wealthManagement"],
    goals: ["investOwn", "understandMarket"],
    foundation: true,
  },
  {
    id: "careers",
    title: "Preparação para processos seletivos",
    summary: "Currículo, entrevistas técnicas e comportamentais, cases e networking.",
    materials: [
      {
        id: "rosenbaum-ib",
        title: "Investment Banking: Valuation, LBOs, M&A, and IPOs",
        creator: "Joshua Rosenbaum e Joshua Pearl",
        type: "book",
        why: "O livro que muita gente usa para se preparar para entrevistas técnicas de banco.",
        language: "Inglês",
      },
      {
        id: "sandberg-ted",
        title: "Por que temos poucas mulheres líderes",
        creator: "Sheryl Sandberg (TED)",
        type: "video",
        why: "Uma palestra curta sobre ocupar espaço desde o começo da carreira.",
        url: "https://www.ted.com/talks/sheryl_sandberg_why_we_have_too_few_women_leaders",
        free: true,
        language: "Inglês, com legendas em português",
      },
      {
        id: "faca-acontecer",
        title: "Faça acontecer",
        creator: "Sheryl Sandberg",
        type: "book",
        why: "Sobre negociar, se candidatar mesmo sem cumprir todos os requisitos e liderar.",
      },
    ],
    skills: { interviews: 1 },
    areas: ["investmentBanking", "research", "assetManagement", "privateEquity", "wealthManagement"],
    goals: ["getInternship", "firstJob", "changeCareer"],
  },
];

/** Search link for a book (or anything) that has no official link. */
export function searchUrl(m: Pick<TrailMaterial, "title" | "creator" | "type">) {
  const q = encodeURIComponent(`${m.title} ${m.creator}`);
  return m.type === "book" ? `https://www.google.com/search?tbm=bks&q=${q}` : `https://www.google.com/search?q=${q}`;
}

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

/**
 * Materials picked by the FinHer team, shown first and labeled "Seleção da equipe".
 * Edit this list to add or remove picks; members add their own on the site.
 */
export const TEAM_MATERIALS: MaterialRecommendation[] = [
  {
    id: "team-faca-acontecer",
    authorId: "",
    authorName: "",
    title: "Faça acontecer: mulheres, trabalho e a vontade de liderar",
    creator: "Sheryl Sandberg",
    type: "book",
    topics: ["career", "leadership"],
    url: "",
    comment: "Sobre ocupar espaço, negociar e liderar, com dados e histórias do mundo corporativo.",
    createdAt: "2026-11-01T12:00:00.000Z",
    curated: true,
  },
  {
    id: "team-psicologia-financeira",
    authorId: "",
    authorName: "",
    title: "A psicologia financeira",
    creator: "Morgan Housel",
    type: "book",
    topics: ["personalFinance", "psychology", "finance"],
    url: "",
    comment: "Histórias curtas sobre como emoções e comportamento pesam mais do que fórmulas nas decisões com dinheiro.",
    createdAt: "2026-11-01T12:00:01.000Z",
    curated: true,
  },
  {
    id: "team-investidor-inteligente",
    authorId: "",
    authorName: "",
    title: "O investidor inteligente",
    creator: "Benjamin Graham",
    type: "book",
    topics: ["finance"],
    url: "",
    comment: "O clássico sobre análise fundamentalista e margem de segurança. Denso, mas vale a leitura com calma.",
    createdAt: "2026-11-01T12:00:02.000Z",
    curated: true,
  },
  {
    id: "team-rapido-devagar",
    authorId: "",
    authorName: "",
    title: "Rápido e devagar: duas formas de pensar",
    creator: "Daniel Kahneman",
    type: "book",
    topics: ["psychology", "finance"],
    url: "",
    comment: "Vieses que afetam qualquer decisão, inclusive no mercado. Base da economia comportamental.",
    createdAt: "2026-11-01T12:00:03.000Z",
    curated: true,
  },
  {
    id: "team-cnv",
    authorId: "",
    authorName: "",
    title: "Comunicação não-violenta",
    creator: "Marshall B. Rosenberg",
    type: "book",
    topics: ["communication", "psychology"],
    url: "",
    comment: "Um método prático para conversas difíceis, feedback e negociação sem confronto.",
    createdAt: "2026-11-01T12:00:04.000Z",
    curated: true,
  },
  {
    id: "team-ted-falar-em-publico",
    authorId: "",
    authorName: "",
    title: "TED Talks: o guia oficial do TED para falar em público",
    creator: "Chris Anderson",
    type: "book",
    topics: ["communication"],
    url: "",
    comment: "Como estruturar e apresentar uma ideia, do curador das conferências TED. Ótimo par para o guia de oratória.",
    createdAt: "2026-11-01T12:00:05.000Z",
    curated: true,
  },
  {
    id: "team-poder-da-presenca",
    authorId: "",
    authorName: "",
    title: "O poder da presença",
    creator: "Amy Cuddy",
    type: "book",
    topics: ["communication", "psychology"],
    url: "",
    comment: "Sobre postura, confiança e presença em momentos de pressão, como entrevistas e apresentações.",
    createdAt: "2026-11-01T12:00:06.000Z",
    curated: true,
  },
  {
    id: "team-mindset",
    authorId: "",
    authorName: "",
    title: "Mindset: a nova psicologia do sucesso",
    creator: "Carol S. Dweck",
    type: "book",
    topics: ["psychology", "career"],
    url: "",
    comment: "A diferença entre acreditar que habilidades são fixas ou que se desenvolvem, e como isso muda a carreira.",
    createdAt: "2026-11-01T12:00:07.000Z",
    curated: true,
  },
  {
    id: "team-inteligencia-emocional",
    authorId: "",
    authorName: "",
    title: "Inteligência emocional",
    creator: "Daniel Goleman",
    type: "book",
    topics: ["psychology", "leadership"],
    url: "",
    comment: "Autoconhecimento, autocontrole e empatia como habilidades que qualquer pessoa desenvolve.",
    createdAt: "2026-11-01T12:00:08.000Z",
    curated: true,
  },
];

/**
 * Fictional talent-bank profiles, shown only in demo mode so leaders can try the
 * search. Always labeled "Perfil de exemplo" in the UI. Not real people.
 */
const sampleTalent = (p: Omit<TalentProfile, "visible" | "sample" | "updatedAt" | "contactEmail" | "linkedinUrl"> & { updatedAt?: string }): TalentProfile => ({
  visible: true,
  sample: true,
  contactEmail: "",
  linkedinUrl: "",
  updatedAt: p.updatedAt ?? "2026-11-01T12:00:00.000Z",
  ...p,
});

export const SAMPLE_TALENTS: TalentProfile[] = [
  sampleTalent({
    userId: "sample-talent-1",
    shareCv: true,
    name: "Beatriz A.",
    headline: "Estudante de Economia buscando estágio em research de ações",
    city: "São Paulo, SP",
    careerStage: "internship",
    areas: ["research", "assetManagement"],
    program: "economics",
    education: "Economia, 6º semestre",
    graduationYear: 2028,
    languages: ["en"],
    certifications: ["cpa20"],
    availability: ["internship"],
    workModes: ["hybrid", "inPerson"],
    about: "Membro da liga de mercado financeiro, onde cobre o setor elétrico. Gosto de modelagem em Excel e de escrever relatórios.",
    cvUrl: "https://example.com/cv-exemplo.pdf",
  }),
  sampleTalent({
    userId: "sample-talent-2",
    shareCv: false,
    name: "Juliana M.",
    headline: "Engenheira em transição para risco e dados",
    city: "Belo Horizonte, MG",
    careerStage: "transition",
    areas: ["riskCompliance", "fintech"],
    program: "engineering",
    education: "Engenharia de Produção, formada",
    graduationYear: 2021,
    languages: ["en", "es"],
    certifications: [],
    availability: ["fullTime"],
    workModes: ["remote", "hybrid"],
    about: "Cinco anos em operações na indústria. Python, SQL e estatística. Estudando para a CPA-20.",
    cvUrl: "",
  }),
  sampleTalent({
    userId: "sample-talent-3",
    shareCv: true,
    name: "Fernanda L.",
    headline: "Analista de wealth management com CEA",
    city: "Rio de Janeiro, RJ",
    careerStage: "growing",
    areas: ["wealthManagement", "assetManagement"],
    program: "business",
    education: "Administração",
    graduationYear: 2019,
    languages: ["en", "fr"],
    certifications: ["cpa20", "cea"],
    availability: ["fullTime"],
    workModes: ["inPerson", "hybrid"],
    about: "Atendo clientes de alta renda há quatro anos. Busco uma posição de especialista ou coordenação.",
    cvUrl: "https://example.com/cv-exemplo.pdf",
  }),
  sampleTalent({
    userId: "sample-talent-4",
    shareCv: true,
    name: "Carla S.",
    headline: "Recém-formada em Contabilidade, interesse em M&A",
    city: "Porto Alegre, RS",
    careerStage: "earlyCareer",
    areas: ["investmentBanking", "corporateFinance"],
    program: "accounting",
    education: "Ciências Contábeis",
    graduationYear: 2025,
    languages: ["en"],
    certifications: [],
    availability: ["trainee", "fullTime"],
    workModes: ["inPerson"],
    about: "Experiência em auditoria. Participei de um desafio de valuation universitário e quero ir para banco de investimento.",
    cvUrl: "https://example.com/cv-exemplo.pdf",
  }),
];
