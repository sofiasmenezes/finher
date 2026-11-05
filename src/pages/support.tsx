import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, ExternalLink, HeartHandshake, Loader2, LifeBuoy, MapPin, Plus, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SAMPLE_THERAPISTS } from "@/content/catalog";
import { fmt, useT } from "@/i18n";
import { backend } from "@/lib/backend";
import {
  SUPPORT_THEMES,
  THERAPY_MODALITIES,
  THERAPY_PRICES,
  type SavedSituation,
  type SupportThemeId,
  type TherapistRecommendation,
  type TherapyModality,
  type TherapyPrice,
} from "@/lib/domain";
import { paths } from "@/lib/routes";
import { rankBySimilarity, themesFor, withSamples } from "@/lib/support";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth";

const CFP_CADASTRO = "https://cadastro.cfp.org.br/";

const isTheme = (v: string | null): v is SupportThemeId => !!v && (SUPPORT_THEMES as readonly string[]).includes(v);
const safeUrl = (v: string) => (/^https?:\/\/[^\s]+$/i.test(v.trim()) ? v.trim() : null);

/** Recommendations shared by the community, with her own saved situations to match against. */
export function useTherapists() {
  const { user } = useAuth();
  const [recs, setRecs] = useState<TherapistRecommendation[] | null>(null);
  const [saved, setSaved] = useState<SavedSituation[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    backend
      .listTherapistRecommendations()
      .then(setRecs)
      .catch(() => {
        setError(true);
        setRecs([]);
      });
    backend.listSituations(user.id).then(setSaved).catch(() => {});
  }, [user]);

  return { recs, setRecs, saved, error };
}

function ThemeChip({ theme, active, onClick }: { theme: SupportThemeId; active: boolean; onClick: () => void }) {
  const t = useT();
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
      {t.support.themes[theme]}
    </button>
  );
}

function RecommendationCard({ rec, highlight, onRemove }: { rec: TherapistRecommendation; highlight?: SupportThemeId[]; onRemove?: () => void }) {
  const t = useT();
  const S = t.support;
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const mine = !rec.sample && rec.authorId === user?.id;
  const url = safeUrl(rec.contact);
  const wanted = new Set(highlight ?? []);

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        {rec.sample && <Badge variant="outline">{S.sample}</Badge>}
        {mine && <Badge>{S.yours}</Badge>}
        <Badge variant="cta">{S.prices[rec.price]}</Badge>
      </div>
      <div>
        <h3 className="font-display text-lg font-bold leading-snug">{rec.therapistName}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{S.modalities[rec.modality]}</span>
          {rec.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" /> {rec.city}
            </span>
          )}
          {rec.crp && <span>CRP {rec.crp}</span>}
        </p>
      </div>
      {rec.comment && <p className="text-sm">“{rec.comment}”</p>}
      <div>
        <p className="label-mono text-muted-foreground">{S.helpedWith}</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {rec.themes.map((th) => (
            <li
              key={th}
              className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", wanted.has(th) ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground")}
            >
              {S.themes[th]}
            </li>
          ))}
        </ul>
      </div>
      {rec.contact && (
        <p className="text-sm">
          <span className="text-muted-foreground">{S.contact}: </span>
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-2 hover:underline">
              {url.replace(/^https?:\/\//, "").slice(0, 48)} <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          ) : (
            <span className="font-medium">{rec.contact}</span>
          )}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden="true" />
          {rec.authorName ? fmt(S.recommendedBy, { name: rec.authorName }) : S.anonymous}
        </span>
        {mine &&
          onRemove &&
          (confirming ? (
            <span className="flex items-center gap-1">
              {S.removeConfirm}
              <Button variant="destructive" size="sm" onClick={onRemove}>
                {S.remove}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                {t.common.cancel}
              </Button>
            </span>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
              <Trash2 /> {S.remove}
            </Button>
          ))}
      </div>
    </article>
  );
}

function RecommendForm({ initialThemes, onDone, onCancel }: { initialThemes: SupportThemeId[]; onDone: (r: TherapistRecommendation) => void; onCancel: () => void }) {
  const t = useT();
  const F = t.support.form;
  const S = t.support;
  const { user, profile } = useAuth();
  const [therapistName, setTherapistName] = useState("");
  const [crp, setCrp] = useState("");
  const [modality, setModality] = useState<TherapyModality>("online");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState<TherapyPrice>("private");
  const [contact, setContact] = useState("");
  const [themes, setThemes] = useState<SupportThemeId[]>(initialThemes);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameError = tried && therapistName.trim().length < 2 ? F.errors.name : undefined;
  const themesError = tried && themes.length === 0 ? F.errors.themes : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!user || therapistName.trim().length < 2 || themes.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const rec = await backend.addTherapistRecommendation(user.id, {
        authorName: anonymous ? "" : (profile?.displayName ?? "").trim().split(/\s+/)[0].slice(0, 60),
        therapistName: therapistName.trim().slice(0, 120),
        crp: crp.trim().slice(0, 40),
        modality,
        city: city.trim().slice(0, 80),
        price,
        contact: contact.trim().slice(0, 200),
        themes,
        comment: comment.trim().slice(0, 600),
      });
      onDone(rec);
    } catch {
      setError(t.auth.errors.generic);
      setBusy(false);
    }
  }

  const toggle = (th: SupportThemeId) => setThemes((prev) => (prev.includes(th) ? prev.filter((x) => x !== th) : [...prev, th]));

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6" aria-labelledby="recommend-title">
      <div>
        <h2 id="recommend-title" className="text-xl font-semibold">
          {F.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{F.body}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="rec-name" label={F.therapistName} error={nameError}>
          {(a) => <Input {...a} value={therapistName} maxLength={120} onChange={(e) => setTherapistName(e.target.value)} />}
        </Field>
        <Field id="rec-crp" label={`${F.crp} · ${t.common.optional}`} hint={F.crpHint}>
          {(a) => <Input {...a} value={crp} maxLength={40} placeholder="06/123456" onChange={(e) => setCrp(e.target.value)} />}
        </Field>
        <Field id="rec-modality" label={F.modality}>
          {(a) => (
            <Select {...a} value={modality} onChange={(e) => setModality(e.target.value as TherapyModality)}>
              {THERAPY_MODALITIES.map((m) => (
                <option key={m} value={m}>
                  {S.modalities[m]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="rec-price" label={F.price}>
          {(a) => (
            <Select {...a} value={price} onChange={(e) => setPrice(e.target.value as TherapyPrice)}>
              {THERAPY_PRICES.map((p) => (
                <option key={p} value={p}>
                  {S.prices[p]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="rec-city" label={`${F.city} · ${t.common.optional}`} hint={F.cityHint}>
          {(a) => <Input {...a} value={city} maxLength={80} onChange={(e) => setCity(e.target.value)} />}
        </Field>
        <Field id="rec-contact" label={`${F.contact} · ${t.common.optional}`} hint={F.contactHint}>
          {(a) => <Input {...a} value={contact} maxLength={200} placeholder="https://" onChange={(e) => setContact(e.target.value)} />}
        </Field>
      </div>
      <fieldset aria-describedby="rec-themes-hint">
        <legend className="text-sm font-semibold">{F.themes}</legend>
        <p id="rec-themes-hint" className="mt-1 text-xs text-muted-foreground">
          {F.themesHint}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUPPORT_THEMES.map((th) => (
            <ThemeChip key={th} theme={th} active={themes.includes(th)} onClick={() => toggle(th)} />
          ))}
        </div>
        {themesError && (
          <p role="alert" className="mt-2 text-sm font-medium text-destructive">
            {themesError}
          </p>
        )}
      </fieldset>
      <Field id="rec-comment" label={`${F.comment} · ${t.common.optional}`} hint={F.commentHint}>
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

export function SupportPage() {
  const t = useT();
  const S = t.support;
  const { user, profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const { recs, setRecs, saved, error } = useTherapists();
  const filter = isTheme(params.get("tema")) ? (params.get("tema") as SupportThemeId) : null;
  const [formOpen, setFormOpen] = useState(params.get("indicar") === "1");
  const [message, setMessage] = useState<string | null>(null);

  const myThemes = useMemo(() => themesFor(saved, profile?.goals ?? []), [saved, profile?.goals]);
  const all = useMemo(() => withSamples(recs ?? [], SAMPLE_THERAPISTS), [recs]);
  const similar = useMemo(() => rankBySimilarity(all, myThemes).slice(0, 4), [all, myThemes]);
  const listed = filter ? all.filter((r) => r.themes.includes(filter)) : all;

  const setFilter = (th: SupportThemeId | null) => {
    const next = new URLSearchParams(params);
    if (th) next.set("tema", th);
    else next.delete("tema");
    setParams(next, { replace: true });
  };

  async function remove(id: string) {
    if (!user) return;
    try {
      await backend.deleteTherapistRecommendation(user.id, id);
      setRecs((prev) => (prev ?? []).filter((r) => r.id !== id));
    } catch {
      setMessage(t.auth.errors.generic);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <header>
        <Link to={paths.challenges} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" /> {t.navigator.back}
        </Link>
        <p className="label-mono mt-4 text-primary">{S.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{S.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{S.subtitle}</p>
      </header>

      <section aria-labelledby="urgent-title" className="flex gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6">
        <LifeBuoy className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 id="urgent-title" className="font-bold">
            {S.urgentTitle}
          </h2>
          <p className="mt-1 text-sm">{S.urgentBody}</p>
        </div>
      </section>

      <section aria-labelledby="similar-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="similar-title" className="text-xl font-semibold">
              {S.similarTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{S.similarBody}</p>
          </div>
          {!formOpen && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> {S.form.open}
            </Button>
          )}
        </div>
        {message && (
          <p role="status" className="mt-4 rounded-xl bg-success/10 p-3 text-sm font-medium text-success">
            {message}
          </p>
        )}
        {formOpen && (
          <div className="mt-5">
            <RecommendForm
              initialThemes={filter ? [filter] : myThemes.slice(0, 2)}
              onCancel={() => setFormOpen(false)}
              onDone={(r) => {
                setRecs((prev) => [r, ...(prev ?? [])]);
                setFormOpen(false);
                setMessage(S.form.success);
              }}
            />
          </div>
        )}
        {recs === null ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t.common.loading}
          </p>
        ) : similar.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
            {S.similarEmpty}{" "}
            <Link to={paths.challenges} className="font-semibold text-primary">
              {t.app.nav.challenges}
            </Link>
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {similar.map((r) => (
              <li key={r.id}>
                <RecommendationCard rec={r} highlight={myThemes} onRemove={() => remove(r.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="all-title">
        <h2 id="all-title" className="text-xl font-semibold">
          {S.allTitle}
        </h2>
        {error && (
          <p role="alert" className="mt-2 text-sm font-medium text-destructive">
            {t.auth.errors.generic}
          </p>
        )}
        <div role="group" aria-label={S.filterLabel} className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!filter}
            onClick={() => setFilter(null)}
            className={cn(
              "inline-flex min-h-9 items-center rounded-full border px-3.5 py-1.5 text-sm font-medium",
              !filter ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:bg-accent",
            )}
          >
            {S.filterAll}
          </button>
          {SUPPORT_THEMES.map((th) => (
            <ThemeChip key={th} theme={th} active={filter === th} onClick={() => setFilter(filter === th ? null : th)} />
          ))}
        </div>
        {listed.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">{S.empty}</p>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listed.map((r) => (
              <li key={r.id}>
                <RecommendationCard rec={r} highlight={filter ? [filter] : myThemes} onRemove={() => remove(r.id)} />
              </li>
            ))}
          </ul>
        )}
        {all.some((r) => r.sample) && <p className="mt-3 text-xs text-muted-foreground">{S.sampleNote}</p>}
      </section>

      <section aria-labelledby="free-title">
        <h2 id="free-title" className="text-xl font-semibold">
          {S.freeTitle}
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {S.free.map((f) => (
            <li key={f.title} className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
              <HeartHandshake className="size-5 text-primary" aria-hidden="true" />
              <p className="font-semibold">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          {S.checkCrp}{" "}
          <a href={CFP_CADASTRO} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary">
            {S.checkCrpLink} <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </p>
      </section>

      <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">{S.disclaimer}</p>
    </div>
  );
}
