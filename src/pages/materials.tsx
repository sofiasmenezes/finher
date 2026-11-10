import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ExternalLink,
  FileText,
  GraduationCap,
  Headphones,
  Loader2,
  Mail,
  Package,
  PlayCircle,
  Plus,
  Sparkles,
  Trash2,
  UserPen,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { TEAM_MATERIALS } from "@/content/catalog";
import { fmt, useT } from "@/i18n";
import { backend } from "@/lib/backend";
import { MATERIAL_TOPICS, MATERIAL_TYPES, type MaterialRecommendation, type MaterialTopic, type MaterialType } from "@/lib/domain";
import { paths } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth";

export const TYPE_ICONS: Record<MaterialType, LucideIcon> = {
  book: BookOpen,
  podcast: Headphones,
  course: GraduationCap,
  video: PlayCircle,
  author: UserPen,
  newsletter: Mail,
  article: FileText,
  other: Package,
};

const isType = (v: string | null): v is MaterialType => !!v && (MATERIAL_TYPES as readonly string[]).includes(v);
const isTopic = (v: string | null): v is MaterialTopic => !!v && (MATERIAL_TOPICS as readonly string[]).includes(v);

/** Team picks first, then what members shared (newest first). */
export function useMaterials() {
  const { user } = useAuth();
  const [shared, setShared] = useState<MaterialRecommendation[] | null>(null);
  useEffect(() => {
    if (!user) return;
    backend
      .listMaterials()
      .then(setShared)
      .catch(() => setShared([]));
  }, [user]);
  const all = useMemo(() => [...TEAM_MATERIALS, ...(shared ?? [])], [shared]);
  return { all, shared, setShared };
}

export function MaterialCard({ m, onRemove, compact }: { m: MaterialRecommendation; onRemove?: () => void; compact?: boolean }) {
  const t = useT();
  const M = t.materials;
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const Icon = TYPE_ICONS[m.type];
  const mine = !m.curated && m.authorId === user?.id;

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="label-mono text-[0.62rem] text-primary">{M.types[m.type]}</p>
          <h3 className="font-display text-lg font-bold leading-snug">{m.title}</h3>
          {m.creator && <p className="text-sm text-muted-foreground">{m.creator}</p>}
        </div>
      </div>
      {m.comment && !compact && <p className="text-sm">{m.comment}</p>}
      <ul className="flex flex-wrap gap-1.5">
        {m.topics.map((tp) => (
          <li key={tp} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {M.topics[tp]}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {m.curated ? (
            <>
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" /> {M.curated}
            </>
          ) : (
            <>
              <Users className="size-3.5" aria-hidden="true" />
              {mine ? M.yours : m.authorName ? fmt(M.recommendedBy, { name: m.authorName }) : M.anonymous}
            </>
          )}
        </span>
        <span className="flex items-center gap-1">
          {m.url && (
            <Button asChild variant="ghost" size="sm">
              <a href={m.url} target="_blank" rel="noopener noreferrer nofollow">
                {M.open} <ExternalLink />
              </a>
            </Button>
          )}
          {mine &&
            onRemove &&
            (confirming ? (
              <>
                <span>{M.removeConfirm}</span>
                <Button variant="destructive" size="sm" onClick={onRemove}>
                  {M.remove}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  {t.common.cancel}
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
                <Trash2 /> {M.remove}
              </Button>
            ))}
        </span>
      </div>
    </article>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:bg-accent",
      )}
    >
      {active && <Check className="size-3.5" aria-hidden="true" />}
      {children}
    </button>
  );
}

function MaterialForm({ initialTopic, onDone, onCancel }: { initialTopic: MaterialTopic | null; onDone: (m: MaterialRecommendation) => void; onCancel: () => void }) {
  const t = useT();
  const M = t.materials;
  const F = M.form;
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [type, setType] = useState<MaterialType>("book");
  const [topics, setTopics] = useState<MaterialTopic[]>(initialTopic ? [initialTopic] : []);
  const [url, setUrl] = useState("");
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlOk = !url.trim() || /^https:\/\/[^\s]+$/i.test(url.trim());
  const nameError = tried && title.trim().length < 2 ? F.errors.name : undefined;
  const topicsError = tried && topics.length === 0 ? F.errors.topics : undefined;
  const urlError = tried && !urlOk ? F.errors.url : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!user || title.trim().length < 2 || topics.length === 0 || !urlOk) return;
    setBusy(true);
    setError(null);
    try {
      const rec = await backend.addMaterial(user.id, {
        authorName: anonymous ? "" : (profile?.displayName ?? "").trim().split(/\s+/)[0].slice(0, 60),
        title: title.trim().slice(0, 160),
        creator: creator.trim().slice(0, 120),
        type,
        topics,
        url: url.trim().slice(0, 300),
        comment: comment.trim().slice(0, 600),
      });
      onDone(rec);
    } catch {
      setError(t.auth.errors.generic);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6" aria-labelledby="material-form-title">
      <div>
        <h2 id="material-form-title" className="text-xl font-semibold">
          {F.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{F.body}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="mat-title" label={F.name} error={nameError}>
          {(a) => <Input {...a} value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />}
        </Field>
        <Field id="mat-creator" label={`${F.creator} · ${t.common.optional}`}>
          {(a) => <Input {...a} value={creator} maxLength={120} onChange={(e) => setCreator(e.target.value)} />}
        </Field>
        <Field id="mat-type" label={F.type}>
          {(a) => (
            <Select {...a} value={type} onChange={(e) => setType(e.target.value as MaterialType)}>
              {MATERIAL_TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {M.types[ty]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="mat-url" label={`${F.url} · ${t.common.optional}`} hint={F.urlHint} error={urlError}>
          {(a) => <Input {...a} value={url} maxLength={300} placeholder="https://" onChange={(e) => setUrl(e.target.value)} />}
        </Field>
      </div>
      <fieldset aria-describedby="mat-topics-hint">
        <legend className="text-sm font-semibold">{F.topics}</legend>
        <p id="mat-topics-hint" className="mt-1 text-xs text-muted-foreground">
          {F.topicsHint}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MATERIAL_TOPICS.map((tp) => (
            <Chip key={tp} active={topics.includes(tp)} onClick={() => setTopics((p) => (p.includes(tp) ? p.filter((x) => x !== tp) : [...p, tp]))}>
              {M.topics[tp]}
            </Chip>
          ))}
        </div>
        {topicsError && (
          <p role="alert" className="mt-2 text-sm font-medium text-destructive">
            {topicsError}
          </p>
        )}
      </fieldset>
      <Field id="mat-comment" label={`${F.comment} · ${t.common.optional}`} hint={F.commentHint}>
        {(a) => <Textarea {...a} value={comment} maxLength={600} onChange={(e) => setComment(e.target.value)} />}
      </Field>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="size-5 accent-[var(--primary)]" />
        {F.anonymous}
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
          {F.submit}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {F.cancel}
        </Button>
      </div>
    </form>
  );
}

export function MaterialsPage() {
  const t = useT();
  const M = t.materials;
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const { all, shared, setShared } = useMaterials();
  const type = isType(params.get("tipo")) ? (params.get("tipo") as MaterialType) : null;
  const topic = isTopic(params.get("assunto")) ? (params.get("assunto") as MaterialTopic) : null;
  const [formOpen, setFormOpen] = useState(params.get("indicar") === "1");
  const [message, setMessage] = useState<string | null>(null);

  const set = (key: "tipo" | "assunto", value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("indicar");
    setParams(next, { replace: true });
  };

  const listed = all.filter((m) => (!type || m.type === type) && (!topic || m.topics.includes(topic)));

  async function remove(id: string) {
    if (!user) return;
    try {
      await backend.deleteMaterial(user.id, id);
      setShared((prev) => (prev ?? []).filter((m) => m.id !== id));
    } catch {
      setMessage(t.auth.errors.generic);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to={paths.community} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" /> {M.back}
          </Link>
          <p className="label-mono mt-4 text-primary">{M.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{M.title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{M.subtitle}</p>
        </div>
        {!formOpen && (
          <Button className="self-start sm:self-auto" onClick={() => setFormOpen(true)}>
            <Plus /> {M.form.open}
          </Button>
        )}
      </header>

      {message && (
        <p role="status" className="rounded-xl bg-success/10 p-3 text-sm font-medium text-success">
          {message}
        </p>
      )}
      {formOpen && (
        <MaterialForm
          initialTopic={topic}
          onCancel={() => setFormOpen(false)}
          onDone={(m) => {
            setShared((prev) => [m, ...(prev ?? [])]);
            setFormOpen(false);
            setMessage(M.form.success);
          }}
        />
      )}

      <div className="flex flex-col gap-4">
        <div role="group" aria-label={M.filterTopic} className="flex flex-wrap items-center gap-2">
          <span className="label-mono mr-1 w-16 text-muted-foreground">{M.filterTopic}</span>
          <Chip active={!topic} onClick={() => set("assunto", null)}>
            {M.all}
          </Chip>
          {MATERIAL_TOPICS.map((tp) => (
            <Chip key={tp} active={topic === tp} onClick={() => set("assunto", topic === tp ? null : tp)}>
              {M.topics[tp]}
            </Chip>
          ))}
        </div>
        <div role="group" aria-label={M.filterType} className="flex flex-wrap items-center gap-2">
          <span className="label-mono mr-1 w-16 text-muted-foreground">{M.filterType}</span>
          <Chip active={!type} onClick={() => set("tipo", null)}>
            {M.all}
          </Chip>
          {MATERIAL_TYPES.map((ty) => (
            <Chip key={ty} active={type === ty} onClick={() => set("tipo", type === ty ? null : ty)}>
              {M.types[ty]}
            </Chip>
          ))}
        </div>
      </div>

      {shared === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t.common.loading}
        </p>
      ) : listed.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">{M.empty}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listed.map((m) => (
            <li key={m.id}>
              <MaterialCard m={m} onRemove={() => remove(m.id)} />
            </li>
          ))}
        </ul>
      )}
      <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">{M.disclaimer}</p>
    </div>
  );
}

/** A few materials related to a soft skill, for the bottom of its guide. */
export function RelatedMaterials({ topics }: { topics: MaterialTopic[] }) {
  const M = useT().materials;
  const { all } = useMaterials();
  const related = all.filter((m) => m.topics.some((tp) => topics.includes(tp))).slice(0, 3);
  if (!related.length) return null;
  return (
    <section aria-labelledby="related-materials" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="related-materials" className="text-xl font-semibold">
          {M.relatedTitle}
        </h2>
        <Link to={`${paths.materials}?assunto=${topics[0]}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {M.relatedMore} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {related.map((m) => (
          <li key={m.id}>
            <MaterialCard m={m} compact />
          </li>
        ))}
      </ul>
    </section>
  );
}
