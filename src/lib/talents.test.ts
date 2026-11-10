import { describe, expect, it } from "vitest";
import { SAMPLE_TALENTS, TRAILS } from "@/content/catalog";
import { EMPTY_TALENT_FILTERS, filterTalents, publicTalent, type TalentProfile } from "@/lib/domain";

const base = SAMPLE_TALENTS[0];
const hidden: TalentProfile = { ...base, userId: "hidden", visible: false };

describe("filterTalents", () => {
  it("never returns profiles she chose to hide", () => {
    expect(filterTalents([hidden], EMPTY_TALENT_FILTERS)).toEqual([]);
  });

  it("returns every visible profile with no filters", () => {
    expect(filterTalents(SAMPLE_TALENTS, EMPTY_TALENT_FILTERS)).toHaveLength(SAMPLE_TALENTS.length);
  });

  it("matches any option within a filter and all filters together", () => {
    const ids = (f: Partial<typeof EMPTY_TALENT_FILTERS>) => filterTalents(SAMPLE_TALENTS, { ...EMPTY_TALENT_FILTERS, ...f }).map((p) => p.userId);
    expect(ids({ areas: ["research", "fintech"] })).toEqual(["sample-talent-1", "sample-talent-2"]);
    expect(ids({ areas: ["assetManagement"], certifications: ["cea"] })).toEqual(["sample-talent-3"]);
    expect(ids({ languages: ["en", "es"] })).toEqual(["sample-talent-2"]);
    expect(ids({ withCv: true })).not.toContain("sample-talent-2");
  });

  it("searches words and cities without accents or case", () => {
    const ids = (f: Partial<typeof EMPTY_TALENT_FILTERS>) => filterTalents(SAMPLE_TALENTS, { ...EMPTY_TALENT_FILTERS, ...f }).map((p) => p.userId);
    expect(ids({ city: "sao paulo" })).toEqual(["sample-talent-1"]);
    expect(ids({ q: "ELETRICO excel" })).toEqual(["sample-talent-1"]);
  });
});

describe("publicTalent", () => {
  it("hides the CV link unless she chose to share it", () => {
    expect(publicTalent({ ...base, shareCv: false, cvUrl: "https://x.com/cv.pdf" }).cvUrl).toBe("");
    expect(publicTalent({ ...base, shareCv: true, cvUrl: "https://x.com/cv.pdf" }).cvUrl).toBe("https://x.com/cv.pdf");
  });
});

describe("trail materials", () => {
  it("every trail recommends external materials with unique ids and https links", () => {
    const ids = new Set<string>();
    for (const trail of TRAILS) {
      expect(trail.materials.length).toBeGreaterThan(0);
      for (const m of trail.materials) {
        expect(ids.has(m.id)).toBe(false);
        ids.add(m.id);
        if (m.url) expect(m.url).toMatch(/^https:\/\//);
      }
    }
  });
});
