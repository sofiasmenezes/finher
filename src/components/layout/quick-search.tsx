import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AREA_GUIDES, FAMILY_PHASES, INTERVIEWS, PLAYBOOKS, TOPICS } from "@/content/loader";
import { fmt, useT } from "@/i18n";
import { paths } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Kind = "area" | "topic" | "playbook" | "phase" | "story";
interface Entry {
  kind: Kind;
  title: string;
  summary: string;
  to: string;
  haystack: string;
}

/** Lowercase and strip accents so "negociacao" finds "negociação". */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function buildIndex(): Entry[] {
  const entry = (kind: Kind, title: string, summary: string, to: string): Entry => ({
    kind,
    title,
    summary,
    to,
    haystack: fold(`${title} ${summary}`),
  });
  return [
    ...PLAYBOOKS.map((p) => entry("playbook", p.title, p.summary, paths.playbook(p.id))),
    ...AREA_GUIDES.map((a) => entry("area", a.title, a.summary, paths.area(a.id))),
    ...TOPICS.map((t) => entry("topic", t.title, t.summary, paths.topic(t.id))),
    ...FAMILY_PHASES.map((f) => entry("phase", f.title, f.summary, paths.phase(f.id))),
    ...INTERVIEWS.map((s) => entry("story", s.title, s.summary, paths.story(s.id))),
  ];
}

/** Search across all content. Opens from the header button or with Ctrl/⌘ + K. */
export function QuickSearch({ className }: { className?: string }) {
  const t = useT();
  const S = t.app.search;
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const index = useMemo(buildIndex, []);

  const results = useMemo(() => {
    const words = fold(query).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return index.filter((e) => words.every((w) => e.haystack.includes(w))).slice(0, 8);
  }, [index, query]);

  const open = () => {
    setQuery("");
    setActive(0);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const go = (e: Entry) => {
    close();
    navigate(e.to);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={cn(
          "flex h-10 items-center gap-2 rounded-full border border-input bg-card px-4 text-sm text-muted-foreground transition-colors hover:border-primary",
          className,
        )}
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden flex-1 text-left sm:inline">{S.placeholder}</span>
        <span className="sm:hidden">{S.open}</span>
        <kbd className="hidden font-mono text-xs sm:inline">⌘K</kbd>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={S.label}
        onClick={(e) => e.target === dialogRef.current && close()}
        className="m-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] rounded-2xl border bg-card p-0 text-foreground shadow-2xl backdrop:bg-navy/50"
      >
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && results[active]) {
                go(results[active]);
              }
            }}
            placeholder={S.placeholder}
            aria-label={S.label}
            aria-controls="quick-search-results"
            aria-activedescendant={results[active] ? `qs-${active}` : undefined}
            role="combobox"
            aria-expanded={results.length > 0}
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <Button variant="ghost" size="icon" onClick={close} aria-label={S.close}>
            <X />
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query.trim() ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">{S.hint}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">{fmt(S.empty, { q: query.trim() })}</p>
          ) : (
            <ul id="quick-search-results" role="listbox" aria-label={S.label}>
              {results.map((r, i) => (
                <li
                  key={r.to}
                  id={`qs-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3", i === active && "bg-accent")}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="label-mono text-[0.65rem] text-primary">{S.kinds[r.kind]}</span>
                    <span className="font-semibold">{r.title}</span>
                    <span className="truncate text-sm text-muted-foreground">{r.summary}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </>
  );
}
