/**
 * Loads the plain-text content in /content (Markdown with a YAML header) at
 * build time and turns it into typed objects. Editors never touch this file;
 * see content/README.md for the file formats.
 *
 * Section keywords are accepted in Portuguese (preferred) or English, so older
 * files keep working: "## Diagnóstico" or "## Diagnosis", "## Opção:" or
 * "## Option:", "### Se:" or "### If:", "## País: BR" or "## Country: BR".
 */
import { marked } from "marked";
import { parse as parseYaml } from "yaml";
import type { AreaId, CareerStageId, Jurisdiction } from "@/lib/domain";

const raw = import.meta.glob<string>("/content/**/*.md", { query: "?raw", import: "default", eager: true });

// Raw HTML in content is dropped: Markdown formatting only.
marked.use({ renderer: { html: () => "" } });

/** Markdown → HTML, with links opening in a new tab. */
export function md(source: string): string {
  const html = marked.parse(source.trim(), { async: false });
  return html.replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"');
}

function split(file: string, text: string): { meta: Record<string, unknown>; body: string } {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`Content file ${file} is missing its --- header ---`);
  return { meta: (parseYaml(m[1]) ?? {}) as Record<string, unknown>, body: m[2] };
}

/** Split a body into its `## Heading` sections, keeping order. */
function sections(body: string): { heading: string; text: string }[] {
  return body
    .split(/^## +/m)
    .slice(1)
    .map((chunk) => {
      const nl = chunk.indexOf("\n");
      return { heading: chunk.slice(0, nl < 0 ? undefined : nl).trim(), text: nl < 0 ? "" : chunk.slice(nl + 1).trim() };
    });
}

/**
 * All files in a folder, except templates (names starting with "_"). A file
 * with a broken header is skipped with a clear console message, so one typo
 * doesn't take the whole site down.
 */
function files(folder: string) {
  return Object.entries(raw)
    .filter(([path]) => path.startsWith(`/content/${folder}/`) && !path.split("/").pop()!.startsWith("_"))
    .flatMap(([path, text]) => {
      try {
        return [{ path, ...split(path, text) }];
      } catch (err) {
        console.error(
          `[FinHer] O arquivo ${path} foi ignorado porque o cabeçalho tem um erro. ` +
            `Dica: textos com ": " precisam ficar entre aspas.`,
          err,
        );
        return [];
      }
    });
}

/** Run a per-file parser, skipping (and reporting) files that fail. */
function safeMap<T, R>(items: T[], fn: (item: T) => R, path: (item: T) => string): R[] {
  return items.flatMap((item) => {
    try {
      return [fn(item)];
    } catch (err) {
      console.error(`[FinHer] O arquivo ${path(item)} foi ignorado: ${(err as Error).message}`);
      return [];
    }
  });
}

const tags = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

const dateString = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ? String(v) : "");
const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : []);

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/* ---------------- Challenge Navigator playbooks ---------------- */

export interface PlaybookQuestion {
  id: string;
  text: string;
  options: { value: string; label: string }[];
}

export interface PlaybookOption {
  title: string;
  html: string;
  bestWhen: string[];
  tradeoffs: string;
}

export interface Playbook {
  id: string;
  order: number;
  area: string;
  title: string;
  summary: string;
  legal: boolean;
  questions: PlaybookQuestion[];
  diagnosis: { html: string; conditional: { when: string[]; html: string }[] };
  options: PlaybookOption[];
  wordingHtml: string;
  leverageHtml: string;
}

const HEADINGS = {
  diagnosis: ["diagnostico", "diagnosis"],
  wording: ["frases prontas", "suggested wording"],
  leverage: ["transforme em vantagem", "turn it into leverage"],
};
const OPTION_RE = /^(opcao|option):\s*/;
const IF_RE = /^### +(?:Se|If): */im;
const BEST_RE = /^(?:Melhor quando|Best when):(.*)$/im;
const TRADE_RE = /^(?:Prós e contras|Pros e contras|Trade-offs?):(.*)$/im;

function parsePlaybook(path: string, meta: Record<string, unknown>, body: string): Playbook {
  const secs = sections(body);
  const get = (names: string[]) => secs.find((s) => names.includes(norm(s.heading)))?.text ?? "";

  const [diagBase, ...ifParts] = get(HEADINGS.diagnosis).split(new RegExp(IF_RE.source, "gim"));
  const conditional = ifParts.map((part) => {
    const nl = part.indexOf("\n");
    return { when: tags(part.slice(0, nl)), html: md(part.slice(nl + 1)) };
  });

  const options = secs
    .filter((s) => OPTION_RE.test(norm(s.heading)))
    .map((s) => {
      const best = s.text.match(BEST_RE)?.[1] ?? "";
      const trade = s.text.match(TRADE_RE)?.[1]?.trim() ?? "";
      const text = s.text.replace(BEST_RE, "").replace(TRADE_RE, "");
      return { title: s.heading.replace(/^(opção|opcao|option):\s*/i, ""), html: md(text), bestWhen: tags(best), tradeoffs: trade };
    });

  if (!meta.id || !Array.isArray(meta.questions)) throw new Error(`${path}: needs an id and questions`);

  return {
    id: String(meta.id),
    order: Number(meta.order ?? 99),
    area: String(meta.area ?? ""),
    title: String(meta.title ?? meta.id),
    summary: String(meta.summary ?? ""),
    legal: meta.legal === true,
    questions: (meta.questions as PlaybookQuestion[]).map((q) => ({
      id: String(q.id),
      text: String(q.text),
      options: (q.options ?? []).map((o) => ({ value: String(o.value).toLowerCase(), label: String(o.label) })),
    })),
    diagnosis: { html: md(diagBase), conditional },
    options,
    wordingHtml: md(get(HEADINGS.wording)),
    leverageHtml: md(get(HEADINGS.leverage)),
  };
}

export const PLAYBOOKS: Playbook[] = safeMap(files("navigator"), (f) => parsePlaybook(f.path, f.meta, f.body), (f) => f.path).sort(
  (a, b) => a.order - b.order,
);

export function getPlaybook(id: string) {
  return PLAYBOOKS.find((p) => p.id === id);
}

/** Options ranked by how many of their "Best when" tags match the answers. */
export function rankOptions(p: Playbook, answers: Record<string, string>) {
  const picked = new Set(Object.values(answers));
  return p.options
    .map((o, i) => ({ ...o, score: o.bestWhen.filter((t) => picked.has(t)).length, i }))
    .sort((a, b) => b.score - a.score || a.i - b.i);
}

export function diagnosisFor(p: Playbook, answers: Record<string, string>) {
  const picked = new Set(Object.values(answers));
  return [p.diagnosis.html, ...p.diagnosis.conditional.filter((c) => c.when.some((w) => picked.has(w))).map((c) => c.html)];
}

/* ---------------- Career & Family track ---------------- */

export interface FamilyPhase {
  id: string;
  order: number;
  title: string;
  summary: string;
  reviewed: string;
  sections: { heading: string; html: string }[];
  checklist: { id: string; text: string }[];
  country: Partial<Record<Jurisdiction, string>>;
}

const slug = (s: string) =>
  norm(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

const COUNTRY_RE = /^(?:pais|country):\s*(\w+)/;

export const FAMILY_PHASES: FamilyPhase[] = files("family")
  .map(({ meta, body }) => {
    const secs = sections(body);
    const country: FamilyPhase["country"] = {};
    for (const s of secs) {
      const c = norm(s.heading).match(COUNTRY_RE)?.[1]?.toUpperCase();
      if (c === "BR" || c === "US") country[c] = md(s.text);
    }
    const checklistText = secs.find((s) => norm(s.heading) === "checklist")?.text ?? "";
    const checklist = checklistText
      .split("\n")
      .map((l) => l.match(/^\s*[-*]\s+(.*)$/)?.[1]?.trim())
      .filter((x): x is string => !!x)
      .map((text) => ({ id: `${String(meta.id)}:${slug(text)}`, text }));
    return {
      id: String(meta.id),
      order: Number(meta.order ?? 99),
      title: String(meta.title ?? meta.id),
      summary: String(meta.summary ?? ""),
      reviewed: dateString(meta.reviewed),
      sections: secs
        .filter((s) => !COUNTRY_RE.test(norm(s.heading)) && norm(s.heading) !== "checklist")
        .map((s) => ({ heading: s.heading, html: md(s.text) })),
      checklist,
      country,
    };
  })
  .sort((a, b) => a.order - b.order);

export function getPhase(id: string) {
  return FAMILY_PHASES.find((p) => p.id === id);
}

/* ---------------- Soft skills ---------------- */

export interface SoftSkill {
  id: string;
  order: number;
  icon: string;
  title: string;
  summary: string;
  sections: { heading: string; html: string; text: string }[];
  /** Exercises under "## Pratique", saved in the same private checklist as Career & Family. */
  practice: { id: string; text: string }[];
}

const PRACTICE = ["pratique", "practice"];

export const SOFT_SKILLS: SoftSkill[] = safeMap(
  files("soft-skills"),
  ({ path, meta, body }) => {
    if (!meta.id) throw new Error(`${path}: needs an id`);
    const id = String(meta.id);
    const secs = sections(body);
    const practiceText = secs.find((s) => PRACTICE.includes(norm(s.heading)))?.text ?? "";
    const practice = practiceText
      .split("\n")
      .map((l) => l.match(/^\s*[-*]\s+(.*)$/)?.[1]?.trim())
      .filter((x): x is string => !!x)
      .map((text) => ({ id: `soft-${id}:${slug(text)}`, text }));
    return {
      id,
      order: Number(meta.order ?? 99),
      icon: String(meta.icon ?? ""),
      title: String(meta.title ?? id),
      summary: String(meta.summary ?? ""),
      sections: secs.filter((s) => !PRACTICE.includes(norm(s.heading))).map((s) => ({ heading: s.heading, html: md(s.text), text: s.text })),
      practice,
    };
  },
  (f) => f.path,
).sort((a, b) => a.order - b.order);

export function getSoftSkill(id: string) {
  return SOFT_SKILLS.find((s) => s.id === id);
}

/* ---------------- Areas of the market ---------------- */

export interface AreaGuide {
  id: AreaId;
  order: number;
  title: string;
  summary: string;
  sections: { heading: string; html: string }[];
}

export const AREA_GUIDES: AreaGuide[] = files("areas")
  .map(({ meta, body }) => ({
    id: String(meta.id) as AreaId,
    order: Number(meta.order ?? 99),
    title: String(meta.title ?? meta.id),
    summary: String(meta.summary ?? ""),
    sections: sections(body).map((s) => ({ heading: s.heading, html: md(s.text) })),
  }))
  .sort((a, b) => a.order - b.order);

export function getAreaGuide(id: string) {
  return AREA_GUIDES.find((a) => a.id === id);
}

/* ---------------- Education topics (courses + cited guidance) ---------------- */

export interface TopicCourse {
  name: string;
  provider: string;
  url: string;
  level: string;
  cost: string;
  language: string;
  why: string;
}

export interface Topic {
  id: string;
  order: number;
  title: string;
  summary: string;
  reviewed: string;
  courses: TopicCourse[];
  sources: { label: string; url: string }[];
  sections: { heading: string; html: string }[];
}

export const TOPICS: Topic[] = files("topics")
  .map(({ path, meta, body }) => {
    const sources = Array.isArray(meta.sources)
      ? (meta.sources as { label?: unknown; url?: unknown }[]).map((s) => ({ label: String(s.label ?? s.url), url: String(s.url) }))
      : [];
    if (sources.length === 0) console.warn(`${path}: topics need public sources`);
    const courses = Array.isArray(meta.courses)
      ? (meta.courses as Record<string, unknown>[])
          .filter((c) => c.name && c.url)
          .map((c) => ({
            name: String(c.name),
            provider: String(c.provider ?? ""),
            url: String(c.url),
            level: String(c.level ?? ""),
            cost: String(c.cost ?? ""),
            language: String(c.language ?? ""),
            why: String(c.why ?? ""),
          }))
      : [];
    return {
      id: String(meta.id),
      order: Number(meta.order ?? 99),
      title: String(meta.title ?? meta.id),
      summary: String(meta.summary ?? ""),
      reviewed: dateString(meta.reviewed),
      courses,
      sources,
      sections: sections(body).map((s) => ({ heading: s.heading, html: md(s.text) })),
    };
  })
  .sort((a, b) => a.order - b.order);

export function getTopic(id: string) {
  return TOPICS.find((t) => t.id === id);
}

/* ---------------- Institutions (public, cited information) ---------------- */

export interface Institution {
  id: string;
  name: string;
  reviewed: string;
  sources: { label: string; url: string }[];
  sections: { heading: string; html: string }[];
}

export const INSTITUTIONS: Institution[] = files("institutions").map(({ path, meta, body }) => {
  const sources = Array.isArray(meta.sources)
    ? (meta.sources as { label?: unknown; url?: unknown }[]).map((s) => ({ label: String(s.label ?? s.url), url: String(s.url) }))
    : [];
  if (sources.length === 0) console.warn(`${path}: institutions need public sources`);
  return {
    id: String(meta.id),
    name: String(meta.name ?? meta.id),
    reviewed: dateString(meta.reviewed),
    sources,
    sections: sections(body).map((s) => ({ heading: s.heading, html: md(s.text) })),
  };
});

/* ---------------- Country help ---------------- */

export interface CountryHelp {
  country: Jurisdiction;
  name: string;
  reviewed: string;
  html: string;
}

export const COUNTRY_HELP: Partial<Record<Jurisdiction, CountryHelp>> = Object.fromEntries(
  files("legal").map(({ meta, body }) => {
    const c = String(meta.country).toUpperCase() as Jurisdiction;
    return [c, { country: c, name: String(meta.name ?? c), reviewed: dateString(meta.reviewed), html: md(body) }];
  }),
);

/* ---------------- Stories ---------------- */

/** The six parts of an interview story, in order (from the group's brief). */
export const STORY_PARTS = ["context", "discovery", "entry", "challenges", "decisions", "advice"] as const;
export type StoryPart = (typeof STORY_PARTS)[number];

const PART_HEADINGS: Record<StoryPart, string[]> = {
  context: ["antes do mercado", "contexto"],
  discovery: ["como conheceu o setor"],
  entry: ["preparacao e entrada"],
  challenges: ["principais desafios", "desafios"],
  decisions: ["decisoes e aprendizados"],
  advice: ["conselhos"],
};

export interface Story {
  id: string;
  title: string;
  summary: string;
  /** interview = real person, published with signed consent. */
  kind: "interview" | "composite" | "illustrative";
  phase?: string;
  displayName?: string;
  role?: string;
  areas: AreaId[];
  stages: CareerStageId[];
  interviewDate?: string;
  parts: Partial<Record<StoryPart, string>>;
  html: string;
}

export const STORIES: Story[] = files("stories")
  .map(({ path, meta, body }): Story | null => {
    let kind = String(meta.kind ?? "illustrative") as Story["kind"];
    // A real person's story is only shown with recorded consent.
    if (kind === "interview" && meta.consent !== true) {
      console.warn(`${path}: interview stories need "consent: true" (signed form kept by the team); hidden`);
      return null;
    }
    if (!["interview", "composite", "illustrative"].includes(kind)) kind = "illustrative";
    const parts: Story["parts"] = {};
    for (const s of sections(body)) {
      const part = STORY_PARTS.find((p) => PART_HEADINGS[p].includes(norm(s.heading)));
      if (part) parts[part] = md(s.text);
    }
    return {
      id: String(meta.id),
      title: String(meta.title ?? meta.id),
      summary: String(meta.summary ?? ""),
      kind,
      phase: meta.phase ? String(meta.phase) : undefined,
      displayName: meta.displayName ? String(meta.displayName) : undefined,
      role: meta.role ? String(meta.role) : undefined,
      areas: list(meta.areas) as AreaId[],
      stages: list(meta.stages) as CareerStageId[],
      interviewDate: dateString(meta.interviewDate) || undefined,
      parts,
      html: md(body),
    };
  })
  .filter((s): s is Story => s !== null);

export const INTERVIEWS = STORIES.filter((s) => s.kind === "interview");

export function getStory(id: string) {
  return STORIES.find((s) => s.id === id);
}
