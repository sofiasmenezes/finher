import { describe, expect, it } from "vitest";
import { renderAnswer } from "./assistant";

describe("renderAnswer", () => {
  it("keeps internal and https links", () => {
    const html = renderAnswer("Veja [Soft skills](/app/soft-skills) e [CFP](https://cadastro.cfp.org.br/).");
    expect(html).toContain('href="/app/soft-skills" data-internal="true"');
    expect(html).toContain('href="https://cadastro.cfp.org.br/" target="_blank"');
  });

  it("drops unsafe links, raw HTML and images", () => {
    const html = renderAnswer('[clique](javascript:alert(1)) <script>alert(1)</script> <img src=x onerror=alert(1)> ![x](https://x.y/a.png)');
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("clique");
  });
});
