import type { Opportunity } from "@/content/loader";
import type { AreaId, OnboardingAnswers, OpportunityAlerts } from "@/lib/domain";

type ProfileFit = Pick<OnboardingAnswers, "careerStage" | "areas" | "goals">;

/** Local date as YYYY-MM-DD (opportunity dates are calendar days, not instants). */
export const today = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

/** Still open: the deadline or the (last day of the) event hasn't passed. */
export const isUpcoming = (o: Opportunity, day: string) => (o.endDate || o.date) >= day;

/**
 * Does this opportunity fit her profile? Each audience list that is filled in
 * must match; an empty list means it is open to everyone.
 */
export function fitsProfile(o: Opportunity, p: ProfileFit | null | undefined): boolean {
  if (!p) return false;
  if (o.stages.length && !o.stages.includes(p.careerStage)) return false;
  const areas: AreaId[] = p.areas.filter((a) => a !== "notSure");
  if (o.areas.length && areas.length && !o.areas.some((a) => areas.includes(a))) return false;
  if (o.goals.length && !o.goals.some((g) => p.goals.includes(g))) return false;
  // Something must actually point at her, not just "open to everyone".
  return o.stages.length > 0 || o.areas.length > 0 || o.goals.length > 0;
}

/** New alerts: upcoming opportunities that fit her profile and she hasn't seen yet. */
export function pendingAlerts(list: Opportunity[], p: ProfileFit | null | undefined, alerts: OpportunityAlerts, day: string): Opportunity[] {
  if (!alerts.enabled) return [];
  const seen = new Set(alerts.seen);
  return list.filter((o) => isUpcoming(o, day) && !seen.has(o.id) && fitsProfile(o, p));
}

/** Days from `day` to the opportunity's date (0 = today). */
export function daysUntil(o: Opportunity, day: string): number {
  const ms = Date.parse(`${o.date}T12:00:00Z`) - Date.parse(`${day}T12:00:00Z`);
  return Math.round(ms / 86_400_000);
}

const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);
const icsDay = (d: string) => d.replace(/-/g, "");
const nextDay = (d: string) => {
  const t = new Date(`${d}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
};

/**
 * An .ics file she can add to Google, Apple or Outlook calendar, with a
 * reminder a few days before. All-day, so time zones don't shift it.
 */
export function toIcs(o: Opportunity, deadlineLabel: string): string {
  const title = o.kind === "deadline" ? `${deadlineLabel}: ${o.title}` : o.title;
  const description = [o.summary, o.organizer, o.time ? `${o.time}` : "", o.url].filter(Boolean).join("\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FinHer//Calendario de oportunidades//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${o.id}@finher`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${icsDay(o.date)}`,
    `DTEND;VALUE=DATE:${icsDay(nextDay(o.endDate || o.date))}`,
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(description)}`,
    o.location ? `LOCATION:${icsText(o.location)}` : "",
    o.url ? `URL:${o.url}` : "",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(title)}`,
    `TRIGGER:-P${o.kind === "deadline" ? 3 : 1}D`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
