import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Banknote,
  Check,
  CircleCheck,
  Loader2,
  MessageSquareQuote,
  MessagesSquare,
  Mic,
  Network,
  ShieldQuestion,
  HeartHandshake,
  Sparkles,
  Trash2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { CountryHelp, CountrySelect, Prose, SensitiveNote } from "@/components/content/blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { diagnosisFor, getPlaybook, PLAYBOOKS, rankOptions, type Playbook } from "@/content/loader";
import { fmt, useT } from "@/i18n";
import { backend } from "@/lib/backend";
import type { SavedSituation } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth";
import { paths } from "@/lib/routes";

const AREA_ICONS: Record<string, LucideIcon> = {
  voice: Mic,
  pay: Banknote,
  credit: Award,
  advancement: TrendingUp,
  network: Network,
};

const COMING_ICONS: LucideIcon[] = [MessagesSquare, ShieldQuestion];

const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

function StatusPill({ status }: { status: SavedSituation["status"] }) {
  const t = useT();
  return status === "resolved" ? (
    <Badge>
      <CircleCheck className="size-3.5" aria-hidden="true" /> {t.navigator.resolved}
    </Badge>
  ) : (
    <Badge variant="cta">{t.navigator.inProgress}</Badge>
  );
}

/* ------------------------------ List page ------------------------------ */

export function NavigatorPage() {
  const t = useT();
  const N = t.navigator;
  const { user } = useAuth();
  const [saved, setSaved] = useState<SavedSituation[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    backend
      .listSituations(user.id)
      .then(setSaved)
      .catch(() => setError(true));
  }, [user]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <header>
        <p className="label-mono text-primary">{N.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{N.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{N.subtitle}</p>
        <SensitiveNote className="mt-6 max-w-2xl" />
      </header>

      <Link
        to={paths.support}
        className="group flex flex-col gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-5 transition-shadow hover:shadow-lg sm:flex-row sm:items-center sm:p-6"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <HeartHandshake className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-display text-lg font-bold">{t.support.cardTitle}</span>
          <span className="text-sm text-muted-foreground">{t.support.cardBody}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {N.supportLink} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </Link>

      <section aria-labelledby="choose-title">
        <h2 id="choose-title" className="text-xl font-semibold">
          {N.choose}
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {PLAYBOOKS.map((p) => {
            const Icon = AREA_ICONS[p.area] ?? MessageSquareQuote;
            return (
              <li key={p.id}>
                <Link
                  to={paths.playbook(p.id)}
                  className="group flex h-full gap-4 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-display text-lg font-bold leading-snug">{p.title}</span>
                    <span className="text-sm text-muted-foreground">{p.summary}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      {N.start} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="saved-title">
        <h2 id="saved-title" className="text-xl font-semibold">
          {N.saved}
        </h2>
        {error ? (
          <p role="alert" className="mt-4 text-sm font-medium text-destructive">
            {t.auth.errors.generic}
          </p>
        ) : saved === null ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t.common.loading}
          </p>
        ) : saved.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">{N.savedEmpty}</p>
        ) : (
          <ul className="mt-4 divide-y rounded-2xl border bg-card">
            {saved.map((s) => {
              const p = getPlaybook(s.playbookId);
              return (
                <li key={s.id}>
                  <Link to={paths.playbook(s.playbookId, s.id)} className="flex items-center gap-4 p-4 hover:bg-accent/50 sm:px-5">
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-semibold">{p?.title ?? s.playbookId}</span>
                      {s.note && <span className="truncate text-sm text-muted-foreground">{s.note}</span>}
                      <span className="text-xs text-muted-foreground">{fmt(N.updated, { date: formatDate(s.updatedAt, t.locale) })}</span>
                    </span>
                    <StatusPill status={s.status} />
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="coming-guides">
        <h2 id="coming-guides" className="text-xl font-semibold">
          {t.journeys.comingTitle}
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {t.journeys.coming.map((c, i) => {
            const Icon = COMING_ICONS[i] ?? MessagesSquare;
            return (
              <li key={c.title} className="flex flex-col gap-2 rounded-2xl border border-dashed p-5">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.body}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* ---------------------------- Playbook page ---------------------------- */

function Questions({
  playbook,
  answers,
  onChange,
  onSubmit,
}: {
  playbook: Playbook;
  answers: Record<string, string>;
  onChange: (a: Record<string, string>) => void;
  onSubmit: () => void;
}) {
  const t = useT();
  const N = t.navigator;
  const [tried, setTried] = useState(false);
  const complete = playbook.questions.every((q) => answers[q.id]);

  function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (complete) onSubmit();
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">{N.questionsTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{N.questionsHint}</p>
      </div>
      {playbook.questions.map((q, qi) => (
        <fieldset key={q.id} className="rounded-2xl border bg-card p-5">
          <legend className="sr-only">{q.text}</legend>
          <p aria-hidden="true" className="font-semibold">
            <span className="tabular mr-2 font-mono text-sm text-primary">{qi + 1}.</span>
            {q.text}
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {q.options.map((o) => {
              const checked = answers[q.id] === o.value;
              return (
                <label
                  key={o.value}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    "has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent",
                  )}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={o.value}
                    checked={checked}
                    onChange={() => onChange({ ...answers, [q.id]: o.value })}
                    className="sr-only"
                  />
                  {checked && <Check className="size-4" aria-hidden="true" />}
                  {o.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      {tried && !complete && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {N.answerAll}
        </p>
      )}
      <Button type="submit" size="lg" className="self-start">
        {N.seePlan} <ArrowRight />
      </Button>
    </form>
  );
}

function Plan({ playbook, answers }: { playbook: Playbook; answers: Record<string, string> }) {
  const t = useT();
  const N = t.navigator;
  const diagnosis = diagnosisFor(playbook, answers);
  const options = rankOptions(playbook, answers);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle as="h2">{N.diagnosis}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {diagnosis.map((html, i) => (
            <Prose key={i} html={html} />
          ))}
        </CardContent>
      </Card>

      <section aria-labelledby="options-title">
        <h2 id="options-title" className="text-xl font-semibold">
          {N.options}
        </h2>
        <ol className="mt-4 grid gap-4 lg:grid-cols-3">
          {options.map((o, i) => (
            <li key={o.title}>
              <Card className={cn("flex h-full flex-col", i === 0 && "border-primary ring-1 ring-primary")}>
                <CardHeader>
                  {i === 0 && (
                    <Badge className="self-start">
                      <Sparkles className="size-3.5" aria-hidden="true" /> {N.bestFit}
                    </Badge>
                  )}
                  <CardTitle>{o.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <Prose html={o.html} className="text-sm" />
                  {o.tradeoffs && (
                    <div className="mt-auto rounded-xl bg-muted p-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{N.tradeoffs}</p>
                      <p className="mt-1">{o.tradeoffs}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2">
              <MessageSquareQuote className="size-5 text-primary" aria-hidden="true" /> {N.wording}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Prose html={playbook.wordingHtml} />
          </CardContent>
        </Card>
        <Card className="border-none bg-navy text-navy-foreground">
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2">
              <TrendingUp className="size-5 text-cta" aria-hidden="true" /> {N.leverage}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Prose html={playbook.leverageHtml} className="[&_a]:text-cta" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border p-4">
          <p className="text-sm text-muted-foreground">{N.aiBody}</p>
          <Button asChild variant="outline" size="sm" className="self-start">
            <Link to={`${paths.assistant}?q=${encodeURIComponent(fmt(N.aiPrompt, { title: playbook.title }))}`}>
              <Sparkles /> {N.ai}
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <p className="text-sm">{N.supportCta}</p>
          <Button asChild size="sm" className="self-start">
            <Link to={`${paths.support}?tema=${encodeURIComponent(playbook.id)}`}>
              <HeartHandshake /> {N.supportLink}
            </Link>
          </Button>
        </div>
      </div>

      {playbook.legal && (
        <section aria-label={t.countries.label} className="flex flex-col gap-4">
          <CountrySelect id="navigator-country" />
          <CountryHelp />
        </section>
      )}
    </div>
  );
}

function SavePanel({
  playbook,
  answers,
  existing,
  onSaved,
}: {
  playbook: Playbook;
  answers: Record<string, string>;
  existing: SavedSituation | null;
  onSaved: (s: SavedSituation) => void;
}) {
  const t = useT();
  const N = t.navigator;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState(existing?.note ?? "");
  const [resolved, setResolved] = useState(existing?.status === "resolved");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function save() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const s = await backend.saveSituation(user.id, {
        id: existing?.id,
        playbookId: playbook.id,
        answers,
        note: note.trim(),
        status: resolved ? "resolved" : "open",
      });
      const isNew = !existing;
      onSaved(s);
      setMessage(N.savedToast);
      if (isNew) navigate(paths.playbook(playbook.id, s.id), { replace: true });
    } catch {
      setError(t.auth.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!user || !existing) return;
    setBusy(true);
    try {
      await backend.deleteSituation(user.id, existing.id);
      navigate(paths.challenges, { replace: true });
    } catch {
      setError(t.auth.errors.generic);
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-5 sm:pt-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="situation-note">{N.noteLabel}</Label>
          <Textarea
            id="situation-note"
            value={note}
            maxLength={2000}
            placeholder={N.notePlaceholder}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            id="situation-resolved"
            type="checkbox"
            checked={resolved}
            onChange={(e) => setResolved(e.target.checked)}
            className="size-5 accent-[var(--primary)]"
          />
          {N.markResolved}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {existing ? N.update : N.save}
          </Button>
          {existing &&
            (confirming ? (
              <span className="flex flex-wrap items-center gap-2 text-sm">
                {N.deleteConfirm}
                <Button variant="destructive" size="sm" onClick={remove} disabled={busy}>
                  {N.confirmDelete}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  {t.common.cancel}
                </Button>
              </span>
            ) : (
              <Button variant="ghost" onClick={() => setConfirming(true)}>
                <Trash2 /> {N.delete}
              </Button>
            ))}
        </div>
        <p role="status" className="text-sm font-medium text-success">
          {message}
        </p>
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function PlaybookPage() {
  const t = useT();
  const N = t.navigator;
  const { playbookId = "", savedId } = useParams();
  const { user } = useAuth();
  const playbook = useMemo(() => getPlaybook(playbookId), [playbookId]);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<"questions" | "plan">("questions");
  const [existing, setExisting] = useState<SavedSituation | null>(null);
  const [loading, setLoading] = useState(!!savedId);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!savedId || !user) return;
    // Already loaded (e.g. right after the first save replaced the URL).
    if (existing?.id === savedId) return;
    setLoading(true);
    backend
      .listSituations(user.id)
      .then((all) => {
        const s = all.find((x) => x.id === savedId && x.playbookId === playbookId);
        if (!s) return setMissing(true);
        setExisting(s);
        setAnswers(s.answers);
        setStage("plan");
      })
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [savedId, playbookId, user, existing?.id]);

  if (!playbook || missing) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-2xl border border-dashed p-6 text-muted-foreground">{N.notFound}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={paths.challenges}>
            <ArrowLeft /> {N.back}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <Link to={paths.challenges} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" /> {N.back}
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="label-mono text-primary">{N.eyebrow}</p>
          {existing && <StatusPill status={existing.status} />}
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl font-semibold outline-none sm:text-4xl">
          {playbook.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{playbook.summary}</p>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t.common.loading}
        </p>
      ) : stage === "questions" ? (
        <Questions
          playbook={playbook}
          answers={answers}
          onChange={setAnswers}
          onSubmit={() => {
            setStage("plan");
            window.scrollTo({ top: 0 });
            headingRef.current?.focus();
          }}
        />
      ) : (
        <>
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setStage("questions")}>
            <ArrowLeft /> {N.changeAnswers}
          </Button>
          <Plan playbook={playbook} answers={answers} />
          <SensitiveNote />
          <SavePanel playbook={playbook} answers={answers} existing={existing} onSaved={setExisting} />
        </>
      )}
    </div>
  );
}
