import { describe, expect, it } from "vitest";
import type { Opportunity } from "@/content/loader";
import { daysUntil, fitsProfile, isUpcoming, pendingAlerts, toIcs } from "./opportunities";

const opp = (over: Partial<Opportunity> = {}): Opportunity => ({
  id: "o1",
  kind: "deadline",
  title: "Estágio",
  organizer: "Gestora",
  date: "2026-12-01",
  endDate: "",
  time: "",
  location: "Online",
  url: "",
  summary: "Resumo",
  html: "",
  stages: [],
  areas: [],
  goals: [],
  example: false,
  ...over,
});

const profile = { careerStage: "internship" as const, areas: ["assetManagement" as const], goals: ["getInternship" as const] };

describe("fitsProfile", () => {
  it("matches when every filled audience list matches", () => {
    expect(fitsProfile(opp({ stages: ["internship"], areas: ["assetManagement", "research"] }), profile)).toBe(true);
    expect(fitsProfile(opp({ stages: ["growing"] }), profile)).toBe(false);
    expect(fitsProfile(opp({ stages: ["internship"], goals: ["leadership"] }), profile)).toBe(false);
  });

  it("does not alert for opportunities open to everyone, or without a profile", () => {
    expect(fitsProfile(opp(), profile)).toBe(false);
    expect(fitsProfile(opp({ stages: ["internship"] }), null)).toBe(false);
  });

  it("ignores area filters when she is not sure of her area yet", () => {
    expect(fitsProfile(opp({ areas: ["trading"], goals: ["getInternship"] }), { ...profile, areas: ["notSure"] })).toBe(true);
  });
});

describe("pendingAlerts", () => {
  const list = [opp({ id: "a", stages: ["internship"] }), opp({ id: "b", stages: ["internship"], date: "2026-10-01" }), opp({ id: "c", goals: ["getInternship"] })];

  it("returns upcoming, unseen matches only when alerts are on", () => {
    expect(pendingAlerts(list, profile, { enabled: true, seen: ["c"] }, "2026-11-07").map((o) => o.id)).toEqual(["a"]);
    expect(pendingAlerts(list, profile, { enabled: false, seen: [] }, "2026-11-07")).toEqual([]);
  });
});

describe("dates", () => {
  it("keeps multi-day events upcoming until their last day", () => {
    expect(isUpcoming(opp({ date: "2026-11-01", endDate: "2026-11-08" }), "2026-11-07")).toBe(true);
    expect(isUpcoming(opp({ date: "2026-11-01" }), "2026-11-07")).toBe(false);
    expect(daysUntil(opp({ date: "2026-11-10" }), "2026-11-07")).toBe(3);
  });
});

describe("toIcs", () => {
  it("creates an all-day event with a reminder", () => {
    const ics = toIcs(opp({ title: "Estágio, verão; 2027" }), "Prazo");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261201");
    expect(ics).toContain("DTEND;VALUE=DATE:20261202");
    expect(ics).toContain("SUMMARY:Prazo: Estágio\\, verão\\; 2027");
    expect(ics).toContain("TRIGGER:-P3D");
  });
});
