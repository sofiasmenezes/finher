import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Coffee, HandHeart, HeartHandshake, MessageCircleQuestion, Plus, ShieldCheck, Users, UsersRound, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GROUPS, MENTORS, SAMPLE_THERAPISTS } from "@/content/catalog";
import { fmt, useT } from "@/i18n";
import { paths } from "@/lib/routes";
import { rankBySimilarity, themesFor, withSamples } from "@/lib/support";
import { useTherapists } from "@/pages/support";
import { useAuth } from "@/providers/auth";

const PLANNED_ICONS: LucideIcon[] = [MessageCircleQuestion, Users, UsersRound, HandHeart, CalendarDays, Coffee];

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

/** The live part of the community today: psychologists recommended by members. */
function TherapistsSection() {
  const t = useT();
  const C = t.community;
  const { profile } = useAuth();
  const { recs, saved } = useTherapists();
  const all = useMemo(() => withSamples(recs ?? [], SAMPLE_THERAPISTS), [recs]);
  const themes = useMemo(() => themesFor(saved, profile?.goals ?? []), [saved, profile?.goals]);
  const shown = (rankBySimilarity(all, themes).length ? rankBySimilarity(all, themes) : all).slice(0, 3);
  const real = recs?.length ?? 0;

  return (
    <section aria-labelledby="therapists-title" className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
            <HeartHandshake className="size-5" />
          </span>
          <div>
            <h2 id="therapists-title" className="text-2xl font-semibold">
              {C.therapistsTitle}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{C.therapistsBody}</p>
            {real > 0 && <p className="label-mono mt-2 text-primary">{fmt(C.therapistsCount, { count: real })}</p>}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`${paths.support}?indicar=1`}>
              <Plus /> {C.therapistsAdd}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to={paths.support}>
              {C.therapistsOpen} <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
      <ul className="mt-5 grid gap-3 md:grid-cols-3">
        {shown.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 rounded-xl bg-muted p-4 text-sm">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              {r.therapistName} {r.sample && <Badge variant="outline">{t.support.sample}</Badge>}
            </p>
            <p className="text-muted-foreground">
              {t.support.modalities[r.modality]} · {t.support.prices[r.price]}
            </p>
            <p className="text-xs text-muted-foreground">{r.themes.map((th) => t.support.themes[th]).join(" · ")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function CommunityPage() {
  const t = useT();
  const C = t.community;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <header>
        <p className="label-mono text-primary">{C.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{C.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{C.subtitle}</p>
        <p role="note" className="mt-5 max-w-2xl rounded-xl border border-cta/50 bg-cta/10 p-4 text-sm font-medium">
          {C.soonNote}
        </p>
      </header>

      <TherapistsSection />

      <section aria-labelledby="planned-title">
        <h2 id="planned-title" className="text-2xl font-semibold">
          {C.plannedTitle}
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {C.planned.map((p, i) => {
            const Icon = PLANNED_ICONS[i] ?? Users;
            return (
              <li key={p.title} className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <p className="font-semibold">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="samples-title">
        <h2 id="samples-title" className="text-2xl font-semibold">
          {C.samplesTitle}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{C.samplesNote}</p>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <ul className="grid gap-3">
            {MENTORS.map((m) => (
              <li key={m.id} className="flex gap-4 rounded-2xl border bg-card p-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-navy font-display font-bold text-navy-foreground" aria-hidden="true">
                  {initials(m.name)}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {m.name} <Badge variant="outline">{t.overview.sample}</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {m.role} · {m.org}
                  </p>
                  <p className="mt-2 text-sm">{m.bio}</p>
                </div>
              </li>
            ))}
          </ul>
          <ul className="grid gap-3">
            {GROUPS.map((g) => (
              <li key={g.id} className="flex gap-4 rounded-2xl border bg-card p-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                  <Users className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {g.name} <Badge variant="outline">{t.overview.sampleGroup}</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">{fmt(t.overview.members, { count: g.members })}</p>
                  <p className="mt-2 text-sm">{g.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="safety-title" className="flex gap-4 rounded-2xl bg-muted p-5 sm:p-6">
        <ShieldCheck className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 id="safety-title" className="font-bold">
            {C.safetyTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{C.safetyBody}</p>
        </div>
      </section>
    </div>
  );
}
