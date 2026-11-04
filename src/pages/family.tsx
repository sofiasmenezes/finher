import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, ShieldCheck } from "lucide-react";
import { CountryHelp, CountrySelect, LegalNotice, Prose } from "@/components/content/blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FAMILY_PHASES, getPhase, STORIES, type Story } from "@/content/loader";
import { fmt, useT } from "@/i18n";
import { backend } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth";
import { paths } from "@/lib/routes";

/** Checklist progress for the signed-in user, with optimistic toggling. */
function useChecklist() {
  const { user } = useAuth();
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (user) backend.getChecklist(user.id).then((ids) => setDone(new Set(ids))).catch(() => {});
  }, [user]);
  const toggle = (id: string, value: boolean) => {
    if (!user) return;
    setDone((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
    backend.setChecklistItem(user.id, id, value).catch(() =>
      // Roll back if the save failed.
      setDone((prev) => {
        const next = new Set(prev);
        if (value) next.delete(id);
        else next.add(id);
        return next;
      }),
    );
  };
  return { done, toggle };
}

function StoryCard({ story }: { story: Story }) {
  const t = useT();
  const F = t.family;
  const real = story.kind === "interview";
  const label = real ? F.verified : story.kind === "composite" ? F.composite : F.illustrative;
  return (
    <article className="rounded-2xl border bg-card p-5 sm:p-6">
      <Badge variant={real ? "default" : "outline"}>
        {real && <ShieldCheck className="size-3.5" aria-hidden="true" />}
        {label}
      </Badge>
      <h3 className="mt-3 text-lg font-bold">{story.title}</h3>
      {real ? (
        <Link to={paths.story(story.id)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {t.journeys.open} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <Prose html={story.html} className="mt-3 text-sm" />
      )}
    </article>
  );
}

export function FamilyPage() {
  const t = useT();
  const F = t.family;
  const { done } = useChecklist();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <header>
        <p className="label-mono text-primary">{F.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{F.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{F.subtitle}</p>
        <p className="mt-4 flex max-w-2xl gap-3 rounded-xl bg-muted p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          {F.inclusive}
        </p>
      </header>

      <ol className="relative flex flex-col gap-4">
        {FAMILY_PHASES.map((p, i) => {
          const total = p.checklist.length;
          const count = p.checklist.filter((c) => done.has(c.id)).length;
          return (
            <li key={p.id}>
              <Link
                to={paths.phase(p.id)}
                className="group flex items-center gap-4 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg sm:gap-6"
              >
                <span
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-full font-display text-lg font-semibold",
                    total > 0 && count === total ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                  )}
                  aria-hidden="true"
                >
                  {total > 0 && count === total ? <Check className="size-5" /> : i + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{fmt(F.phase, { n: i + 1 })}</span>
                  <span className="font-display text-lg font-bold">{p.title}</span>
                  <span className="text-sm text-muted-foreground">{p.summary}</span>
                  {total > 0 && (
                    <span className="mt-2 flex max-w-xs items-center gap-3">
                      <Progress value={(count / total) * 100} label={`${p.title}: ${fmt(F.done, { done: count, total })}`} />
                      <span className="tabular shrink-0 text-xs text-muted-foreground">{fmt(F.done, { done: count, total })}</span>
                    </span>
                  )}
                </span>
                <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="stories-title">
        <h2 id="stories-title" className="text-xl font-semibold">
          {F.stories}
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {STORIES.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
          <p className="flex gap-3 rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
            <BookOpen className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {F.verifiedSoon}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-label={t.countries.label}>
        <CountrySelect id="family-country" />
        <CountryHelp />
      </section>
    </div>
  );
}

export function FamilyPhasePage() {
  const t = useT();
  const F = t.family;
  const { phaseId = "" } = useParams();
  const { jurisdiction } = useAuth();
  const { done, toggle } = useChecklist();
  const phase = getPhase(phaseId);

  if (!phase) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-2xl border border-dashed p-6 text-muted-foreground">{t.notFound.body}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={paths.family}>
            <ArrowLeft /> {F.allPhases}
          </Link>
        </Button>
      </div>
    );
  }

  const idx = FAMILY_PHASES.findIndex((p) => p.id === phase.id);
  const prev = FAMILY_PHASES[idx - 1];
  const next = FAMILY_PHASES[idx + 1];
  const count = phase.checklist.filter((c) => done.has(c.id)).length;
  const countryHtml = phase.country[jurisdiction];
  const stories = STORIES.filter((s) => s.phase === phase.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <Link to={paths.family} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" /> {F.allPhases}
        </Link>
        <p className="mt-4 label-mono text-primary">
          {F.eyebrow} · {fmt(F.phase, { n: idx + 1 })}
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{phase.title}</h1>
        <p className="mt-2 text-muted-foreground">{phase.summary}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          {phase.sections.map((s) => (
            <section key={s.heading} className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-bold">{s.heading}</h2>
              <Prose html={s.html} className="mt-3" />
            </section>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {phase.checklist.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle as="h2">{F.checklist}</CardTitle>
                <p className="text-sm text-muted-foreground">{F.checklistHint}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Progress value={(count / phase.checklist.length) * 100} label={fmt(F.done, { done: count, total: phase.checklist.length })} />
                <ul className="flex flex-col gap-1">
                  {phase.checklist.map((c) => (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 text-sm hover:bg-accent/60">
                        <input
                          id={`check-${c.id}`}
                          type="checkbox"
                          checked={done.has(c.id)}
                          onChange={(e) => toggle(c.id, e.target.checked)}
                          className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
                        />
                        <span className={cn(done.has(c.id) && "text-muted-foreground line-through")}>{c.text}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <section aria-labelledby="rights-title" className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 id="rights-title" className="text-lg font-bold">
              {fmt(t.legal.countryTitle, { country: t.countries[jurisdiction] })}
            </h2>
            <CountrySelect id="phase-country" />
            <LegalNotice reviewed={phase.reviewed} />
            {countryHtml && <Prose html={countryHtml} className="text-sm" />}
          </section>
        </div>
      </div>

      {stories.length > 0 && (
        <section aria-labelledby="phase-stories" className="flex flex-col gap-4">
          <h2 id="phase-stories" className="text-xl font-semibold">
            {F.stories}
          </h2>
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </section>
      )}

      <CountryHelp />

      <nav className="flex flex-col gap-3 sm:flex-row sm:justify-between" aria-label={F.allPhases}>
        {prev ? (
          <Button asChild variant="outline">
            <Link to={paths.phase(prev.id)}>
              <ArrowLeft /> {fmt(F.previous, { title: prev.title })}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button asChild>
            <Link to={paths.phase(next.id)}>
              {fmt(F.next, { title: next.title })} <ArrowRight />
            </Link>
          </Button>
        )}
      </nav>
    </div>
  );
}
