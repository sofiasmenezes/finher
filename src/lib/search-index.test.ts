import { describe, expect, it } from "vitest";
import { buildIndex, searchContent } from "./search-index";

describe("searchContent", () => {
  const index = buildIndex();

  it("finds the soft skill guide for a dress question", () => {
    const [first] = searchContent(index, "Como me vestir para uma entrevista?");
    expect(first?.to).toBe("/app/soft-skills/vestimenta");
  });

  it("finds the salary playbook", () => {
    expect(searchContent(index, "quero negociar meu salário").map((e) => e.to)).toContain("/app/challenges/pay-negotiation");
  });

  it("returns nothing for empty questions", () => {
    expect(searchContent(index, "e o que")).toEqual([]);
  });
});
