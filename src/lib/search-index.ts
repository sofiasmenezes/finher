import { AREA_GUIDES, FAMILY_PHASES, STORIES, PLAYBOOKS, SOFT_SKILLS, TOPICS } from "@/content/loader";
import { paths } from "@/lib/routes";

export type Kind = "area" | "topic" | "playbook" | "phase" | "story" | "softSkill";

export interface Entry {
  kind: Kind;
  title: string;
  summary: string;
  to: string;
  /** Title + summary, folded, for the quick search. */
  haystack: string;
  /** The whole text, folded, for the assistant's offline answers. */
  body: string;
}

/** Lowercase and strip accents so "negociacao" finds "negociação". */
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const text = (html: string) => html.replace(/<[^>]+>/g, " ");

export function buildIndex(): Entry[] {
  const entry = (kind: Kind, title: string, summary: string, to: string, body = ""): Entry => ({
    kind,
    title,
    summary,
    to,
    haystack: fold(`${title} ${summary}`),
    body: fold(text(body)),
  });
  const join = (secs: { heading: string; html: string }[]) => secs.map((s) => `${s.heading} ${s.html}`).join(" ");
  return [
    ...PLAYBOOKS.map((p) =>
      entry("playbook", p.title, p.summary, paths.playbook(p.id), [p.diagnosis.html, ...p.options.map((o) => `${o.title} ${o.html}`), p.wordingHtml].join(" ")),
    ),
    ...SOFT_SKILLS.map((s) => entry("softSkill", s.title, s.summary, paths.softSkill(s.id), join(s.sections))),
    ...AREA_GUIDES.map((a) => entry("area", a.title, a.summary, paths.area(a.id), join(a.sections))),
    ...TOPICS.map((t) => entry("topic", t.title, t.summary, paths.topic(t.id), join(t.sections))),
    ...FAMILY_PHASES.map((f) => entry("phase", f.title, f.summary, paths.phase(f.id), join(f.sections))),
    ...STORIES.map((s) => entry("story", s.title, s.summary, paths.story(s.id), s.html)),
  ];
}

const STOPWORDS = new Set(
  "a o as os um uma uns umas de do da dos das em no na nos nas por para pra com sem e ou que se me te mim meu minha seu sua como qual quais quando onde porque porquê ser estar ter tenho tem sou esta isso isto ele ela eu voce vc nao sim mais muito pouco sobre ao aos ja foi vai vou fazer faz posso pode quero preciso".split(
    " ",
  ),
);

/** Content most related to a free-text question, for when the AI is unavailable. */
export function searchContent(index: Entry[], question: string, limit = 3): Entry[] {
  const words = fold(question)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  if (!words.length) return [];
  return index
    .map((e) => {
      let score = 0;
      for (const w of words) {
        if (e.haystack.includes(w)) score += 3;
        else if (e.body.includes(w)) score += 1;
      }
      return { e, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}
