import { describe, expect, it } from "vitest";
import { chunk } from "./story-audio";

describe("chunk", () => {
  it("splits text into sentences", () => {
    expect(chunk("Primeira frase. Segunda frase! Terceira?")).toEqual(["Primeira frase.", "Segunda frase!", "Terceira?"]);
  });

  it("breaks long sentences at spaces", () => {
    const long = Array.from({ length: 80 }, () => "palavra").join(" ");
    const parts = chunk(long, 100);
    expect(parts.every((p) => p.length <= 100)).toBe(true);
    expect(parts.join(" ")).toBe(long);
  });
});
