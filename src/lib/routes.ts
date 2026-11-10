import { useSearchParams } from "react-router-dom";

/** Every in-app path in one place, so the navigation can change without hunting for links. */
export const paths = {
  home: "/app",
  learn: "/app/learn",
  area: (id: string) => `/app/learn/areas/${id}`,
  topic: (id: string) => `/app/learn/topics/${id}`,
  challenges: "/app/challenges",
  support: "/app/challenges/support",
  playbook: (id: string, savedId?: string) => `/app/challenges/${id}${savedId ? `/${savedId}` : ""}`,
  family: "/app/family",
  phase: (id: string) => `/app/family/${id}`,
  stories: "/app/stories",
  story: (id: string) => `/app/stories/${id}`,
  softSkills: "/app/soft-skills",
  softSkill: (id: string) => `/app/soft-skills/${id}`,
  assistant: "/app/assistant",
  community: "/app/community",
  opportunities: "/app/community/opportunities",
  materials: "/app/community/materials",
  talents: "/app/talentos",
  /** Public page where approved leaders search the talent bank. */
  talentSearch: "/talentos",
  settings: "/app/settings",
} as const;

/** Pages a login or signup may send her back to (?next=…). Anything else is ignored. */
const NEXT_ALLOWED = [paths.talentSearch];

export function useNextPath(): string | null {
  const [params] = useSearchParams();
  const next = params.get("next");
  return next && (NEXT_ALLOWED as string[]).includes(next) ? next : null;
}
