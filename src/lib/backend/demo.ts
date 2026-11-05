import type { AppUser, OnboardingAnswers, Profile, SavedSituation, TherapistRecommendation } from "@/lib/domain";
import { BackendError, type Backend } from "./types";

/**
 * Browser-only backend for trying FinHer without a Supabase project.
 * Data lives in localStorage on this device. Not for production use.
 */
const USERS_KEY = "elevar-demo-users";
const SESSION_KEY = "elevar-demo-session";
const profileKey = (id: string) => `elevar-demo-profile-${id}`;
const situationsKey = (id: string) => `elevar-demo-situations-${id}`;
const checklistKey = (id: string) => `elevar-demo-checklist-${id}`;
/** Shared by every demo account in this browser, like the real community would be. */
const THERAPISTS_KEY = "finher-demo-therapists";

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new BackendError("generic", "Browser storage is unavailable.");
  }
}

async function hash(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

const delay = () => new Promise((r) => setTimeout(r, 250));

export function createDemoBackend(): Backend {
  const listeners = new Set<(u: AppUser | null) => void>();
  const emit = (u: AppUser | null) => listeners.forEach((l) => l(u));

  const users = () => read<Record<string, StoredUser>>(USERS_KEY, {});
  const currentUser = (): AppUser | null => {
    const id = read<string | null>(SESSION_KEY, null);
    const u = id ? Object.values(users()).find((x) => x.id === id) : undefined;
    return u ? { id: u.id, email: u.email } : null;
  };

  return {
    mode: "demo",

    async getUser() {
      return currentUser();
    },

    async getAccessToken() {
      return null;
    },

    onAuthChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    async signUp({ email, password, displayName }) {
      await delay();
      const key = email.trim().toLowerCase();
      const all = users();
      if (all[key]) throw new BackendError("emailTaken");
      const user: StoredUser = { id: crypto.randomUUID(), email: key, passwordHash: await hash(password) };
      write(USERS_KEY, { ...all, [key]: user });
      const profile: Profile = { id: user.id, displayName: displayName.trim(), onboardingCompletedAt: null };
      write(profileKey(user.id), profile);
      write(SESSION_KEY, user.id);
      const appUser = { id: user.id, email: user.email };
      emit(appUser);
      return { user: appUser, needsEmailConfirmation: false };
    },

    async signIn(email, password) {
      await delay();
      const u = users()[email.trim().toLowerCase()];
      if (!u || u.passwordHash !== (await hash(password))) throw new BackendError("invalidCredentials");
      write(SESSION_KEY, u.id);
      const appUser = { id: u.id, email: u.email };
      emit(appUser);
      return appUser;
    },

    async signOut() {
      localStorage.removeItem(SESSION_KEY);
      emit(null);
    },

    async getProfile(userId) {
      return read<Profile | null>(profileKey(userId), null);
    },

    async saveOnboarding(userId, answers: OnboardingAnswers) {
      await delay();
      const prev = read<Profile | null>(profileKey(userId), null);
      const next: Profile = {
        ...prev,
        id: userId,
        displayName: prev?.displayName ?? "",
        ...answers,
        onboardingCompletedAt: new Date().toISOString(),
      };
      write(profileKey(userId), next);
      return next;
    },

    async setJurisdiction(userId, jurisdiction) {
      const prev = read<Profile | null>(profileKey(userId), null);
      if (!prev) throw new BackendError("generic");
      const next = { ...prev, jurisdiction };
      write(profileKey(userId), next);
      return next;
    },

    async listSituations(userId) {
      return read<SavedSituation[]>(situationsKey(userId), []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async saveSituation(userId, input) {
      const all = read<SavedSituation[]>(situationsKey(userId), []);
      const now = new Date().toISOString();
      const existing = input.id ? all.find((s) => s.id === input.id) : undefined;
      const saved: SavedSituation = {
        id: existing?.id ?? crypto.randomUUID(),
        playbookId: input.playbookId,
        answers: input.answers,
        note: input.note,
        status: input.status,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      write(situationsKey(userId), [saved, ...all.filter((s) => s.id !== saved.id)]);
      return saved;
    },

    async deleteSituation(userId, id) {
      write(situationsKey(userId), read<SavedSituation[]>(situationsKey(userId), []).filter((s) => s.id !== id));
    },

    async deleteAllSituations(userId) {
      localStorage.removeItem(situationsKey(userId));
    },

    async getChecklist(userId) {
      return read<string[]>(checklistKey(userId), []);
    },

    async setChecklistItem(userId, itemId, done) {
      const set = new Set(read<string[]>(checklistKey(userId), []));
      if (done) set.add(itemId);
      else set.delete(itemId);
      write(checklistKey(userId), [...set]);
    },

    async listTherapistRecommendations() {
      return read<TherapistRecommendation[]>(THERAPISTS_KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async addTherapistRecommendation(userId, input) {
      await delay();
      const rec: TherapistRecommendation = { ...input, id: crypto.randomUUID(), authorId: userId, createdAt: new Date().toISOString() };
      write(THERAPISTS_KEY, [rec, ...read<TherapistRecommendation[]>(THERAPISTS_KEY, [])]);
      return rec;
    },

    async deleteTherapistRecommendation(userId, id) {
      write(
        THERAPISTS_KEY,
        read<TherapistRecommendation[]>(THERAPISTS_KEY, []).filter((r) => !(r.id === id && r.authorId === userId)),
      );
    },

    async deleteAccount() {
      const u = currentUser();
      if (!u) return;
      const all = users();
      delete all[u.email];
      write(USERS_KEY, all);
      localStorage.removeItem(profileKey(u.id));
      localStorage.removeItem(situationsKey(u.id));
      localStorage.removeItem(checklistKey(u.id));
      write(THERAPISTS_KEY, read<TherapistRecommendation[]>(THERAPISTS_KEY, []).filter((r) => r.authorId !== u.id));
      localStorage.removeItem(SESSION_KEY);
      emit(null);
    },
  };
}
