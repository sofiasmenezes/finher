import { Marked } from "marked";
import { backend } from "@/lib/backend";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Only what she chooses to share when "Personalizar com meu perfil" is on. */
export interface AssistantProfile {
  stage: string;
  areas: string[];
  goals: string[];
}

export const MAX_MESSAGE_CHARS = 2000;
export const MAX_TURNS = 20;

export type AssistantResult = { ok: true; text: string } | { ok: false; reason: "unavailable" | "error" };

/** Ask the FinHer assistant (POST /api/assistant). "unavailable" means: use the offline answer. */
export async function askAssistant(messages: ChatTurn[], profile?: AssistantProfile): Promise<AssistantResult> {
  try {
    const token = await backend.getAccessToken();
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ messages, profile }),
    });
    // 404: no serverless functions here (local dev, single-file build). 503: no API key configured.
    if (res.status === 404 || res.status === 405 || res.status === 503) return { ok: false, reason: "unavailable" };
    if (!res.ok) return { ok: false, reason: "error" };
    const data = (await res.json()) as { text?: unknown };
    return typeof data.text === "string" ? { ok: true, text: data.text } : { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Markdown from the model → safe HTML: raw HTML is dropped, and links are kept
 * only when they point inside FinHer ("/app/...") or to an https page.
 */
const answerMd = new Marked({
  renderer: {
    html: () => "",
    image: () => "",
    link({ href, tokens }) {
      const label = this.parser.parseInline(tokens);
      if (/^\/app(\/|$)/.test(href)) return `<a href="${href}" data-internal="true">${label}</a>`;
      if (/^https:\/\/[^\s"]+$/.test(href)) return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow">${label}</a>`;
      return label;
    },
  },
});

export function renderAnswer(markdown: string): string {
  return answerMd.parse(markdown, { async: false });
}
