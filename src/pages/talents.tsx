import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Check,
  Clock,
  EyeOff,
  FileText,
  GraduationCap,
  Languages,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { fmt, formatDay, useT } from "@/i18n";
import { backend } from "@/lib/backend";
import {
  AREAS,
  CAREER_STAGES,
  CERTIFICATIONS,
  EMPTY_TALENT_FILTERS,
  PROGRAMS,
  TALENT_AVAILABILITY,
  TALENT_LANGUAGES,
  WORK_MODES,
  filterTalents,
  isOnboarded,
  type AreaId,
  type RecruiterAccess,
  type TalentFilters,
  type TalentProfile,
  type TalentProfileInput,
} from "@/lib/domain";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth";

const REAL_AREAS = AREAS.filter((a) => a !== "notSure");
const MAX_TALENT_AREAS = 3;
const HTTPS = /^https:\/\/[^\s]+$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:bg-accent",
      )}
    >
      {active && <Check className="size-3.5" aria-hidden="true" />}
      {children}
    </button>
  );
}

function ChipGroup<T extends string>({
  label,
  hint,
  options,
  labels,
  value,
  onChange,
  max,
}: {
  label: string;
  hint?: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T[];
  onChange: (v: T[]) => void;
  max?: number;
}) {
  const toggle = (o: T) => {
    if (value.includes(o)) onChange(value.filter((x) => x !== o));
    else if (!max || value.length < max) onChange([...value, o]);
  };
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} active={value.includes(o)} onClick={() => toggle(o)}>
            {labels[o]}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

/** A switch made from a checkbox, so it works with keyboard and screen readers. */
function Toggle({ id, checked, onChange, label, hint, disabled }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint: string; disabled?: boolean }) {
  return (
    <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-4", disabled && "cursor-not-allowed opacity-60")}>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={`${id}-hint`}
          className="peer sr-only"
        />
        <span className="h-7 w-12 rounded-full bg-muted-foreground/30 transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring" />
        <span className="absolute left-1 top-1 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
      <span>
        <span className="block font-semibold">{label}</span>
        <span id={`${id}-hint`} className="block text-sm text-muted-foreground">
          {hint}
        </span>
      </span>
    </label>
  );
}

/** How a profile looks to a leader. Used in the search and as the member's preview. */
export function TalentCard({ p }: { p: TalentProfile }) {
  const t = useT();
  const T = t.talents;
  const S = T.search;
  const cv = p.shareCv && p.cvUrl;
  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground" aria-hidden="true">
          {p.name.charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0">
          {p.sample && <p className="label-mono text-[0.62rem] text-primary">{T.sample}</p>}
          <h3 className="font-display text-lg font-bold leading-snug">{p.name}</h3>
          <p className="text-sm">{p.headline}</p>
        </div>
      </div>
      <dl className="grid gap-1.5 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <dt className="sr-only">{T.member.stage}</dt>
          <Briefcase className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <dd>{T.stages[p.careerStage]}</dd>
        </div>
        {(p.education || p.program) && (
          <div className="flex items-start gap-2">
            <dt className="sr-only">{T.member.education}</dt>
            <GraduationCap className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <dd>
              {[p.education || (p.program ? t.onboarding.programs[p.program] : ""), p.graduationYear ? fmt(S.graduation, { year: p.graduationYear }) : ""]
                .filter(Boolean)
                .join(" · ")}
            </dd>
          </div>
        )}
        {p.city && (
          <div className="flex items-start gap-2">
            <dt className="sr-only">{T.member.city}</dt>
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <dd>{p.city}</dd>
          </div>
        )}
        {(p.languages.length > 0 || p.certifications.length > 0) && (
          <div className="flex items-start gap-2">
            <dt className="sr-only">{T.member.languages}</dt>
            <Languages className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <dd>{[...p.languages.map((l) => T.languages[l]), ...p.certifications.map((c) => T.certifications[c])].join(" · ")}</dd>
          </div>
        )}
      </dl>
      <ul className="flex flex-wrap gap-1.5">
        {p.areas.map((a) => (
          <li key={a} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {t.onboarding.areas[a]}
          </li>
        ))}
        {p.availability.map((a) => (
          <li key={a} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {T.availability[a]}
          </li>
        ))}
        {p.workModes.map((w) => (
          <li key={w} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {T.workModes[w]}
          </li>
        ))}
      </ul>
      {p.about && <p className="text-sm">{p.about}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
        {cv ? (
          <Button asChild size="sm">
            <a href={p.cvUrl} target="_blank" rel="noopener noreferrer nofollow">
              <FileText /> {S.cv}
            </a>
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <EyeOff className="size-3.5" aria-hidden="true" /> {S.noCv}
          </span>
        )}
        {p.linkedinUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow">
              <Link2 /> {S.linkedin}
            </a>
          </Button>
        )}
        {p.contactEmail && (
          <Button asChild variant="ghost" size="sm">
            <a href={`mailto:${p.contactEmail}`}>
              <Mail /> {S.email}
            </a>
          </Button>
        )}
      </div>
      {!p.sample && <p className="text-xs text-muted-foreground">{fmt(S.updated, { date: formatDay(p.updatedAt.slice(0, 10), t.locale) })}</p>}
    </article>
  );
}

/* ---------------- Member side: opt-in profile ---------------- */

function emptyInput(name: string, email: string, base: ReturnType<typeof useAuth>["profile"]): TalentProfileInput {
  const onboarded = isOnboarded(base);
  return {
    visible: false,
    shareCv: false,
    name,
    headline: "",
    city: "",
    careerStage: onboarded ? base.careerStage : "exploring",
    areas: onboarded ? (base.areas.filter((a) => a !== "notSure") as AreaId[]).slice(0, MAX_TALENT_AREAS) : [],
    program: onboarded ? base.program : "",
    education: onboarded && base.university ? base.university : "",
    graduationYear: null,
    languages: [],
    certifications: [],
    availability: [],
    workModes: [],
    about: "",
    linkedinUrl: "",
    cvUrl: "",
    contactEmail: email,
  };
}

export function TalentProfilePage() {
  const t = useT();
  const T = t.talents;
  const M = T.member;
  const { user, profile } = useAuth();
  const [form, setForm] = useState<TalentProfileInput | null>(null);
  const [exists, setExists] = useState(false);
  const [year, setYear] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    backend
      .getTalentProfile(user.id)
      .catch(() => null)
      .then((p) => {
        if (p) {
          const { userId: _u, updatedAt: _d, sample: _s, ...rest } = p;
          setForm(rest);
          setYear(p.graduationYear ? String(p.graduationYear) : "");
          setExists(true);
        } else setForm(emptyInput(profile?.displayName ?? "", user.email, profile));
      });
  }, [user, profile]);

  if (!form || !user) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t.common.loading}
      </p>
    );
  }

  const set = <K extends keyof TalentProfileInput>(key: K, value: TalentProfileInput[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));
  const yearNum = year.trim() ? Number(year.trim()) : null;
  const errors = {
    name: form.name.trim().length < 2 ? M.errors.name : undefined,
    headline: form.headline.trim().length < 2 ? M.errors.headline : undefined,
    areas: form.areas.length === 0 ? M.errors.areas : undefined,
    linkedin: form.linkedinUrl.trim() && !HTTPS.test(form.linkedinUrl.trim()) ? M.errors.url : undefined,
    cv: form.cvUrl.trim() && !HTTPS.test(form.cvUrl.trim()) ? M.errors.url : undefined,
    email: form.contactEmail.trim() && !EMAIL.test(form.contactEmail.trim()) ? M.errors.email : undefined,
    year: yearNum !== null && !(Number.isInteger(yearNum) && yearNum >= 1960 && yearNum <= 2040) ? M.errors.year : undefined,
  };
  const show = (e?: string) => (tried ? e : undefined);

  const clean = (f: TalentProfileInput): TalentProfileInput => ({
    ...f,
    name: f.name.trim().slice(0, 80),
    headline: f.headline.trim().slice(0, 160),
    city: f.city.trim().slice(0, 80),
    education: f.education.trim().slice(0, 160),
    graduationYear: yearNum,
    about: f.about.trim().slice(0, 800),
    linkedinUrl: f.linkedinUrl.trim(),
    cvUrl: f.cvUrl.trim(),
    contactEmail: f.contactEmail.trim().slice(0, 160),
  });

  async function save(next: TalentProfileInput, okText = M.saved) {
    if (!user) return;
    setBusy(true);
    setMessage(null);
    try {
      const saved = await backend.saveTalentProfile(user.id, clean(next));
      const { userId: _u, updatedAt: _d, sample: _s, ...rest } = saved;
      setForm(rest);
      setExists(true);
      setMessage({ kind: "ok", text: okText });
    } catch {
      setMessage({ kind: "error", text: t.auth.errors.generic });
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    const first = Object.entries(errors).find(([, v]) => v);
    if (first) {
      document.getElementById(`talent-${first[0]}`)?.focus();
      return;
    }
    if (form) void save(form);
  }

  /** Hiding is saved right away; showing needs a complete profile first. */
  function setVisible(v: boolean) {
    if (!form) return;
    const valid = !Object.values(errors).some(Boolean);
    if (!v && exists && valid) void save({ ...form, visible: false }, M.statusHidden);
    else set("visible", v);
  }

  async function remove() {
    if (!user) return;
    setBusy(true);
    try {
      await backend.deleteTalentProfile(user.id);
      setForm(emptyInput(profile?.displayName ?? "", user.email, profile));
      setYear("");
      setExists(false);
      setTried(false);
      setMessage({ kind: "ok", text: M.deleted });
    } catch {
      setMessage({ kind: "error", text: t.auth.errors.generic });
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  const preview: TalentProfile = { ...clean(form), userId: user.id, updatedAt: new Date().toISOString() };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header>
        <p className="label-mono text-primary">{T.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{M.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{M.subtitle}</p>
      </header>

      <section className="rounded-2xl border bg-primary/5 p-5 sm:p-6" aria-labelledby="talent-privacy">
        <h2 id="talent-privacy" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-5 text-primary" aria-hidden="true" /> {M.privacyTitle}
        </h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {M.privacy.map((line) => (
            <li key={line} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> {line}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={submit} noValidate className="flex flex-col gap-6" aria-label={M.title}>
          <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6">
            <Toggle id="talent-visible" checked={form.visible} onChange={setVisible} label={M.visible} hint={M.visibleHint} disabled={busy} />
            <Toggle
              id="talent-sharecv"
              checked={form.shareCv}
              onChange={(v) => set("shareCv", v)}
              label={M.shareCv}
              hint={M.shareCvHint}
              disabled={busy || !form.visible}
            />
            <p
              role="status"
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                exists && form.visible ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {exists && form.visible ? <BadgeCheck className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
              {exists && form.visible ? M.statusVisible : M.statusHidden}
            </p>
          </div>

          <fieldset className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6">
            <legend className="sr-only">{M.sectionAbout}</legend>
            <h2 className="text-lg font-semibold" aria-hidden="true">
              {M.sectionAbout}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="talent-name" label={M.name} hint={M.nameHint} error={show(errors.name)}>
                {(a) => <Input {...a} value={form.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />}
              </Field>
              <Field id="talent-city" label={`${M.city} · ${t.common.optional}`}>
                {(a) => <Input {...a} value={form.city} maxLength={80} placeholder={M.cityPlaceholder} onChange={(e) => set("city", e.target.value)} />}
              </Field>
            </div>
            <Field id="talent-headline" label={M.headline} error={show(errors.headline)}>
              {(a) => <Input {...a} value={form.headline} maxLength={160} placeholder={M.headlinePlaceholder} onChange={(e) => set("headline", e.target.value)} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="talent-stage" label={M.stage}>
                {(a) => (
                  <Select {...a} value={form.careerStage} onChange={(e) => set("careerStage", e.target.value as TalentProfileInput["careerStage"])}>
                    {CAREER_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {T.stages[s]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field id="talent-program" label={`${M.program} · ${t.common.optional}`}>
                {(a) => (
                  <Select {...a} value={form.program} onChange={(e) => set("program", e.target.value as TalentProfileInput["program"])}>
                    <option value="">{M.programNone}</option>
                    {PROGRAMS.map((p) => (
                      <option key={p} value={p}>
                        {t.onboarding.programs[p]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field id="talent-education" label={`${M.education} · ${t.common.optional}`}>
                {(a) => <Input {...a} value={form.education} maxLength={160} placeholder={M.educationPlaceholder} onChange={(e) => set("education", e.target.value)} />}
              </Field>
              <Field id="talent-year" label={`${M.graduationYear} · ${t.common.optional}`} error={show(errors.year)}>
                {(a) => <Input {...a} value={year} inputMode="numeric" maxLength={4} placeholder="2027" onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} />}
              </Field>
            </div>
            <div id="talent-areas" tabIndex={-1}>
              <ChipGroup label={M.areas} hint={M.areasHint} options={REAL_AREAS} labels={t.onboarding.areas} value={form.areas} onChange={(v) => set("areas", v)} max={MAX_TALENT_AREAS} />
              {show(errors.areas) && (
                <p role="alert" className="mt-2 text-sm font-medium text-destructive">
                  {errors.areas}
                </p>
              )}
            </div>
            <ChipGroup label={M.languages} options={TALENT_LANGUAGES} labels={T.languages} value={form.languages} onChange={(v) => set("languages", v)} />
            <ChipGroup label={M.certifications} options={CERTIFICATIONS} labels={T.certifications} value={form.certifications} onChange={(v) => set("certifications", v)} />
            <Field id="talent-about" label={`${M.about} · ${t.common.optional}`} hint={M.aboutHint}>
              {(a) => <Textarea {...a} value={form.about} maxLength={800} onChange={(e) => set("about", e.target.value)} />}
            </Field>
          </fieldset>

          <fieldset className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6">
            <legend className="sr-only">{M.sectionWork}</legend>
            <h2 className="text-lg font-semibold" aria-hidden="true">
              {M.sectionWork}
            </h2>
            <ChipGroup label={M.availability} options={TALENT_AVAILABILITY} labels={T.availability} value={form.availability} onChange={(v) => set("availability", v)} />
            <ChipGroup label={M.workModes} options={WORK_MODES} labels={T.workModes} value={form.workModes} onChange={(v) => set("workModes", v)} />
          </fieldset>

          <fieldset className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6">
            <legend className="sr-only">{M.sectionContact}</legend>
            <h2 className="text-lg font-semibold" aria-hidden="true">
              {M.sectionContact}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="talent-email" label={`${M.contactEmail} · ${t.common.optional}`} hint={M.contactHint} error={show(errors.email)}>
                {(a) => <Input {...a} type="email" value={form.contactEmail} maxLength={160} onChange={(e) => set("contactEmail", e.target.value)} />}
              </Field>
              <Field id="talent-linkedin" label={`${M.linkedin} · ${t.common.optional}`} error={show(errors.linkedin)}>
                {(a) => <Input {...a} value={form.linkedinUrl} maxLength={300} placeholder="https://www.linkedin.com/in/…" onChange={(e) => set("linkedinUrl", e.target.value)} />}
              </Field>
            </div>
            <Field id="talent-cv" label={`${M.cv} · ${t.common.optional}`} hint={M.cvHint} error={show(errors.cv)}>
              {(a) => <Input {...a} value={form.cvUrl} maxLength={300} placeholder="https://" onChange={(e) => set("cvUrl", e.target.value)} />}
            </Field>
          </fieldset>

          {message && (
            <p role="status" className={cn("rounded-xl p-3 text-sm font-medium", message.kind === "ok" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
              {message.text}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
              {M.save}
            </Button>
            {exists &&
              (confirming ? (
                <span className="flex flex-wrap items-center gap-2 text-sm">
                  {M.deleteConfirm}
                  <Button type="button" variant="destructive" size="sm" onClick={remove} disabled={busy}>
                    {M.delete}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                    {t.common.cancel}
                  </Button>
                </span>
              ) : (
                <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
                  <Trash2 /> {M.delete}
                </Button>
              ))}
          </div>
        </form>

        <aside className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start" aria-labelledby="talent-preview">
          <h2 id="talent-preview" className="text-lg font-semibold">
            {M.preview}
          </h2>
          <TalentCard p={preview} />
        </aside>
      </div>
    </div>
  );
}

/* ---------------- Leader side: search ---------------- */

function TalentsHeader() {
  const t = useT();
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft /> {t.app.nav.home}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function RequestAccess({ onDone }: { onDone: (a: RecruiterAccess) => void }) {
  const t = useT();
  const S = t.talents.search;
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? "");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const req = (v: string) => (tried && v.trim().length < 2 ? S.requestErrors.required : undefined);
  const urlErr = tried && linkedin.trim() && !HTTPS.test(linkedin.trim()) ? S.requestErrors.url : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!user || [name, company, role].some((v) => v.trim().length < 2) || (linkedin.trim() && !HTTPS.test(linkedin.trim()))) return;
    setBusy(true);
    setError(null);
    try {
      onDone(
        await backend.requestRecruiterAccess(user.id, {
          name: name.trim().slice(0, 80),
          company: company.trim().slice(0, 120),
          role: role.trim().slice(0, 120),
          linkedinUrl: linkedin.trim().slice(0, 300),
        }),
      );
    } catch {
      setError(t.auth.errors.generic);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-w-2xl flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6" aria-labelledby="request-title">
      <div>
        <h2 id="request-title" className="text-xl font-semibold">
          {S.requestTitle}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{S.requestBody}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="req-name" label={S.requestName} error={req(name)}>
          {(a) => <Input {...a} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field id="req-company" label={S.requestCompany} error={req(company)}>
          {(a) => <Input {...a} value={company} maxLength={120} onChange={(e) => setCompany(e.target.value)} />}
        </Field>
        <Field id="req-role" label={S.requestRole} error={req(role)}>
          {(a) => <Input {...a} value={role} maxLength={120} onChange={(e) => setRole(e.target.value)} />}
        </Field>
        <Field id="req-linkedin" label={`${S.requestLinkedin} · ${t.common.optional}`} error={urlErr}>
          {(a) => <Input {...a} value={linkedin} maxLength={300} placeholder="https://www.linkedin.com/in/…" onChange={(e) => setLinkedin(e.target.value)} />}
        </Field>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy} className="self-start">
        {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
        {S.requestSubmit}
      </Button>
    </form>
  );
}

function Filters({ f, setF, onClear }: { f: TalentFilters; setF: (f: TalentFilters) => void; onClear: () => void }) {
  const t = useT();
  const T = t.talents;
  const S = T.search;
  const up = <K extends keyof TalentFilters>(k: K) => (v: TalentFilters[K]) => setF({ ...f, [k]: v });
  return (
    <div className="flex flex-col gap-5">
      <ChipGroup label={S.areas} options={REAL_AREAS} labels={t.onboarding.areas} value={f.areas} onChange={up("areas")} />
      <ChipGroup label={S.stages} options={CAREER_STAGES} labels={T.stages} value={f.stages} onChange={up("stages")} />
      <ChipGroup label={S.availability} options={TALENT_AVAILABILITY} labels={T.availability} value={f.availability} onChange={up("availability")} />
      <ChipGroup label={S.workModes} options={WORK_MODES} labels={T.workModes} value={f.workModes} onChange={up("workModes")} />
      <ChipGroup label={S.programs} options={PROGRAMS} labels={t.onboarding.programs} value={f.programs} onChange={up("programs")} />
      <ChipGroup label={S.languages} hint={S.languagesHint} options={TALENT_LANGUAGES} labels={T.languages} value={f.languages} onChange={up("languages")} />
      <ChipGroup label={S.certifications} options={CERTIFICATIONS} labels={T.certifications} value={f.certifications} onChange={up("certifications")} />
      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" checked={f.withCv} onChange={(e) => setF({ ...f, withCv: e.target.checked })} className="size-5 accent-[var(--primary)]" />
        {S.withCv}
      </label>
      <Button type="button" variant="ghost" size="sm" className="self-start" onClick={onClear}>
        {S.clear}
      </Button>
    </div>
  );
}

function Search_() {
  const t = useT();
  const S = t.talents.search;
  const [all, setAll] = useState<TalentProfile[] | null>(null);
  const [f, setF] = useState<TalentFilters>(EMPTY_TALENT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    backend
      .searchTalents()
      .then(setAll)
      .catch(() => setAll([]));
  }, []);

  const listed = useMemo(() => (all ? filterTalents(all, f) : []), [all, f]);
  const active = JSON.stringify(f) !== JSON.stringify(EMPTY_TALENT_FILTERS);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <Field id="talent-q" label={S.query}>
          {(a) => (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input {...a} type="search" className="pl-9" value={f.q} placeholder={S.queryPlaceholder} onChange={(e) => setF({ ...f, q: e.target.value })} />
            </div>
          )}
        </Field>
        <Field id="talent-city-filter" label={S.city}>
          {(a) => <Input {...a} value={f.city} placeholder={S.cityPlaceholder} onChange={(e) => setF({ ...f, city: e.target.value })} />}
        </Field>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div>
          <Button type="button" variant="outline" className="lg:hidden" aria-expanded={showFilters} aria-controls="talent-filters" onClick={() => setShowFilters((s) => !s)}>
            <SlidersHorizontal /> {S.filters}
          </Button>
          <div id="talent-filters" className={cn("mt-4 lg:mt-0 lg:block", showFilters ? "block" : "hidden")}>
            <h2 className="mb-4 hidden text-lg font-semibold lg:block">{S.filters}</h2>
            <Filters f={f} setF={setF} onClear={() => setF(EMPTY_TALENT_FILTERS)} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {all === null ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t.common.loading}
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold" role="status" aria-live="polite">
                {listed.length === 1 ? S.resultsOne : fmt(S.results, { count: listed.length })}
              </p>
              {listed.length === 0 ? (
                <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">{all.length === 0 ? S.emptyBank : active ? S.empty : S.emptyBank}</p>
              ) : (
                <ul className="grid gap-4 xl:grid-cols-2">
                  {listed.map((p) => (
                    <li key={p.userId}>
                      <TalentCard p={p} />
                    </li>
                  ))}
                </ul>
              )}
              <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">{S.conduct}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function TalentSearchPage() {
  const t = useT();
  const S = t.talents.search;
  const { user, loading, mode } = useAuth();
  const [access, setAccess] = useState<RecruiterAccess | null | undefined>(undefined);

  useEffect(() => {
    if (!user) {
      setAccess(undefined);
      return;
    }
    backend
      .getRecruiterAccess(user.id)
      .then(setAccess)
      .catch(() => setAccess(null));
  }, [user]);

  let body: ReactNode;
  if (loading || (user && access === undefined)) {
    body = (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t.common.loading}
      </p>
    );
  } else if (!user) {
    body = (
      <div className="flex max-w-2xl flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-semibold">{S.signedOutTitle}</h2>
        <p className="text-muted-foreground">{S.signedOutBody}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/signup?next=/talentos">{S.signup}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login?next=/talentos">{S.login}</Link>
          </Button>
        </div>
      </div>
    );
  } else if (!access) {
    body = <RequestAccess onDone={setAccess} />;
  } else if (access.status === "pending") {
    body = (
      <div className="flex max-w-2xl gap-3 rounded-2xl border bg-card p-5 sm:p-6" role="status">
        <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 className="font-semibold">{S.pendingTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{S.pendingBody}</p>
        </div>
      </div>
    );
  } else if (access.status === "rejected") {
    body = (
      <div className="max-w-2xl rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">{S.rejectedTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{S.rejectedBody}</p>
      </div>
    );
  } else {
    body = <Search_ />;
  }

  return (
    <>
      <TalentsHeader />
      <main id="main" className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-28 pt-10 sm:px-6">
        <div>
          <p className="label-mono text-primary">{t.talents.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{S.title}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{S.subtitle}</p>
          <p className="mt-3 flex max-w-3xl items-start gap-2 text-sm">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> {S.consentNote}
          </p>
          {mode === "demo" && <p className="mt-3 max-w-3xl rounded-xl bg-muted p-3 text-sm text-muted-foreground">{S.demoNote}</p>}
        </div>
        {body}
      </main>
    </>
  );
}
