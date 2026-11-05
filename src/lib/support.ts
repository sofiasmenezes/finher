import type { GoalId, SavedSituation, SupportThemeId, TherapistRecommendation } from "@/lib/domain";
import { SUPPORT_THEMES } from "@/lib/domain";

/** Goals that point to a support theme, for women who haven't saved a situation yet. */
const GOAL_THEMES: Partial<Record<GoalId, SupportThemeId>> = {
  balance: "family",
  changeCareer: "career-change",
  grow: "passed-over",
  leadership: "passed-over",
  network: "networking",
};

/**
 * The themes closest to her own challenges: the Challenge Navigator situations
 * she saved (still open first), then her goals. Computed on her device only.
 */
export function themesFor(saved: SavedSituation[], goals: readonly GoalId[] = []): SupportThemeId[] {
  const themes = new Set<SupportThemeId>();
  const ordered = [...saved].sort((a, b) => Number(a.status === "resolved") - Number(b.status === "resolved"));
  for (const s of ordered) {
    if ((SUPPORT_THEMES as readonly string[]).includes(s.playbookId)) themes.add(s.playbookId as SupportThemeId);
  }
  for (const g of goals) {
    const t = GOAL_THEMES[g];
    if (t) themes.add(t);
  }
  return [...themes];
}

/** Recommendations sharing at least one theme, most shared themes first, then newest. */
export function rankBySimilarity(recs: TherapistRecommendation[], themes: SupportThemeId[]): TherapistRecommendation[] {
  if (themes.length === 0) return [];
  const wanted = new Set(themes);
  return recs
    .map((r) => ({ r, score: r.themes.filter((t) => wanted.has(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.r.createdAt.localeCompare(a.r.createdAt))
    .map((x) => x.r);
}

/** Real recommendations, topped up with labeled samples while the community has fewer than three. */
export function withSamples(real: TherapistRecommendation[], samples: TherapistRecommendation[]): TherapistRecommendation[] {
  return real.length >= 3 ? real : [...real, ...samples];
}
