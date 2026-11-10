import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n";
import { backend, BackendError } from "@/lib/backend";
import { useNextPath } from "@/lib/routes";

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const t = useT();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy p-12 pb-20 text-navy-foreground lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.08)_1px,transparent_1px)] [background-size:40px_40px]"
        />
        <Logo className="relative" />
        <div className="relative">
          <p className="font-display text-4xl font-semibold leading-tight">{t.landing.hero.title}</p>
          <p className="mt-4 max-w-md text-navy-foreground/75">{t.brand.tagline}</p>
        </div>
        <p className="relative flex items-center gap-2 text-sm text-navy-foreground/75">
          <ShieldCheck className="size-4" aria-hidden="true" /> {t.auth.privacyNote}
        </p>
      </div>
      <div className="flex flex-col">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Logo className="lg:invisible" />
          <ThemeToggle />
        </div>
        <main id="main" className="flex flex-1 items-start justify-center px-4 pb-24 pt-6 sm:items-center sm:px-6">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupPage() {
  const t = useT();
  const navigate = useNavigate();
  const nextPath = useNextPath();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<ReactNode>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t.auth.errors.nameRequired;
    if (!EMAIL_RE.test(email.trim())) next.email = t.auth.errors.invalidEmail;
    if (password.length < 8) next.password = t.auth.errors.shortPassword;
    if (!consent) next.consent = t.auth.errors.consentRequired;
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) {
      document.getElementById(`signup-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const res = await backend.signUp({ email: email.trim(), password, displayName: name.trim() });
      if (res.needsEmailConfirmation) setInfo(t.auth.checkEmail);
      else navigate(nextPath ?? "/onboarding");
    } catch (err) {
      if (err instanceof BackendError && err.code === "emailTaken") {
        setFormError(
          <>
            {t.auth.errors.emailTaken}{" "}
            <Link to="/login" className="font-semibold underline">
              {t.auth.toLogin}
            </Link>
          </>,
        );
      } else setFormError(t.auth.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title={t.auth.signupTitle} subtitle={t.auth.signupSubtitle}>
      {info ? (
        <p role="status" className="rounded-xl border border-primary/30 bg-primary/10 p-4 font-medium">
          {info}
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <Field id="signup-name" label={t.auth.name} hint={t.auth.nameHint} error={errors.name}>
            {(a) => <Input {...a} autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />}
          </Field>
          <Field id="signup-email" label={t.auth.email} hint={t.auth.emailHint} error={errors.email}>
            {(a) => <Input {...a} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field id="signup-password" label={t.auth.password} hint={t.auth.passwordHint} error={errors.password}>
            {(a) => (
              <Input {...a} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            )}
          </Field>
          <div>
            <label className="flex items-start gap-3 text-sm">
              <input
                id="signup-consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? "signup-consent-error" : undefined}
                className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
              />
              <span className="text-muted-foreground">{t.auth.consent}</span>
            </label>
            {errors.consent && (
              <p id="signup-consent-error" className="mt-2 text-sm font-medium text-destructive">
                {errors.consent}
              </p>
            )}
          </div>
          {formError && (
            <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {formError}
            </p>
          )}
          <Button type="submit" size="lg" disabled={busy}>
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {t.auth.submitSignup}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t.auth.haveAccount}{" "}
            <Link to={nextPath ? `/login?next=${nextPath}` : "/login"} className="font-semibold text-primary underline-offset-4 hover:underline">
              {t.auth.toLogin}
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}

export function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const nextPath = useNextPath();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim()) || !password) {
      setError(t.auth.errors.invalidCredentials);
      return;
    }
    setBusy(true);
    try {
      await backend.signIn(email.trim(), password);
      navigate(nextPath ?? "/app");
    } catch (err) {
      setError(err instanceof BackendError && err.code === "invalidCredentials" ? t.auth.errors.invalidCredentials : t.auth.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field id="login-email" label={t.auth.email}>
          {(a) => <Input {...a} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        <Field id="login-password" label={t.auth.password}>
          {(a) => (
            <Input {...a} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
        </Field>
        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={busy}>
          {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
          {t.auth.submitLogin}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t.auth.noAccount}{" "}
          <Link to={nextPath ? `/signup?next=${nextPath}` : "/signup"} className="font-semibold text-primary underline-offset-4 hover:underline">
            {t.auth.toSignup}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
