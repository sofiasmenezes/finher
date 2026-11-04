import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookMarked, Bot, Clock, ExternalLink, GraduationCap, Layers, ListChecks, Sparkles } from "lucide-react";
import { Prose } from "@/components/content/blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AREA_GUIDES, TOPICS, getAreaGuide, getTopic } from "@/content/loader";
import { fmt, formatDay, useT, type Messages } from "@/i18n";
import { isOnboarded } from "@/lib/domain";
import { buildRecommendations, type TrailReason } from "@/lib/path-engine";
import { useAuth } from "@/providers/auth";
import { paths } from "@/lib/routes";

const COMING_ICONS = [BookMarked, ListChecks, Bot];

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

export function EducationPage() {
  const t = useT();
  const E = t.education;
  const { profile } = useAuth();
  const rec = useMemo(() => (isOnboarded(profile) ? buildRecommendations(profile) : null), [profile]);

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
                    <span className="tabular font-mono text-sm font-semibold text-primary">0{i + 1}</span>
                    <CardTitle>{trail.title}</CardTitle>
                    <CardDescription>{trail.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto flex flex-col gap-4">
                    <p className="rounded-xl bg-primary/8 px-3 py-2 text-sm">
                      <span className="font-semibold text-primary">{E.why}: </span>
                      {reasonText(t, reason)}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="size-4" aria-hidden="true" /> {fmt(E.lessons, { count: trail.lessons })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-4" aria-hidden="true" /> {fmt(E.minutes, { count: trail.minutes })}
                        </span>
                      </p>
                      <Badge variant="outline">{E.lessonsSoon}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      )}

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
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
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
