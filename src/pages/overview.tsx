import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, Building2, ExternalLink, HeartHandshake, Info, Pencil, Route, Users } from "lucide-react";
import { SkillsGapChart } from "@/components/charts/skills-gap-chart";
import { Prose } from "@/components/content/blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AREA_GUIDES, getAreaGuide, getPlaybook, INSTITUTIONS } from "@/content/loader";
import { fmt, formatDay, useT, type Messages } from "@/i18n";
import type { OnboardingAnswers, Profile } from "@/lib/domain";
import { buildRecommendations, type NextStep } from "@/lib/path-engine";
import { paths } from "@/lib/routes";

function stepLink(s: NextStep): string {
  switch (s.key) {
    case "trail":
      return paths.learn;
    case "areaGuide":
      return paths.area(s.area);
    case "playbook":
      return paths.playbook(s.id);
    case "family":
      return paths.family;
    case "community":
      return paths.community;
    case "stories":
      return paths.stories;
    default:
      return paths.settings;
  }
}

function stepText(t: Messages, s: NextStep): string {
  const N = t.overview.next;
  switch (s.key) {
    case "trail":
      return fmt(N.trail, { trail: s.trail });
    case "areaGuide":
      return fmt(N.areaGuide, { area: getAreaGuide(s.area)?.title ?? t.onboarding.areas[s.area] });
    case "playbook":
      return fmt(N.playbook, { title: getPlaybook(s.id)?.title ?? s.id });
    default:
      return N[s.key];
  }
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

export default function OverviewPage({ profile }: { profile: Profile & OnboardingAnswers }) {
  const t = useT();
  const V = t.overview;
  const rec = useMemo(() => buildRecommendations(profile), [profile]);
  const areaNames = profile.areas.map((a) => t.onboarding.areas[a]).join(", ");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      {/* Where you are */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-mono text-primary">{V.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            {profile.displayName ? fmt(V.greeting, { name: profile.displayName }) : V.greetingNoName}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="cta">{fmt(V.stageLine, { stage: t.onboarding.stages[profile.careerStage] })}</Badge>
            <Badge variant="secondary">{fmt(V.areasLine, { areas: areaNames })}</Badge>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="self-start sm:self-auto">
          <Link to="/onboarding">
            <Pencil /> {V.editAnswers}
          </Link>
        </Button>
      </header>

      {/* Next steps: an ordered sequence */}
      <section aria-labelledby="next-title" className="rounded-3xl bg-navy p-6 text-navy-foreground sm:p-8">
        <h2 id="next-title" className="text-2xl font-semibold">
          {V.nextTitle}
        </h2>
        <ol className="mt-5 grid gap-3 md:grid-cols-2">
          {rec.nextSteps.map((s, i) => (
            <li key={i}>
              <Link
                to={stepLink(s)}
                className="group flex h-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition-colors hover:bg-white/[0.09]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cta font-display font-semibold text-cta-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 font-medium">{stepText(t, s)}</span>
                <ArrowRight className="size-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <Link
        to={paths.assistant}
        className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{V.assistantTitle}</span>
          <span className="text-sm text-muted-foreground">{V.assistantBody}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {V.assistantCta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle as="h2">{V.gapTitle}</CardTitle>
            <CardDescription>{V.gapSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <SkillsGapChart gaps={rec.gaps} />
          </CardContent>
        </Card>

        <section aria-labelledby="journeys-title" className="flex flex-col gap-3">
          <div>
            <h2 id="journeys-title" className="text-xl font-semibold">
              {V.journeysTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{V.journeysSubtitle}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {rec.journeys.map((j) => {
              const pb = j.kind === "playbook" ? getPlaybook(j.id) : null;
              const to = j.kind === "family" ? paths.family : paths.playbook(j.id);
              const Icon = j.kind === "family" ? HeartHandshake : Route;
              return (
                <li key={j.kind === "family" ? "family" : j.id}>
                  <Link to={to} className="group flex items-start gap-4 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-md">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">{pb ? pb.title : V.familyCardTitle}</span>
                      <span className="text-sm text-muted-foreground">{pb ? pb.summary : V.familyCardBody}</span>
                    </span>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Market areas */}
      <section aria-labelledby="areas-title">
        <h2 id="areas-title" className="text-2xl font-semibold">
          {V.areasTitle}
        </h2>
        <p className="mt-1 text-muted-foreground">{V.areasSubtitle}</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AREA_GUIDES.map((a) => {
            const mine = profile.areas.includes(a.id);
            return (
              <li key={a.id}>
                <Link
                  to={paths.area(a.id)}
                  className="group flex h-full flex-col gap-2 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-lg font-bold">{a.title}</span>
                    {mine && <Badge>{V.yourArea}</Badge>}
                  </span>
                  <span className="text-sm text-muted-foreground">{a.summary}</span>
                  <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary">
                    {V.readGuide} <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Connections (samples until the community opens) */}
      <section aria-labelledby="conn-title">
        <h2 id="conn-title" className="text-2xl font-semibold">
          {V.connectionsTitle}
        </h2>
        <p className="mt-1 text-muted-foreground">{V.connectionsSubtitle}</p>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">{V.mentorsLabel}</h3>
            <ul className="grid gap-3">
              {rec.mentors.map((m) => (
                <li key={m.id} className="flex gap-4 rounded-2xl border bg-card p-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-navy font-display font-bold text-navy-foreground" aria-hidden="true">
                    {initials(m.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      {m.name} <Badge variant="outline">{V.sample}</Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {m.role} · {m.org}
                    </p>
                    <p className="mt-2 text-sm">{m.bio}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">{V.groupsLabel}</h3>
            <ul className="grid gap-3">
              {rec.groups.map((g) => (
                <li key={g.id} className="flex gap-4 rounded-2xl border bg-card p-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                    <Users className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      {g.name} <Badge variant="outline">{V.sampleGroup}</Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">{fmt(V.members, { count: g.members })}</p>
                    <p className="mt-2 text-sm">{g.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* About FinHer */}
      <section aria-labelledby="about-title" className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 id="about-title" className="text-2xl font-semibold">
            {V.aboutTitle}
          </h2>
          <p className="mt-3 max-w-prose text-muted-foreground">{V.aboutBody}</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold">{V.institutionsTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{V.institutionsSubtitle}</p>
          </div>
          {INSTITUTIONS.map((inst) => (
            <article key={inst.id} className="rounded-2xl border bg-card p-5 sm:p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <Building2 className="size-5 text-primary" aria-hidden="true" /> {inst.name}
              </h3>
              <p className="mt-3 flex gap-2 rounded-xl bg-muted p-3 text-sm">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                {V.noAffiliation}
              </p>
              <div className="mt-4 flex flex-col gap-4">
                {inst.sections.map((s) => (
                  <section key={s.heading}>
                    <h4 className="font-semibold">{s.heading}</h4>
                    <Prose html={s.html} className="mt-1 text-sm" />
                  </section>
                ))}
              </div>
              <div className="mt-4 border-t pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.sources}</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm">
                  {inst.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline underline-offset-3">
                        {s.label} <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
                {inst.reviewed && <p className="mt-2 text-xs text-muted-foreground">{fmt(t.legal.reviewed, { date: formatDay(inst.reviewed, t.locale) })}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
