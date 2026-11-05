import { describe, expect, it } from "vitest";
import type { SavedSituation, TherapistRecommendation } from "@/lib/domain";
import { rankBySimilarity, themesFor, withSamples } from "./support";

const situation = (playbookId: string, status: SavedSituation["status"] = "open"): SavedSituation => ({
  id: playbookId,
  playbookId,
  answers: {},
  note: "",
  status,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
});

const rec = (id: string, themes: TherapistRecommendation["themes"], createdAt = "2026-01-01"): TherapistRecommendation => ({
  id,
  authorId: "a",
  authorName: "",
  therapistName: id,
  crp: "",
  modality: "online",
  city: "",
  price: "private",
  contact: "",
  themes,
  comment: "",
  createdAt,
});

describe("themesFor", () => {
  it("uses saved situations first, open before resolved, then goals", () => {
    const themes = themesFor([situation("credit", "resolved"), situation("interrupted")], ["balance", "investOwn"]);
    expect(themes).toEqual(["interrupted", "credit", "family"]);
  });

  it("ignores unknown playbooks and repeats", () => {
    expect(themesFor([situation("unknown"), situation("credit"), situation("credit")])).toEqual(["credit"]);
  });
});

describe("rankBySimilarity", () => {
  it("keeps only matches, most shared themes first, then newest", () => {
    const recs = [rec("a", ["credit"], "2026-03-01"), rec("b", ["credit", "family"]), rec("c", ["burnout"]), rec("d", ["family"], "2026-05-01")];
    expect(rankBySimilarity(recs, ["credit", "family"]).map((r) => r.id)).toEqual(["b", "d", "a"]);
  });

  it("returns nothing without themes", () => {
    expect(rankBySimilarity([rec("a", ["credit"])], [])).toEqual([]);
  });
});

describe("withSamples", () => {
  it("adds samples only while there are fewer than three real ones", () => {
    const samples = [rec("s", ["credit"])];
    expect(withSamples([rec("a", ["credit"])], samples)).toHaveLength(2);
    expect(withSamples([rec("a", ["credit"]), rec("b", ["credit"]), rec("c", ["credit"])], samples)).toHaveLength(3);
  });
});
