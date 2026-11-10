import { createClient, type User } from "@supabase/supabase-js";
import { DEFAULT_ALERTS, type AppUser, type RecruiterAccess, type TalentProfile, type MaterialRecommendation, type OnboardingAnswers, type Profile, type SavedSituation, type TherapistRecommendation } from "@/lib/domain";
import { BackendError, type Backend } from "./types";

interface SituationRow {
  id: string;
  playbook_id: string;
  answers: Record<string, string>;
  note: string;
  status: SavedSituation["status"];
  created_at: string;
  updated_at: string;
}

const toSituation = (r: SituationRow): SavedSituation => ({
  id: r.id,
  playbookId: r.playbook_id,
  answers: r.answers,
  note: r.note,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

interface TherapistRow {
  id: string;
  user_id: string;
  author_name: string;
  therapist_name: string;
  crp: string;
  modality: TherapistRecommendation["modality"];
  city: string;
  price: TherapistRecommendation["price"];
  contact: string;
  themes: TherapistRecommendation["themes"];
  comment: string;
  created_at: string;
}

const toTherapist = (r: TherapistRow): TherapistRecommendation => ({
  id: r.id,
  authorId: r.user_id,
  authorName: r.author_name,
  therapistName: r.therapist_name,
  crp: r.crp,
  modality: r.modality,
  city: r.city,
  price: r.price,
  contact: r.contact,
  themes: r.themes,
  comment: r.comment,
  createdAt: r.created_at,
});

const THERAPIST_COLUMNS = "id, user_id, author_name, therapist_name, crp, modality, city, price, contact, themes, comment, created_at";

interface MaterialRow {
  id: string;
  user_id: string;
  author_name: string;
  title: string;
  creator: string;
  type: MaterialRecommendation["type"];
  topics: MaterialRecommendation["topics"];
  url: string;
  comment: string;
  created_at: string;
}

const toMaterial = (r: MaterialRow): MaterialRecommendation => ({
  id: r.id,
  authorId: r.user_id,
  authorName: r.author_name,
  title: r.title,
  creator: r.creator,
  type: r.type,
  topics: r.topics,
  url: r.url,
  comment: r.comment,
  createdAt: r.created_at,
});

const MATERIAL_COLUMNS = "id, user_id, author_name, title, creator, type, topics, url, comment, created_at";

interface TalentRow {
  user_id: string;
  visible: boolean;
  share_cv: boolean;
  name: string;
  headline: string;
  city: string;
  career_stage: TalentProfile["careerStage"];
  areas: TalentProfile["areas"];
  program: TalentProfile["program"];
  education: string;
  graduation_year: number | null;
  languages: TalentProfile["languages"];
  certifications: TalentProfile["certifications"];
  availability: TalentProfile["availability"];
  work_modes: TalentProfile["workModes"];
  about: string;
  linkedin_url: string;
  cv_url: string;
  contact_email: string;
  updated_at: string;
}

const toTalent = (r: TalentRow): TalentProfile => ({
  userId: r.user_id,
  visible: r.visible,
  shareCv: r.share_cv,
  name: r.name,
  headline: r.headline,
  city: r.city,
  careerStage: r.career_stage,
  areas: r.areas,
  program: r.program,
  education: r.education,
  graduationYear: r.graduation_year,
  languages: r.languages,
  certifications: r.certifications,
  availability: r.availability,
  workModes: r.work_modes,
  about: r.about,
  linkedinUrl: r.linkedin_url,
  cvUrl: r.cv_url,
  contactEmail: r.contact_email,
  updatedAt: r.updated_at,
});

const TALENT_COLUMNS =
  "user_id, visible, share_cv, name, headline, city, career_stage, areas, program, education, graduation_year, languages, certifications, availability, work_modes, about, linkedin_url, cv_url, contact_email, updated_at";

interface RecruiterRow {
  user_id: string;
  name: string;
  company: string;
  role: string;
  linkedin_url: string;
  status: RecruiterAccess["status"];
  created_at: string;
}

const toRecruiter = (r: RecruiterRow): RecruiterAccess => ({
  userId: r.user_id,
  name: r.name,
  company: r.company,
  role: r.role,
  linkedinUrl: r.linkedin_url,
  status: r.status,
  createdAt: r.created_at,
});

const SITUATION_COLUMNS = "id, playbook_id, answers, note, status, created_at, updated_at";

interface ProfileRow {
  id: string;
  display_name: string;
  jurisdiction: Profile["jurisdiction"] | null;
  career_stage: Profile["careerStage"] | null;
  areas: Profile["areas"] | null;
  goals: Profile["goals"] | null;
  confidence: Profile["confidence"] | null;
  university: string | null;
  program: Profile["program"] | null;
  onboarding_completed_at: string | null;
}

const PROFILE_COLUMNS =
  "id, display_name, jurisdiction, career_stage, areas, goals, confidence, university, program, onboarding_completed_at";

function toUser(u: User | null | undefined): AppUser | null {
  return u ? { id: u.id, email: u.email ?? "" } : null;
}

function toProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    displayName: r.display_name,
    jurisdiction: r.jurisdiction ?? undefined,
    careerStage: r.career_stage ?? undefined,
    areas: r.areas ?? undefined,
    university: r.university ?? undefined,
    program: r.program ?? undefined,
    goals: r.goals ?? undefined,
    confidence: r.confidence ?? undefined,
    onboardingCompletedAt: r.onboarding_completed_at,
  };
}

export function createSupabaseBackend(url: string, anonKey: string): Backend {
  const sb = createClient(url, anonKey);

  return {
    mode: "supabase",

    async getUser() {
      const { data } = await sb.auth.getSession();
      return toUser(data.session?.user);
    },

    async getAccessToken() {
      const { data } = await sb.auth.getSession();
      return data.session?.access_token ?? null;
    },

    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_event, session) => cb(toUser(session?.user)));
      return () => data.subscription.unsubscribe();
    },

    async signUp({ email, password, displayName }) {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) {
        if (/already registered|exists/i.test(error.message)) throw new BackendError("emailTaken");
        throw new BackendError("generic", error.message);
      }
      // With email confirmation on, Supabase returns a user but no session.
      return { user: toUser(data.user), needsEmailConfirmation: !data.session };
    },

    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.status === 400) throw new BackendError("invalidCredentials");
        throw new BackendError("generic", error.message);
      }
      return toUser(data.user)!;
    },

    async signOut() {
      await sb.auth.signOut();
    },

    async getProfile(userId) {
      const { data, error } = await sb.from("profiles").select(PROFILE_COLUMNS).eq("id", userId).maybeSingle();
      if (error) throw new BackendError("generic", error.message);
      return data ? toProfile(data as ProfileRow) : null;
    },

    async saveOnboarding(userId, a: OnboardingAnswers) {
      const { data, error } = await sb
        .from("profiles")
        .update({
          career_stage: a.careerStage,
          areas: a.areas,
          university: a.university || null,
          program: a.program || null,
          goals: a.goals,
          confidence: a.confidence,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select(PROFILE_COLUMNS)
        .single();
      if (error) throw new BackendError("generic", error.message);
      return toProfile(data as ProfileRow);
    },

    async setJurisdiction(userId, jurisdiction) {
      const { data, error } = await sb
        .from("profiles")
        .update({ jurisdiction })
        .eq("id", userId)
        .select(PROFILE_COLUMNS)
        .single();
      if (error) throw new BackendError("generic", error.message);
      return toProfile(data as ProfileRow);
    },

    async listSituations(userId) {
      const { data, error } = await sb
        .from("saved_situations")
        .select(SITUATION_COLUMNS)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (error) throw new BackendError("generic", error.message);
      return (data as SituationRow[]).map(toSituation);
    },

    async saveSituation(userId, input) {
      const row = {
        user_id: userId,
        playbook_id: input.playbookId,
        answers: input.answers,
        note: input.note,
        status: input.status,
      };
      const query = input.id
        ? sb.from("saved_situations").update(row).eq("id", input.id).eq("user_id", userId)
        : sb.from("saved_situations").insert(row);
      const { data, error } = await query.select(SITUATION_COLUMNS).single();
      if (error) throw new BackendError("generic", error.message);
      return toSituation(data as SituationRow);
    },

    async deleteSituation(userId, id) {
      const { error } = await sb.from("saved_situations").delete().eq("id", id).eq("user_id", userId);
      if (error) throw new BackendError("generic", error.message);
    },

    async deleteAllSituations(userId) {
      const { error } = await sb.from("saved_situations").delete().eq("user_id", userId);
      if (error) throw new BackendError("generic", error.message);
    },

    async getChecklist(userId) {
      const { data, error } = await sb.from("checklist_progress").select("item_id").eq("user_id", userId);
      if (error) throw new BackendError("generic", error.message);
      return (data as { item_id: string }[]).map((r) => r.item_id);
    },

    async setChecklistItem(userId, itemId, done) {
      const { error } = done
        ? await sb.from("checklist_progress").upsert({ user_id: userId, item_id: itemId })
        : await sb.from("checklist_progress").delete().eq("user_id", userId).eq("item_id", itemId);
      if (error) throw new BackendError("generic", error.message);
    },

    async listTherapistRecommendations() {
      const { data, error } = await sb
        .from("therapist_recommendations")
        .select(THERAPIST_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new BackendError("generic", error.message);
      return (data as TherapistRow[]).map(toTherapist);
    },

    async addTherapistRecommendation(userId, input) {
      const { data, error } = await sb
        .from("therapist_recommendations")
        .insert({
          user_id: userId,
          author_name: input.authorName,
          therapist_name: input.therapistName,
          crp: input.crp,
          modality: input.modality,
          city: input.city,
          price: input.price,
          contact: input.contact,
          themes: input.themes,
          comment: input.comment,
        })
        .select(THERAPIST_COLUMNS)
        .single();
      if (error) throw new BackendError("generic", error.message);
      return toTherapist(data as TherapistRow);
    },

    async deleteTherapistRecommendation(userId, id) {
      const { error } = await sb.from("therapist_recommendations").delete().eq("id", id).eq("user_id", userId);
      if (error) throw new BackendError("generic", error.message);
    },

    async listMaterials() {
      const { data, error } = await sb
        .from("material_recommendations")
        .select(MATERIAL_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw new BackendError("generic", error.message);
      return (data as MaterialRow[]).map(toMaterial);
    },

    async addMaterial(userId, input) {
      const { data, error } = await sb
        .from("material_recommendations")
        .insert({
          user_id: userId,
          author_name: input.authorName,
          title: input.title,
          creator: input.creator,
          type: input.type,
          topics: input.topics,
          url: input.url,
          comment: input.comment,
        })
        .select(MATERIAL_COLUMNS)
        .single();
      if (error) throw new BackendError("generic", error.message);
      return toMaterial(data as MaterialRow);
    },

    async deleteMaterial(userId, id) {
      const { error } = await sb.from("material_recommendations").delete().eq("id", id).eq("user_id", userId);
      if (error) throw new BackendError("generic", error.message);
    },

    async getOpportunityAlerts(userId) {
      const { data, error } = await sb.from("opportunity_alerts").select("enabled, seen").eq("user_id", userId).maybeSingle();
      if (error) throw new BackendError("generic", error.message);
      return data ? { enabled: !!data.enabled, seen: (data.seen as string[]) ?? [] } : DEFAULT_ALERTS;
    },

    async setOpportunityAlerts(userId, alerts) {
      const { error } = await sb
        .from("opportunity_alerts")
        .upsert({ user_id: userId, enabled: alerts.enabled, seen: alerts.seen.slice(-500), updated_at: new Date().toISOString() });
      if (error) throw new BackendError("generic", error.message);
    },

    async getTalentProfile(userId) {
      const { data, error } = await sb.from("talent_profiles").select(TALENT_COLUMNS).eq("user_id", userId).maybeSingle();
      if (error) throw new BackendError("generic", error.message);
      return data ? toTalent(data as TalentRow) : null;
    },

    async saveTalentProfile(userId, p) {
      const { data, error } = await sb
        .from("talent_profiles")
        .upsert({
          user_id: userId,
          visible: p.visible,
          share_cv: p.shareCv,
          name: p.name,
          headline: p.headline,
          city: p.city,
          career_stage: p.careerStage,
          areas: p.areas,
          program: p.program,
          education: p.education,
          graduation_year: p.graduationYear,
          languages: p.languages,
          certifications: p.certifications,
          availability: p.availability,
          work_modes: p.workModes,
          about: p.about,
          linkedin_url: p.linkedinUrl,
          cv_url: p.cvUrl,
          contact_email: p.contactEmail,
          updated_at: new Date().toISOString(),
        })
        .select(TALENT_COLUMNS)
        .single();
      if (error) throw new BackendError("generic", error.message);
      return toTalent(data as TalentRow);
    },

    async deleteTalentProfile(userId) {
      const { error } = await sb.from("talent_profiles").delete().eq("user_id", userId);
      if (error) throw new BackendError("generic", error.message);
    },

    async searchTalents() {
      // Security-definer function: returns rows only to approved leaders, only
      // visible profiles, and blanks the CV link unless she chose to share it.
      const { data, error } = await sb.rpc("search_talents");
      if (error) throw new BackendError("generic", error.message);
      return (data as TalentRow[]).map(toTalent);
    },

    async getRecruiterAccess(userId) {
      const { data, error } = await sb
        .from("talent_recruiters")
        .select("user_id, name, company, role, linkedin_url, status, created_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new BackendError("generic", error.message);
      return data ? toRecruiter(data as RecruiterRow) : null;
    },

    async requestRecruiterAccess(userId, input) {
      const { data, error } = await sb
        .from("talent_recruiters")
        .insert({ user_id: userId, name: input.name, company: input.company, role: input.role, linkedin_url: input.linkedinUrl })
        .select("user_id, name, company, role, linkedin_url, status, created_at")
        .single();
      if (error) throw new BackendError("generic", error.message);
      return toRecruiter(data as RecruiterRow);
    },

    async deleteAccount() {
      // Security-definer function that deletes auth.users row for auth.uid();
      // profile and all owned rows cascade. See supabase/migrations.
      const { error } = await sb.rpc("delete_my_account");
      if (error) throw new BackendError("generic", error.message);
      await sb.auth.signOut();
    },
  };
}
