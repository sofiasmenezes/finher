import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Info, Loader2 } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { fmt, useT } from "@/i18n";
import {
  AREAS,
  CAREER_STAGES,
  GOALS,
  MAX_AREAS,
  MAX_GOALS,
  PROGRAMS,
  SKILLS,
  STUDENT_STAGES,
  type AreaId,
  type CareerStageId,
  type ConfidenceMap,
  type GoalId,
  type ProgramId,
} from "@/lib/domain";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth";

interface Draft {
  careerStage: CareerStageId | "";
  university: string;
  program: ProgramId | "";
  areas: AreaId[];
  goals: GoalId[];
  confidence: ConfidenceMap;
}

const DEFAULT_CONFIDENCE = Object.fromEntries(SKILLS.map((s) => [s, 2])) as ConfidenceMap;
const TOTAL = 4;

const isValid = <T extends string>(list: readonly T[], values: readonly string[] | undefined) =>
  (values ?? []).filter((v): v is T => (list as readonly string[]).includes(v));

function WhyWeAsk({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <details className="group mt-6 rounded-xl border border-dashed bg-card/60 px-4 py-3 text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-primary [&::-webkit-details-marker]:hidden">
        <Info className="size-4" aria-hidden="true" /> {t.onboarding.whyLabel}
      </summary>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </details>
  );
}

function ChipGroup<T extends string>({
  legend,
  options,
  selected,
  onToggle,
  labels,
  max,
  describedBy,
}: {
  legend: string;
  options: readonly T[];
  selected: T[];
  onToggle: (v: T) => void;
  labels: Record<T, string>;
  max: number;
  describedBy?: string;
}) {
  return (
    <fieldset aria-describedby={describedBy}>
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => {
          const checked = selected.includes(o);
          const disabled = !checked && selected.length >= max;
          return (
            <label
              key={o}
              className={cn(
                "relative inline-flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-offset-2",
                checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:bg-accent",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input type="checkbox" className="sr-only" checked={checked} disabled={disabled} onChange={() => onToggle(o)} />
              {checked && <Check className="size-4" aria-hidden="true" />}
              {labels[o]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function StageCards({ value, onChange }: { value: CareerStageId | ""; onChange: (v: CareerStageId) => void }) {
  const t = useT();
  return (
    <fieldset>
      <legend className="sr-only">{t.onboarding.steps.moment.title}</legend>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {CAREER_STAGES.map((s) => {
          const checked = value === s;
          return (
            <label
              key={s}
              className={cn(
                "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-offset-2",
                checked ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-input bg-card hover:bg-accent",
              )}
            >
              <input
                type="radio"
                name="career-stage"
                value={s}
                checked={checked}
                onChange={() => onChange(s)}
                className="size-4 shrink-0 accent-[var(--primary)]"
              />
              {t.onboarding.stages[s]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ConfidenceRow({
  id,
  label,
  value,
  onChange,
  scale,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  scale: readonly string[];
}) {
  return (
    <fieldset className="rounded-2xl border bg-card p-4">
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p aria-hidden="true" className="font-semibold">
          {label}
        </p>
        <p className="text-sm text-muted-foreground sm:hidden" aria-hidden="true">
          {scale[value - 1]}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            title={scale[n - 1]}
            className={cn(
              "flex h-11 cursor-pointer items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-colors",
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-offset-2",
              n <= value ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent",
            )}
          >
            <input
              type="radio"
              name={id}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
              aria-label={`${label}: ${n} – ${scale[n - 1]}`}
            />
            {n}
          </label>
        ))}
      </div>
      <p className="mt-2 hidden text-sm text-muted-foreground sm:block" aria-live="polite">
        {scale[value - 1]}
      </p>
    </fieldset>
  );
}

export default function Onboarding() {
  const t = useT();
  const O = t.onboarding;
  const navigate = useNavigate();
  const { profile, saveOnboarding } = useAuth();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Prefill from the profile, ignoring values from the old student-only model.
  const [d, setD] = useState<Draft>(() => ({
    careerStage: isValid(CAREER_STAGES, profile?.careerStage ? [profile.careerStage] : [])[0] ?? "",
    university: profile?.university ?? "",
    program: isValid(PROGRAMS, profile?.program ? [profile.program] : [])[0] ?? "",
    areas: isValid(AREAS, profile?.areas),
    goals: isValid(GOALS, profile?.goals),
    confidence: { ...DEFAULT_CONFIDENCE, ...profile?.confidence },
  }));

  // Move focus to the new step's heading so screen-reader and keyboard users keep their place.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step]);

  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const isStudent = !!d.careerStage && STUDENT_STAGES.includes(d.careerStage);

  function validate(): string | null {
    if (step === 1 && !d.careerStage) return O.steps.moment.required;
    if (step === 2 && d.areas.length === 0) return O.steps.areas.min;
    if (step === 3 && d.goals.length === 0) return O.steps.goals.min;
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    setError(v);
    if (v) return;
    if (step < TOTAL) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      await saveOnboarding({
        careerStage: d.careerStage as CareerStageId,
        areas: d.areas,
        goals: d.goals,
        confidence: d.confidence,
        // University details only make sense (and are only kept) for students.
        university: isStudent ? d.university.trim() : "",
        program: isStudent ? d.program : "",
      });
      navigate("/app", { replace: true });
    } catch {
      setError(t.auth.errors.generic);
      setBusy(false);
    }
  }

  const stepMeta = [O.steps.moment, O.steps.areas, O.steps.goals, O.steps.confidence][step - 1];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo to="/" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">{fmt(O.progress, { current: step, total: TOTAL })}</span>
            <ThemeToggle />
          </div>
        </div>
        <Progress value={(step / TOTAL) * 100} label={O.title} className="h-1 rounded-none" />
      </header>

      <main id="main" className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
        <p className="label-mono text-primary">{O.title}</p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl font-semibold outline-none sm:text-4xl">
          {stepMeta.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{stepMeta.subtitle}</p>

        <form onSubmit={onSubmit} noValidate className="mt-8">
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <StageCards value={d.careerStage} onChange={(careerStage) => setD({ ...d, careerStage })} />
              {isStudent && (
                <div className="grid gap-5 rounded-2xl border bg-card p-5 sm:grid-cols-2">
                  <Field
                    id="ob-university"
                    label={`${O.steps.moment.university} (${t.common.optional.toLowerCase()})`}
                    hint={O.steps.moment.studentHint}
                  >
                    {(a) => (
                      <Input
                        {...a}
                        value={d.university}
                        maxLength={120}
                        autoComplete="organization"
                        placeholder={O.steps.moment.universityPlaceholder}
                        onChange={(e) => setD({ ...d, university: e.target.value })}
                      />
                    )}
                  </Field>
                  <Field id="ob-program" label={`${O.steps.moment.program} (${t.common.optional.toLowerCase()})`}>
                    {(a) => (
                      <Select {...a} value={d.program} onChange={(e) => setD({ ...d, program: e.target.value as ProgramId })}>
                        <option value="">{O.steps.moment.programPlaceholder}</option>
                        {PROGRAMS.map((p) => (
                          <option key={p} value={p}>
                            {O.programs[p]}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <>
              <p id="areas-count" className="mb-4 text-sm font-medium text-muted-foreground" aria-live="polite">
                {fmt(O.selected, { count: d.areas.length, max: MAX_AREAS })}
              </p>
              <ChipGroup<AreaId>
                legend={O.steps.areas.title}
                options={AREAS}
                selected={d.areas}
                labels={O.areas}
                max={MAX_AREAS}
                describedBy="areas-count"
                onToggle={(v) => setD({ ...d, areas: toggle(d.areas, v) })}
              />
            </>
          )}

          {step === 3 && (
            <>
              <p id="goals-count" className="mb-4 text-sm font-medium text-muted-foreground" aria-live="polite">
                {fmt(O.selected, { count: d.goals.length, max: MAX_GOALS })}
              </p>
              <ChipGroup<GoalId>
                legend={O.steps.goals.title}
                options={GOALS}
                selected={d.goals}
                labels={O.goals}
                max={MAX_GOALS}
                describedBy="goals-count"
                onToggle={(v) => setD({ ...d, goals: toggle(d.goals, v) })}
              />
            </>
          )}

          {step === 4 && (
            <>
              <p className="mb-4 text-sm font-medium text-muted-foreground">{O.steps.confidence.scaleShort}</p>
              <div className="grid gap-3">
                {SKILLS.map((s) => (
                  <ConfidenceRow
                    key={s}
                    id={`conf-${s}`}
                    label={O.skills[s]}
                    value={d.confidence[s]}
                    scale={O.steps.confidence.scale}
                    onChange={(v) => setD({ ...d, confidence: { ...d.confidence, [s]: v } })}
                  />
                ))}
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <WhyWeAsk>{stepMeta.why}</WhyWeAsk>

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setError(null);
                  setStep(step - 1);
                }}
              >
                <ArrowLeft /> {t.common.back}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" variant={step === TOTAL ? "cta" : "default"} size="lg" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" /> {O.saving}
                </>
              ) : step === TOTAL ? (
                <>
                  {O.finish} <ArrowRight />
                </>
              ) : (
                <>
                  {t.common.continue} <ArrowRight />
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
