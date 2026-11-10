import type {
  AppUser,
  Jurisdiction,
  OnboardingAnswers,
  Profile,
  SavedSituation,
  SituationInput,
  TherapistRecommendation,
  TherapistRecommendationInput,
  MaterialRecommendation,
  MaterialRecommendationInput,
  OpportunityAlerts,
  RecruiterAccess,
  RecruiterAccessInput,
  TalentProfile,
  TalentProfileInput,
} from "@/lib/domain";

export type BackendErrorCode = "invalidCredentials" | "emailTaken" | "generic";

export class BackendError extends Error {
  constructor(
    public code: BackendErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
}

/** Everything a user can download about herself. */
export interface DataExport {
  exportedAt: string;
  account: AppUser;
  profile: Profile | null;
  savedSituations: SavedSituation[];
  careerFamilyChecklist: string[];
  therapistRecommendations: TherapistRecommendation[];
  materialRecommendations: MaterialRecommendation[];
  opportunityAlerts: OpportunityAlerts;
  talentProfile: TalentProfile | null;
  recruiterAccess: RecruiterAccess | null;
}

/**
 * Everything the UI needs from the backend. Two implementations:
 * Supabase (production) and a browser-only demo used when no
 * Supabase project is configured.
 */
export interface Backend {
  mode: "supabase" | "demo";
  getUser(): Promise<AppUser | null>;
  /** Session token sent to our own serverless functions (null in demo mode). */
  getAccessToken(): Promise<string | null>;
  onAuthChange(cb: (user: AppUser | null) => void): () => void;
  signUp(input: SignUpInput): Promise<{ user: AppUser | null; needsEmailConfirmation: boolean }>;
  signIn(email: string, password: string): Promise<AppUser>;
  signOut(): Promise<void>;
  getProfile(userId: string): Promise<Profile | null>;
  saveOnboarding(userId: string, answers: OnboardingAnswers): Promise<Profile>;
  setJurisdiction(userId: string, jurisdiction: Jurisdiction): Promise<Profile>;

  listSituations(userId: string): Promise<SavedSituation[]>;
  saveSituation(userId: string, input: SituationInput): Promise<SavedSituation>;
  deleteSituation(userId: string, id: string): Promise<void>;
  deleteAllSituations(userId: string): Promise<void>;

  getChecklist(userId: string): Promise<string[]>;
  setChecklistItem(userId: string, itemId: string, done: boolean): Promise<void>;

  /** Psychologist recommendations shared by members (newest first). */
  listTherapistRecommendations(): Promise<TherapistRecommendation[]>;
  addTherapistRecommendation(userId: string, input: TherapistRecommendationInput): Promise<TherapistRecommendation>;
  deleteTherapistRecommendation(userId: string, id: string): Promise<void>;

  /** Books, podcasts, courses… shared by members (newest first). */
  listMaterials(): Promise<MaterialRecommendation[]>;
  addMaterial(userId: string, input: MaterialRecommendationInput): Promise<MaterialRecommendation>;
  deleteMaterial(userId: string, id: string): Promise<void>;

  getOpportunityAlerts(userId: string): Promise<OpportunityAlerts>;
  setOpportunityAlerts(userId: string, alerts: OpportunityAlerts): Promise<void>;

  /** Her own talent-bank profile (null until she creates one). */
  getTalentProfile(userId: string): Promise<TalentProfile | null>;
  saveTalentProfile(userId: string, input: TalentProfileInput): Promise<TalentProfile>;
  deleteTalentProfile(userId: string): Promise<void>;
  /** Visible profiles, for approved leaders only (CV links only when shared). */
  searchTalents(): Promise<TalentProfile[]>;
  getRecruiterAccess(userId: string): Promise<RecruiterAccess | null>;
  requestRecruiterAccess(userId: string, input: RecruiterAccessInput): Promise<RecruiterAccess>;

  deleteAccount(): Promise<void>;
}

/** Built from the other calls so both implementations export the same shape. */
export async function exportData(b: Backend, user: AppUser): Promise<DataExport> {
  const [profile, savedSituations, careerFamilyChecklist, recommendations, materials, opportunityAlerts, talentProfile, recruiterAccess] = await Promise.all([
    b.getProfile(user.id),
    b.listSituations(user.id),
    b.getChecklist(user.id),
    b.listTherapistRecommendations(),
    b.listMaterials(),
    b.getOpportunityAlerts(user.id),
    b.getTalentProfile(user.id),
    b.getRecruiterAccess(user.id),
  ]);
  const therapistRecommendations = recommendations.filter((r) => r.authorId === user.id);
  const materialRecommendations = materials.filter((m) => m.authorId === user.id);
  return {
    exportedAt: new Date().toISOString(),
    account: user,
    profile,
    savedSituations,
    careerFamilyChecklist,
    therapistRecommendations,
    materialRecommendations,
    opportunityAlerts,
    talentProfile,
    recruiterAccess,
  };
}
