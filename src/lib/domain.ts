/** Core domain identifiers. Labels for each id live in the i18n file. */

/** Where she is in her career right now. */
export const CAREER_STAGES = [
  "exploring",
  "internship",
  "earlyCareer",
  "transition",
  "newcomer",
  "growing",
  "returning",
] as const;
export type CareerStageId = (typeof CAREER_STAGES)[number];

/** Stages where university details are relevant (and asked, optionally). */
export const STUDENT_STAGES: CareerStageId[] = ["exploring", "internship"];

export const PROGRAMS = ["economics", "business", "accounting", "finance", "intlTrade", "engineering", "other"] as const;
export type ProgramId = (typeof PROGRAMS)[number];

/** Areas of the financial market she works in or wants to work in. */
export const AREAS = [
  "research",
  "assetManagement",
  "investmentBanking",
  "trading",
  "privateEquity",
  "wealthManagement",
  "corporateFinance",
  "riskCompliance",
  "fintech",
  "notSure",
] as const;
export type AreaId = (typeof AREAS)[number];

/** What she wants next. */
export const GOALS = [
  "understandMarket",
  "getInternship",
  "firstJob",
  "changeCareer",
  "grow",
  "leadership",
  "network",
  "certification",
  "balance",
  "investOwn",
] as const;
export type GoalId = (typeof GOALS)[number];

export const SKILLS = ["statements", "valuation", "macro", "portfolio", "tools", "interviews"] as const;
export type SkillId = (typeof SKILLS)[number];

export const MAX_AREAS = 3;
export const MAX_GOALS = 3;

export type ConfidenceMap = Record<SkillId, number>; // 1–5

export interface OnboardingAnswers {
  careerStage: CareerStageId;
  areas: AreaId[];
  goals: GoalId[];
  confidence: ConfidenceMap;
  /** Optional, only for students. */
  university: string;
  program: ProgramId | "";
}

/** Country used for legal/general-information content. */
export type Jurisdiction = "BR" | "US";
export const JURISDICTIONS: Jurisdiction[] = ["BR", "US"];
export const DEFAULT_JURISDICTION: Jurisdiction = "BR";

export interface Profile extends Partial<OnboardingAnswers> {
  id: string;
  displayName: string;
  onboardingCompletedAt: string | null;
  jurisdiction?: Jurisdiction;
}

/** A Challenge Navigator situation the user chose to save. Private to her. */
export interface SavedSituation {
  id: string;
  playbookId: string;
  answers: Record<string, string>;
  note: string;
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
}

export type SituationInput = Pick<SavedSituation, "playbookId" | "answers" | "note" | "status"> & { id?: string };

export interface AppUser {
  id: string;
  email: string;
}

/** Profiles created before the career-stage redesign must redo onboarding. */
export function isOnboarded(p: Profile | null): p is Profile & OnboardingAnswers {
  return (
    !!p?.onboardingCompletedAt &&
    !!p.careerStage &&
    (CAREER_STAGES as readonly string[]).includes(p.careerStage) &&
    !!p.areas?.length &&
    !!p.goals?.length &&
    p.goals.every((g) => (GOALS as readonly string[]).includes(g)) &&
    !!p.confidence
  );
}

/* ---------------- Psychologist recommendations (shared with the community) ---------------- */

/**
 * What a recommendation helped with. Playbook ids from the Challenge Navigator
 * come first, so a recommendation can be matched to the situations she saved.
 */
export const SUPPORT_THEMES = [
  "interrupted",
  "passed-over",
  "pay-negotiation",
  "credit",
  "networking",
  "anxiety",
  "burnout",
  "impostor",
  "harassment",
  "family",
  "career-change",
] as const;
export type SupportThemeId = (typeof SUPPORT_THEMES)[number];

export const THERAPY_MODALITIES = ["online", "inPerson", "both"] as const;
export type TherapyModality = (typeof THERAPY_MODALITIES)[number];

export const THERAPY_PRICES = ["free", "social", "private", "insurance"] as const;
export type TherapyPrice = (typeof THERAPY_PRICES)[number];

/**
 * A psychologist recommended by a member of the community. Visible to every
 * signed-in member; only the author can delete it.
 */
export interface TherapistRecommendation {
  id: string;
  authorId: string;
  /** First name, or empty when she chose to recommend anonymously. */
  authorName: string;
  therapistName: string;
  /** Professional registration (CRP in Brazil), optional. */
  crp: string;
  modality: TherapyModality;
  city: string;
  price: TherapyPrice;
  contact: string;
  themes: SupportThemeId[];
  comment: string;
  createdAt: string;
  /** Fictional entries used as a preview; always labeled in the UI. */
  sample?: boolean;
}

export type TherapistRecommendationInput = Omit<TherapistRecommendation, "id" | "authorId" | "createdAt" | "sample">;

/* ---------------- Opportunity calendar alerts ---------------- */

/** Her alert settings for the opportunity calendar. Private to her. */
export interface OpportunityAlerts {
  enabled: boolean;
  /** Opportunity ids she has already been alerted about. */
  seen: string[];
}

export const DEFAULT_ALERTS: OpportunityAlerts = { enabled: false, seen: [] };

/* ---------------- Material recommendations (shared with the community) ---------------- */

export const MATERIAL_TYPES = ["book", "podcast", "course", "video", "author", "newsletter", "article", "other"] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const MATERIAL_TOPICS = [
  "finance",
  "personalFinance",
  "career",
  "leadership",
  "communication",
  "psychology",
  "wellbeing",
  "technology",
] as const;
export type MaterialTopic = (typeof MATERIAL_TOPICS)[number];

/** A book, podcast, course… recommended by a member. Visible to every signed-in member. */
export interface MaterialRecommendation {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  /** Author, host or organization. */
  creator: string;
  type: MaterialType;
  topics: MaterialTopic[];
  url: string;
  comment: string;
  createdAt: string;
  /** Picked by the FinHer team (shown first, labeled). */
  curated?: boolean;
}

export type MaterialRecommendationInput = Omit<MaterialRecommendation, "id" | "authorId" | "createdAt" | "curated">;

/* ---------------- Talent bank (opt-in, for leaders hiring in the market) ---------------- */

export const TALENT_AVAILABILITY = ["internship", "trainee", "fullTime", "partTime", "freelance"] as const;
export type TalentAvailability = (typeof TALENT_AVAILABILITY)[number];

export const WORK_MODES = ["inPerson", "hybrid", "remote"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

/** Languages besides Portuguese. */
export const TALENT_LANGUAGES = ["en", "es", "fr", "de", "it", "zh"] as const;
export type TalentLanguage = (typeof TALENT_LANGUAGES)[number];

export const CERTIFICATIONS = ["cpa10", "cpa20", "cea", "cfp", "ancord", "cnpi", "cga", "cfa"] as const;
export type Certification = (typeof CERTIFICATIONS)[number];

/**
 * Her profile in the talent bank. Nothing is shown to anyone unless she turns
 * `visible` on, and her CV link only when she also turns `shareCv` on.
 */
export interface TalentProfile {
  userId: string;
  visible: boolean;
  shareCv: boolean;
  name: string;
  headline: string;
  city: string;
  careerStage: CareerStageId;
  areas: AreaId[];
  program: ProgramId | "";
  education: string;
  graduationYear: number | null;
  languages: TalentLanguage[];
  certifications: Certification[];
  availability: TalentAvailability[];
  workModes: WorkMode[];
  about: string;
  linkedinUrl: string;
  /** Link to her CV (PDF on Drive, Dropbox…). Shown only when shareCv is on. */
  cvUrl: string;
  contactEmail: string;
  updatedAt: string;
  /** Fictional entries shown in demo mode; always labeled in the UI. */
  sample?: boolean;
}

export type TalentProfileInput = Omit<TalentProfile, "userId" | "updatedAt" | "sample">;

/** A leader asking to search the talent bank. The FinHer team approves each request. */
export interface RecruiterAccess {
  userId: string;
  name: string;
  company: string;
  role: string;
  linkedinUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export type RecruiterAccessInput = Pick<RecruiterAccess, "name" | "company" | "role" | "linkedinUrl">;

/** Filters a leader can combine when searching. Empty means "any". */
export interface TalentFilters {
  q: string;
  areas: AreaId[];
  stages: CareerStageId[];
  programs: ProgramId[];
  languages: TalentLanguage[];
  certifications: Certification[];
  availability: TalentAvailability[];
  workModes: WorkMode[];
  city: string;
  withCv: boolean;
}

export const EMPTY_TALENT_FILTERS: TalentFilters = {
  q: "",
  areas: [],
  stages: [],
  programs: [],
  languages: [],
  certifications: [],
  availability: [],
  workModes: [],
  city: "",
  withCv: false,
};

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const anyOf = <T>(wanted: T[], has: T[]) => wanted.length === 0 || wanted.some((w) => has.includes(w));

/**
 * Which visible profiles match the filters. Within one filter any option matches
 * (área A ou B); different filters must all match (área E idioma).
 */
export function filterTalents(list: TalentProfile[], f: TalentFilters): TalentProfile[] {
  const words = norm(f.q).split(/\s+/).filter(Boolean);
  const city = norm(f.city);
  return list.filter((p) => {
    if (!p.visible) return false;
    if (!anyOf(f.areas, p.areas)) return false;
    if (f.stages.length && !f.stages.includes(p.careerStage)) return false;
    if (f.programs.length && (!p.program || !f.programs.includes(p.program))) return false;
    if (!f.languages.every((l) => p.languages.includes(l))) return false;
    if (!anyOf(f.certifications, p.certifications)) return false;
    if (!anyOf(f.availability, p.availability)) return false;
    if (!anyOf(f.workModes, p.workModes)) return false;
    if (city && !norm(p.city).includes(city)) return false;
    if (f.withCv && !(p.shareCv && p.cvUrl)) return false;
    if (words.length) {
      const text = norm([p.name, p.headline, p.education, p.about, p.city].join(" "));
      if (!words.every((w) => text.includes(w))) return false;
    }
    return true;
  });
}

/** What a leader may see: the CV link disappears unless she chose to share it. */
export function publicTalent(p: TalentProfile): TalentProfile {
  return p.shareCv ? p : { ...p, cvUrl: "" };
}
