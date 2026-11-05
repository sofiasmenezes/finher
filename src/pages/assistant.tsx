import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowUp, Bot, Loader2, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { fmt, useT } from "@/i18n";
import { askAssistant, MAX_MESSAGE_CHARS, MAX_TURNS, renderAnswer, type AssistantProfile, type ChatTurn } from "@/lib/assistant";
import { isOnboarded } from "@/lib/domain";
import { buildIndex, searchContent, type Entry } from "@/lib/search-index";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth";

interface Message extends ChatTurn {
  /** Offline answers: FinHer content found for the question. */
  links?: Entry[];
  error?: boolean;
}

const CONSENT_KEY = "finher-assistant-consent";

function readConsent() {
  try {
    return sessionStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

function Answer({ text }: { text: string }) {
  const navigate = useNavigate();
  const html = useMemo(() => renderAnswer(text), [text]);
  // Links to other FinHer pages open inside the app instead of reloading it.
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest("a[data-internal]");
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    navigate(a.getAttribute("href")!);
  };
  return <div className="prose-finher text-[0.95rem] [&_a]:font-semibold [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_p+ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function AssistantPage() {
  const t = useT();
  const A = t.assistant;
  const { profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const [consent, setConsent] = useState(readConsent);
  const [useProfile, setUseProfile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState(() => params.get("q") ?? "");
  const [busy, setBusy] = useState(false);
  const index = useMemo(buildIndex, []);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // A question handed over from another page (?q=) fills the box; she still decides to send it.
  useEffect(() => {
    const q = params.get("q");
    if (q) {
      setDraft(q);
      const next = new URLSearchParams(params);
      next.delete("q");
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const sharedProfile = (): AssistantProfile | undefined => {
    if (!useProfile || !isOnboarded(profile)) return undefined;
    return {
      stage: t.onboarding.stages[profile.careerStage],
      areas: profile.areas.map((a) => t.onboarding.areas[a]),
      goals: profile.goals.map((g) => t.onboarding.goals[g]),
    };
  };

  const turns = messages.filter((m) => !m.error).length;
  const tooLong = draft.length > MAX_MESSAGE_CHARS;
  const full = turns >= MAX_TURNS - 1;

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy || tooLong || full) return;
    const history: Message[] = [...messages.filter((m) => !m.error), { role: "user", content: question }];
    setMessages(history);
    setDraft("");
    setBusy(true);
    const result = await askAssistant(
      history.map(({ role, content }) => ({ role, content })),
      sharedProfile(),
    );
    if (result.ok) {
      setMessages([...history, { role: "assistant", content: result.text }]);
    } else if (result.reason === "unavailable") {
      const links = searchContent(index, question);
      setMessages([...history, { role: "assistant", content: links.length ? A.offlineNote : A.offlineEmpty, links }]);
    } else {
      setMessages([...history, { role: "assistant", content: A.error, error: true }]);
    }
    setBusy(false);
    inputRef.current?.focus();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    send(draft);
  }

  const accept = () => {
    setConsent(true);
    try {
      sessionStorage.setItem(CONSENT_KEY, "1");
    } catch {
      /* the notice just shows again next time */
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <p className="label-mono flex items-center gap-2 text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" /> {A.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{A.title}</h1>
        <p className="mt-3 text-muted-foreground">{A.subtitle}</p>
      </header>

      {!consent ? (
        <section aria-labelledby="consent-title" className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 id="consent-title" className="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" /> {A.consentTitle}
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {A.consentItems.map((item, i) => (
              <li key={item} className="flex gap-3 text-sm">
                <span className="tabular text-sm font-semibold text-primary">{String(i + 1).padStart(2, "0")}</span>
                {item}
              </li>
            ))}
          </ul>
          <Button className="mt-6" onClick={accept}>
            {A.consentAccept} <ArrowRight />
          </Button>
        </section>
      ) : (
        <>
          {messages.length === 0 ? (
            <section aria-labelledby="suggestions-title">
              <h2 id="suggestions-title" className="label-mono text-muted-foreground">
                {A.suggestionsTitle}
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {A.suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => send(s)}
                      className="h-full w-full rounded-2xl border bg-card p-4 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <ol aria-live="polite" className="flex flex-col gap-4">
              {messages.map((m, i) => (
                <li key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                  {m.role === "assistant" && (
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
                      <Bot className="size-4.5" />
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "border bg-card",
                      m.error && "border-destructive/40",
                    )}
                  >
                    <p className="sr-only">{m.role === "user" ? A.you : A.bot}:</p>
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap text-[0.95rem]">{m.content}</p>
                    ) : (
                      <Answer text={m.content} />
                    )}
                    {m.links && m.links.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-2">
                        {m.links.map((l) => (
                          <li key={l.to}>
                            <Link to={l.to} className="group flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5 hover:bg-accent">
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className="label-mono text-[0.62rem] text-primary">{t.app.search.kinds[l.kind]}</span>
                                <span className="text-sm font-semibold">{l.title}</span>
                              </span>
                              <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
              {busy && (
                <li className="flex items-center gap-3 text-sm text-muted-foreground" role="status">
                  <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
                    <Loader2 className="size-4 animate-spin" />
                  </span>
                  {A.sending}
                </li>
              )}
            </ol>
          )}
          <div ref={endRef} />

          <form onSubmit={submit} className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-[0_12px_32px_-20px_rgb(42_15_34/0.35)] lg:bottom-14">
            <label htmlFor="assistant-input" className="sr-only">
              {A.placeholder}
            </label>
            <div className="flex items-end gap-2">
              <Textarea
                id="assistant-input"
                ref={inputRef}
                value={draft}
                rows={2}
                placeholder={A.placeholder}
                aria-invalid={tooLong || undefined}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                className="min-h-14 resize-none border-none bg-transparent px-2 py-2 focus-visible:ring-0"
              />
              <Button type="submit" size="icon" disabled={busy || !draft.trim() || tooLong || full} aria-label={A.send}>
                {busy ? <Loader2 className="animate-spin" /> : <ArrowUp />}
              </Button>
            </div>
            {(tooLong || full) && (
              <p role="alert" className="px-2 text-sm font-medium text-destructive">
                {tooLong ? fmt(A.tooLong, { max: MAX_MESSAGE_CHARS }) : A.limit}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-2 pt-2">
              {isOnboarded(profile) ? (
                <label className="flex max-w-md items-start gap-2 text-xs font-medium">
                  <input type="checkbox" checked={useProfile} onChange={(e) => setUseProfile(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
                  <span>
                    {A.useProfile}
                    {useProfile && <span className="mt-0.5 block font-normal text-muted-foreground">{A.useProfileHint}</span>}
                  </span>
                </label>
              ) : (
                <span />
              )}
              {messages.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setMessages([])}>
                  <RotateCcw /> {A.newChat}
                </Button>
              )}
            </div>
          </form>
          <p className="text-center text-xs text-muted-foreground">{A.disclaimer}</p>
        </>
      )}
    </div>
  );
}
