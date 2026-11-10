import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookMarked, Check, ExternalLink, GraduationCap, ListChecks, Plus, Search, Sparkles } from "lucide-react";
import { Prose } from "@/components/content/blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TRAILS, searchUrl, type TrailMaterial, type TrailMaterialType, type TrailMeta } from "@/content/catalog";
import { AREA_GUIDES, TOPICS, getAreaGuide, getTopic } from "@/content/loader";
import { fmt, formatDay, useT, type Messages } from "@/i18n";
import { isOnboarded } from "@/lib/domain";
import { buildRecommendations, type TrailReason } from "@/lib/path-engine";
import { useAuth } from "@/providers/auth";
import { paths } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { TYPE_ICONS } from "@/pages/materials";

const COMING_ICONS = [BookMarked, ListChecks];

/** Types in the order the filter shows them (only those that have materials). */
const TYPE_ORDER: TrailMaterialType[] = ["book", "video", "course", "author", "article", "podcast"];

function reasonText(t: Messages, r: TrailReason) {
  const R = t.education.reasons;
  switch (r.kind) {
    case "gap":
      return fmt(R.gap, { skill: t.onboarding.skills[r.skill] });
    case "area":
      return fmt(R.area, { area: getAreaGuide(r.area)?.title ?? t.onboarding.areas[r.area] });
    case "goal":
      return fmt(R.goal, { goal: t.onboarding.goals[r.goal] });
    default:
      return R.foundation;
  }
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:bg-accent",
      )}
    >
      {active && <Check className="size-3.5" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Where a material's button goes: its official link, or a search for it. */
function MaterialLink({ m }: { m: TrailMaterial }) {
  const E = useT().education;
  const href = m.url || searchUrl(m);
  const label = m.url ? E.open : m.type === "book" ? E.findBook : E.search;
  const Icon = m.url ? ExternalLink : Search;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
      {label} <Icon className="size-3.5" aria-hidden="true" />
      <span className="sr-only">: {m.title}</span>
    </a>
  );
}

/** One line in a trail card: icon, type, title, who made it. */
function MaterialRow({ m }: { m: TrailMaterial }) {
  const E = useT().education;
  const Icon = TYPE_ICONS[m.type];
  return (
    <li className="flex items-start gap-3 border-t py-3 first:border-t-0">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="label-mono text-[0.62rem] text-primary">{E.types[m.type]}</p>
        <p className="font-semibold leading-snug">{m.title}</p>
        <p className="text-sm text-muted-foreground">{m.creator}</p>
      </div>
      <span className="shrink-0 pt-4">
        <MaterialLink m={m} />
      </span>
    </li>
  );
}

function MaterialTile({ m, trail }: { m: TrailMaterial; trail: TrailMeta }) {
  const E = useT().education;
  const Icon = TYPE_ICONS[m.type];
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="label-mono text-[0.62rem] text-primary">{E.types[m.type]}</p>
          <h3 className="font-display text-lg font-bold leading-snug">{m.title}</h3>
          <p className="text-sm text-muted-foreground">{m.creator}</p>
        </div>
      </div>
      <p className="text-sm">{m.why}</p>
      <ul className="flex flex-wrap gap-1.5 text-xs font-medium">
        <li className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">{trail.title}</li>
        {m.free && <li className="rounded-full bg-success/10 px-2.5 py-0.5 text-success">{E.free}</li>}
        {m.language && <li className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">{m.language}</li>}
      </ul>
      <div className="mt-auto border-t pt-3">
        <MaterialLink m={m} />
      </div>
    </article>
  );
}

const isTrail = (v: string | null) => !!v && TRAILS.some((tr) => tr.id === v);
const isType = (v: string | null): v is TrailMaterialType => !!v && (TYPE_ORDER as string[]).includes(v);

export function EducationPage() {
  const t = useT();
  const E = t.education;
  const { profile } = useAuth();
  const rec = useMemo(() => (isOnboarded(profile) ? buildRecommendations(profile) : null), [profile]);
  const [params, setParams] = useSearchParams();
  const trailFilter = isTrail(params.get("tema")) ? params.get("tema") : null;
  const typeFilter = isType(params.get("tipo")) ? (params.get("tipo") as TrailMaterialType) : null;

  const set = (key: "tema" | "tipo", value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const all = TRAILS.flatMap((trail) => trail.materials.map((m) => ({ m, trail })));
  const types = TYPE_ORDER.filter((ty) => all.some(({ m }) => m.type === ty));
  const listed = all.filter(({ m, trail }) => (!trailFilter || trail.id === trailFilter) && (!typeFilter || m.type === typeFilter));

  const showTrail = (id: string) => {
    set("tema", id);
    document.getElementById("library")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <header>
        <p className="label-mono text-primary">{E.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{E.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{E.subtitle}</p>
      </header>

      {rec && (
        <section aria-labelledby="trails-title">
          <h2 id="trails-title" className="text-2xl font-semibold">
            {E.trailsTitle}
          </h2>
          <p className="mt-1 text-muted-foreground">{E.trailsSubtitle}</p>
          <ol className="mt-5 grid gap-4 md:grid-cols-2">
            {rec.trails.map(({ trail, reason }, i) => (
              <li key={trail.id}>
                <Card className="flex h-full flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <span className="tabular font-mono text-sm font-semibold text-primary">0{i + 1}</span>
                      <Badge variant="outline">{fmt(E.count, { count: trail.materials.length })}</Badge>
                    </div>
                    <CardTitle>{trail.title}</CardTitle>
                    <CardDescription>{trail.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto flex flex-col gap-3">
                    <p className="rounded-xl bg-primary/8 px-3 py-2 text-sm">
                      <span className="font-semibold text-primary">{E.why}: </span>
                      {reasonText(t, reason)}
                    </p>
                    <ul>
                      {trail.materials.slice(0, 3).map((m) => (
                        <MaterialRow key={m.id} m={m} />
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => showTrail(trail.id)}
                      className="inline-flex items-center gap-1 self-start text-sm font-semibold text-primary"
                    >
                      {E.seeAll} <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section id="library" aria-labelledby="library-title" className="scroll-mt-24">
        <h2 id="library-title" className="text-2xl font-semibold">
          {E.libraryTitle}
        </h2>
        <p className="mt-1 text-muted-foreground">{E.librarySubtitle}</p>
        <div className="mt-5 flex flex-col gap-4">
          <div role="group" aria-label={E.filterTrail} className="flex flex-wrap items-center gap-2">
            <span className="label-mono mr-1 w-14 text-muted-foreground">{E.filterTrail}</span>
            <FilterChip active={!trailFilter} onClick={() => set("tema", null)}>
              {E.all}
            </FilterChip>
            {TRAILS.map((tr) => (
              <FilterChip key={tr.id} active={trailFilter === tr.id} onClick={() => set("tema", trailFilter === tr.id ? null : tr.id)}>
                {tr.title}
              </FilterChip>
            ))}
          </div>
          <div role="group" aria-label={E.filterType} className="flex flex-wrap items-center gap-2">
            <span className="label-mono mr-1 w-14 text-muted-foreground">{E.filterType}</span>
            <FilterChip active={!typeFilter} onClick={() => set("tipo", null)}>
              {E.all}
            </FilterChip>
            {types.map((ty) => (
              <FilterChip key={ty} active={typeFilter === ty} onClick={() => set("tipo", typeFilter === ty ? null : ty)}>
                {E.types[ty]}
              </FilterChip>
            ))}
          </div>
        </div>
        {listed.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">{E.empty}</p>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {listed.map(({ m, trail }) => (
              <li key={`${trail.id}-${m.id}`}>
                <MaterialTile m={m} trail={trail} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{E.suggestTitle}</p>
            <p className="text-sm text-muted-foreground">{E.suggestBody}</p>
          </div>
          <Button asChild variant="outline" className="self-start sm:self-auto">
            <Link to={`${paths.materials}?indicar=1`}>
              <Plus /> {E.suggestCta}
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{E.disclaimer}</p>
      </section>

      {TOPICS.length > 0 && (
        <section aria-labelledby="topics-title">
          <h2 id="topics-title" className="text-2xl font-semibold">
            {E.topicsTitle}
          </h2>
          <p className="mt-1 text-muted-foreground">{E.topicsSubtitle}</p>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {TOPICS.map((topic) => (
              <li key={topic.id}>
                <Link
                  to={paths.topic(topic.id)}
                  className="group flex h-full flex-col gap-2 rounded-2xl border bg-primary/5 p-5 transition-shadow hover:shadow-md"
                >
                  <Sparkles className="size-5 text-primary" aria-hidden="true" />
                  <span className="font-display text-lg font-bold">{topic.title}</span>
                  <span className="text-sm text-muted-foreground">{topic.summary}</span>
                  <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary">
                    {E.readTopic} <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="guides-title">
        <h2 id="guides-title" className="text-2xl font-semibold">
          {E.areasTitle}
        </h2>
        <p className="mt-1 text-muted-foreground">{E.areasSubtitle}</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AREA_GUIDES.map((a) => (
            <li key={a.id}>
              <Link
                to={paths.area(a.id)}
                className="group flex h-full flex-col gap-2 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <span className="font-display text-lg font-bold">{a.title}</span>
                <span className="text-sm text-muted-foreground">{a.summary}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary">
                  {t.overview.readGuide} <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="coming-title">
        <h2 id="coming-title" className="text-xl font-semibold">
          {E.comingTitle}
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {E.coming.map((c, i) => {
            const Icon = COMING_ICONS[i] ?? BookMarked;
            return (
              <li key={c.title} className="flex flex-col gap-2 rounded-2xl border border-dashed p-5">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.body}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export function AreaGuidePage() {
  const t = useT();
  const { areaId = "" } = useParams();
  const guide = getAreaGuide(areaId);

  if (!guide) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-2xl border border-dashed p-6 text-muted-foreground">{t.notFound.body}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={paths.learn}>
            <ArrowLeft /> {t.education.areaBack}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link to={paths.learn} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" /> {t.education.areaBack}
        </Link>
        <p className="mt-4 label-mono text-primary">{t.education.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{guide.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{guide.summary}</p>
      </div>
      {guide.sections.map((s) => (
        <section key={s.heading} className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-bold">{s.heading}</h2>
          <Prose html={s.html} className="mt-3" />
        </section>
      ))}
    </article>
  );
}

export function TopicPage() {
  const t = useT();
  const E = t.education;
  const { topicId = "" } = useParams();
  const topic = getTopic(topicId);

  if (!topic) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-2xl border border-dashed p-6 text-muted-foreground">{t.notFound.body}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={paths.learn}>
            <ArrowLeft /> {E.areaBack}
          </Link>
        </Button>
      </div>
    );
  }

  // Courses go right after the first section ("why it matters"), before the practical advice.
  const [intro, ...rest] = topic.sections;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link to={paths.learn} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" /> {E.areaBack}
        </Link>
        <p className="mt-4 label-mono text-primary">{E.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{topic.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{topic.summary}</p>
      </div>
      {intro && (
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-bold">{intro.heading}</h2>
          <Prose html={intro.html} className="mt-3" />
        </section>
      )}
      {topic.courses.length > 0 && (
        <section aria-labelledby="courses-title">
          <h2 id="courses-title" className="text-xl font-semibold">
            {E.coursesTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{E.coursesSubtitle}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {topic.courses.map((c) => (
              <li key={c.url} className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
                <GraduationCap className="size-5 text-primary" aria-hidden="true" />
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.provider}</p>
                {c.why && <p className="text-sm">{c.why}</p>}
                <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  {c.level && (
                    <>
                      <dt className="font-semibold text-muted-foreground">{E.courseLevel}</dt>
                      <dd>{c.level}</dd>
                    </>
                  )}
                  {c.cost && (
                    <>
                      <dt className="font-semibold text-muted-foreground">{E.courseCost}</dt>
                      <dd>{c.cost}</dd>
                    </>
                  )}
                  {c.language && (
                    <>
                      <dt className="font-semibold text-muted-foreground">{E.courseLanguage}</dt>
                      <dd>{c.language}</dd>
                    </>
                  )}
                </dl>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary"
                >
                  {E.courseOpen} <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {rest.map((s) => (
        <section key={s.heading} className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-bold">{s.heading}</h2>
          <Prose html={s.html} className="mt-3" />
        </section>
      ))}
      {topic.sources.length > 0 && (
        <footer className="border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.sources}</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            {topic.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline underline-offset-3">
                  {s.label} <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          {topic.reviewed && <p className="mt-2 text-xs text-muted-foreground">{fmt(t.legal.reviewed, { date: formatDay(topic.reviewed, t.locale) })}</p>}
        </footer>
      )}
    </article>
  );
}
