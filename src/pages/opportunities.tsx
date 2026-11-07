import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, BellOff, CalendarPlus, ChevronLeft, ChevronRight, Clock, ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OPPORTUNITIES, type Opportunity } from "@/content/loader";
import { fmt, useT } from "@/i18n";
import { isOnboarded } from "@/lib/domain";
import { daysUntil, fitsProfile, isUpcoming, toIcs, today } from "@/lib/opportunities";
import { paths } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAlerts } from "@/providers/alerts";
import { useAuth } from "@/providers/auth";

type Filter = "all" | "event" | "deadline" | "mine";

const monthKey = (d: string) => d.slice(0, 7);
const shiftMonth = (key: string, by: number) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

function download(o: Opportunity, deadlineLabel: string) {
  const blob = new Blob([toIcs(o, deadlineLabel)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finher-${o.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function OpportunityCard({ o, day, isNew, fits }: { o: Opportunity; day: string; isNew: boolean; fits: boolean }) {
  const t = useT();
  const O = t.opportunities;
  const d = new Date(`${o.date}T12:00:00`);
  const left = daysUntil(o, day);
  const upcoming = isUpcoming(o, day);

  return (
    <article id={`op-${o.id}`} className={cn("flex gap-4 rounded-2xl border bg-card p-4 sm:p-5", !upcoming && "opacity-60")}>
      <div className={cn("flex w-14 shrink-0 flex-col items-center rounded-xl py-2", o.kind === "deadline" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
        <span className="font-display text-2xl font-semibold leading-none">{d.getDate()}</span>
        <span className="label-mono mt-1 text-[0.62rem]">{d.toLocaleDateString(t.locale, { month: "short" }).replace(".", "")}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={o.kind === "deadline" ? "default" : "secondary"}>{O.kinds[o.kind]}</Badge>
          {isNew && <Badge variant="cta">{O.newBadge}</Badge>}
          {fits && !isNew && <Badge variant="cta">{O.fitBadge}</Badge>}
          {o.example && <Badge variant="outline">{O.example}</Badge>}
        </div>
        <h3 className="font-display text-lg font-bold leading-snug">{o.title}</h3>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {o.organizer && <span className="font-medium text-foreground">{o.organizer}</span>}
          {o.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" /> {o.location}
            </span>
          )}
          {o.time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" /> {o.time}
            </span>
          )}
        </p>
        <p className="text-sm">{o.summary}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {upcoming && (
            <span className="label-mono mr-1 text-primary">
              {left <= 0 ? O.isToday : left === 1 ? O.oneDayLeft : fmt(O.daysLeft, { count: left })}
            </span>
          )}
          {upcoming && (
            <Button variant="outline" size="sm" onClick={() => download(o, O.deadlinePrefix)}>
              <CalendarPlus /> {O.addToCalendar}
            </Button>
          )}
          {o.url && (
            <Button asChild variant="ghost" size="sm">
              <a href={o.url} target="_blank" rel="noopener noreferrer">
                {O.openLink} <ExternalLink />
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function MonthGrid({
  month,
  items,
  day,
  selected,
  onSelect,
  onMonth,
}: {
  month: string;
  items: Opportunity[];
  day: string;
  selected: string | null;
  onSelect: (d: string | null) => void;
  onMonth: (m: string) => void;
}) {
  const t = useT();
  const O = t.opportunities;
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const days = new Date(y, m, 0).getDate();
  const byDay = new Map<string, Opportunity[]>();
  for (const o of items) byDay.set(o.date, [...(byDay.get(o.date) ?? []), o]);
  const cells: (string | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => onMonth(shiftMonth(month, -1))} aria-label={O.prevMonth}>
          <ChevronLeft />
        </Button>
        <p className="font-display text-lg font-semibold first-letter:uppercase" aria-live="polite">
          {first.toLocaleDateString(t.locale, { month: "long", year: "numeric" })}
        </p>
        <Button variant="ghost" size="icon" onClick={() => onMonth(shiftMonth(month, 1))} aria-label={O.nextMonth}>
          <ChevronRight />
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {O.weekdays.map((w, i) => (
          <span key={i} className="label-mono py-1 text-[0.62rem] text-muted-foreground" aria-hidden="true">
            {w}
          </span>
        ))}
        {cells.map((c, i) => {
          if (!c) return <span key={`e${i}`} />;
          const list = byDay.get(c) ?? [];
          const has = list.length > 0;
          const deadline = list.some((o) => o.kind === "deadline");
          return (
            <button
              key={c}
              type="button"
              disabled={!has}
              aria-pressed={selected === c}
              aria-label={has ? `${Number(c.slice(8))}: ${list.map((o) => o.title).join(", ")}` : String(Number(c.slice(8)))}
              onClick={() => onSelect(selected === c ? null : c)}
              className={cn(
                "relative grid aspect-square place-items-center rounded-full text-sm tabular transition-colors",
                c === day && "font-bold text-primary ring-1 ring-primary/40",
                has ? "cursor-pointer font-semibold hover:bg-accent" : "text-muted-foreground",
                selected === c && "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              {Number(c.slice(8))}
              {has && (
                <span
                  className={cn("absolute bottom-1 size-1.5 rounded-full", selected === c ? "bg-primary-foreground" : deadline ? "bg-primary" : "bg-cta")}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" /> {O.kinds.deadline}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-cta" aria-hidden="true" /> {O.kinds.event}
        </span>
        {monthKey(day) !== month && (
          <button type="button" className="ml-auto font-semibold text-primary" onClick={() => onMonth(monthKey(day))}>
            {O.today}
          </button>
        )}
      </div>
    </div>
  );
}

export function OpportunitiesPage() {
  const t = useT();
  const O = t.opportunities;
  const { profile } = useAuth();
  const { alerts, pending, setEnabled, markSeen } = useAlerts();
  const day = today();
  const [filter, setFilter] = useState<Filter>("all");
  const [month, setMonth] = useState(monthKey(day));
  const [selected, setSelected] = useState<string | null>(null);
  const me = isOnboarded(profile) ? profile : null;

  // Show the "Nova" badge on what was new when she opened the page, then count it as seen.
  const [newIds] = useState(() => new Set(pending.map((o) => o.id)));
  useEffect(() => {
    if (pending.length) markSeen(pending.map((o) => o.id));
  }, [pending, markSeen]);

  const filtered = useMemo(
    () =>
      OPPORTUNITIES.filter((o) =>
        filter === "all" ? true : filter === "mine" ? fitsProfile(o, me) : o.kind === filter,
      ),
    [filter, me],
  );
  const inMonth = filtered.filter((o) => monthKey(o.date) === month || (o.endDate && monthKey(o.endDate) === month));
  const shown = selected ? inMonth.filter((o) => o.date === selected) : inMonth;
  const upcoming = shown.filter((o) => isUpcoming(o, day));
  const past = shown.filter((o) => !isUpcoming(o, day));
  const newCount = newIds.size;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header>
        <Link to={paths.community} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" /> {O.back}
        </Link>
        <p className="label-mono mt-4 text-primary">{O.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{O.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{O.subtitle}</p>
      </header>

      <section
        aria-labelledby="alerts-title"
        className={cn("flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:p-6", alerts.enabled ? "border-primary/30 bg-primary/5" : "bg-card")}
      >
        <span
          className={cn("grid size-12 shrink-0 place-items-center rounded-full", alerts.enabled ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}
          aria-hidden="true"
        >
          {alerts.enabled ? <Bell className="size-5" /> : <BellOff className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="alerts-title" className="flex flex-wrap items-center gap-2 font-bold">
            {O.alertsTitle}
            {alerts.enabled && newCount > 0 && <Badge variant="cta">{newCount === 1 ? O.alertsNewOne : fmt(O.alertsNew, { count: newCount })}</Badge>}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{alerts.enabled ? O.alertsBodyOn : O.alertsBodyOff}</p>
        </div>
        {alerts.enabled ? (
          <Button variant="ghost" size="sm" onClick={() => setEnabled(false)}>
            <BellOff /> {O.alertsTurnOff}
          </Button>
        ) : (
          <Button onClick={() => setEnabled(true)}>
            <Bell /> {O.alertsOff}
          </Button>
        )}
      </section>

      <div role="group" aria-label={O.filterLabel} className="flex flex-wrap gap-2">
        {(["all", "deadline", "event", "mine"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => {
              setFilter(f);
              setSelected(null);
            }}
            className={cn(
              "inline-flex min-h-9 items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:bg-accent",
            )}
          >
            {O.filters[f]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
        <div className="lg:sticky lg:top-20">
          <MonthGrid
            month={month}
            items={filtered}
            day={day}
            selected={selected}
            onSelect={setSelected}
            onMonth={(m) => {
              setMonth(m);
              setSelected(null);
            }}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          {shown.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">{O.monthEmpty}</p>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section aria-labelledby="upcoming-title" className="flex flex-col gap-3">
                  <h2 id="upcoming-title" className="label-mono text-muted-foreground">
                    {O.upcomingTitle}
                  </h2>
                  {upcoming.map((o) => (
                    <OpportunityCard key={o.id} o={o} day={day} isNew={alerts.enabled && newIds.has(o.id)} fits={fitsProfile(o, me)} />
                  ))}
                </section>
              )}
              {past.length > 0 && (
                <section aria-labelledby="past-title" className="flex flex-col gap-3">
                  <h2 id="past-title" className="label-mono text-muted-foreground">
                    {O.pastTitle}
                  </h2>
                  {past.map((o) => (
                    <OpportunityCard key={o.id} o={o} day={day} isNew={false} fits={false} />
                  ))}
                </section>
              )}
            </>
          )}
          {OPPORTUNITIES.some((o) => o.example) && <p className="text-xs text-muted-foreground">{O.exampleNote}</p>}
          <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">{O.suggest}</p>
        </div>
      </div>
    </div>
  );
}
