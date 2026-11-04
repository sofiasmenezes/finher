import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, EyeOff, Lock, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { fmt, useT } from "@/i18n";
import { cn } from "@/lib/utils";

const SAFETY_ICONS: LucideIcon[] = [Wallet, Lock, EyeOff, ShieldCheck];

const two = (n: number) => String(n).padStart(2, "0");

function Eyebrow({ children, onDark, n }: { children: React.ReactNode; onDark?: boolean; n?: number }) {
  return (
    <p className={cn("label-mono", onDark ? "text-cta" : "text-primary")}>
      {n !== undefined && <>Nº {two(n)} — </>}
      {children}
    </p>
  );
}

/** "First sentence. Second sentence." → the second one gets the highlighter. */
function HeroTitle({ text }: { text: string }) {
  const cut = text.indexOf(". ");
  if (cut < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, cut + 1)} <span className="highlight italic">{text.slice(cut + 2)}</span>
    </>
  );
}

/** Running strip of what's inside, like a market ticker. */
function Ticker() {
  const items = useT().landing.ticker;
  return (
    <div className="overflow-hidden bg-navy text-navy-foreground" aria-hidden="true">
      <div className="mx-auto flex max-w-7xl items-center gap-5 whitespace-nowrap px-4 py-2.5 sm:px-6">
        {items.map((item, i) => (
          <Fragment key={item}>
            {i > 0 && <span className="text-cta">✦</span>}
            <span className="label-mono">{item}</span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/** Hero visual: what a personalized path looks like (clearly marked as an example). */
function PathPreview() {
  const t = useT();
  const P = t.landing.preview;
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute -right-3 -top-3 hidden size-full rounded-2xl bg-cta sm:block" />
      <div className="relative rounded-2xl border border-foreground bg-card p-5 sm:p-7">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-2xl font-semibold">{P.title}</p>
          <span className="label-mono text-primary">{P.sample}</span>
        </div>

        <dl className="mt-4 grid grid-cols-2 border-y border-foreground py-3">
          <div>
            <dt className="label-mono text-muted-foreground">{P.stageLabel}</dt>
            <dd className="mt-1 text-sm font-semibold">{P.stageValue}</dd>
          </div>
          <div>
            <dt className="label-mono text-muted-foreground">{P.areasLabel}</dt>
            <dd className="mt-1 text-sm font-semibold">{P.areasValue}</dd>
          </div>
        </dl>

        <p className="label-mono mt-5 text-primary">{P.nextLabel}</p>
        <ol className="mt-1">
          {P.steps.map((s, i) => (
            <li key={s} className="flex items-center gap-4 border-b py-3.5 text-[0.95rem] font-medium last:border-b-0">
              <span className="font-display text-2xl italic text-primary">{two(i + 1)}</span>
              {s}
            </li>
          ))}
        </ol>

        <p className="mt-3 rounded-xl bg-muted px-3 py-2.5 text-sm">
          <span className="text-muted-foreground">{P.communityLabel}: </span>
          <span className="font-semibold">{P.communityValue}</span>
        </p>
      </div>
    </div>
  );
}

export default function Landing() {
  const t = useT();
  const L = t.landing;

  return (
    <>
      <SiteHeader />
      <Ticker />
      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-20 lg:pb-24 lg:pt-20">
            <div>
              <Eyebrow n={1}>{L.hero.eyebrow}</Eyebrow>
              <h1 className="mt-6 text-[2.75rem] font-normal leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-[5.25rem]">
                <HeroTitle text={L.hero.title} />
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">{L.hero.subtitle}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/signup">
                    {L.hero.ctaPrimary} <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#how">{L.hero.ctaSecondary}</a>
                </Button>
              </div>
              <p className="label-mono mt-5 text-muted-foreground">{L.hero.note}</p>
            </div>
            <div className="lg:pl-4">
              <PathPreview />
            </div>
          </div>
        </section>

        {/* Four doors */}
        <section id="pillars" className="scroll-mt-20 border-y border-foreground" aria-labelledby="pillars-title">
          <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:pt-20">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
              <div>
                <Eyebrow n={2}>{L.pillars.eyebrow}</Eyebrow>
                <h2 id="pillars-title" className="mt-4 text-4xl font-normal sm:text-6xl">
                  {L.pillars.title}
                </h2>
              </div>
              <p className="max-w-xl text-lg text-muted-foreground lg:justify-self-end">{L.pillars.body}</p>
            </div>
          </div>
          <ul className="mx-auto mt-12 grid max-w-7xl sm:grid-cols-2 lg:grid-cols-4">
            {L.pillars.items.map((p, i) => (
              <li
                key={p.id}
                className={cn(
                  "flex flex-col gap-3 border-t px-4 py-8 sm:px-6 lg:py-10",
                  i % 2 === 1 && "sm:border-l",
                  i > 0 && "lg:border-l",
                )}
              >
                <p className="label-mono text-primary">
                  {L.door} {two(i + 1)}
                </p>
                <h3 className="text-3xl font-medium">{p.title}</h3>
                <p className="text-muted-foreground">{p.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* The gap */}
        <section className="bg-navy text-navy-foreground" aria-labelledby="gap-title">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="max-w-4xl">
              <Eyebrow onDark n={3}>
                {L.gap.eyebrow}
              </Eyebrow>
              <h2 id="gap-title" className="mt-4 text-4xl font-normal italic leading-[1.05] sm:text-6xl lg:text-7xl">
                {L.gap.title}
              </h2>
              <p className="mt-6 max-w-2xl text-lg text-navy-foreground/80">{L.gap.intro}</p>
            </div>
            <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-white/15 md:grid-cols-3">
              {L.gap.items.map((item, i) => (
                <li key={item.title} className="bg-navy p-6 sm:p-8">
                  <span className="font-display text-3xl italic text-cta">{two(i + 1)}</span>
                  <h3 className="mt-4 text-2xl font-medium">{item.title}</h3>
                  <p className="mt-2 text-navy-foreground/80">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20" aria-labelledby="how-title">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="max-w-2xl">
              <Eyebrow n={4}>{L.how.eyebrow}</Eyebrow>
              <h2 id="how-title" className="mt-4 text-4xl font-normal sm:text-6xl">
                {L.how.title}
              </h2>
            </div>
            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {L.how.steps.map((s, i) => (
                <li key={s.title} className="border-t border-foreground pt-6">
                  <span className="font-display text-6xl italic leading-none text-primary">{two(i + 1)}</span>
                  <h3 className="mt-5 text-2xl font-medium">{s.title}</h3>
                  <p className="mt-2 text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Universities */}
        <section id="universities" className="scroll-mt-20 border-y bg-card" aria-labelledby="uni-title">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24">
            <div>
              <Eyebrow n={5}>{L.universities.eyebrow}</Eyebrow>
              <h2 id="uni-title" className="mt-4 text-4xl font-normal sm:text-5xl">
                {L.universities.title}
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">{L.universities.body}</p>
              <div className="mt-8">
                <Button asChild variant="outline" size="lg">
                  <Link to="/signup">
                    {L.universities.cta} <ArrowRight />
                  </Link>
                </Button>
                <p className="mt-3 text-sm text-muted-foreground">{L.universities.ctaNote}</p>
              </div>
            </div>
            <ul className="self-center">
              {L.universities.items.map((item) => (
                <li key={item} className="flex items-start gap-3 border-b py-4 first:border-t">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-lg font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Safety */}
        <section id="safety" className="scroll-mt-20" aria-labelledby="safety-title">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="max-w-2xl">
              <Eyebrow n={6}>{L.safety.eyebrow}</Eyebrow>
              <h2 id="safety-title" className="mt-4 text-4xl font-normal sm:text-5xl">
                {L.safety.title}
              </h2>
            </div>
            <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {L.safety.items.map((s, i) => {
                const Icon = SAFETY_ICONS[i];
                return (
                  <li key={s.title}>
                    <span className="grid size-11 place-items-center rounded-full bg-cta text-cta-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-xl font-medium">{s.title}</h3>
                    <p className="mt-2 text-muted-foreground">{s.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t bg-card" aria-labelledby="faq-title">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 id="faq-title" className="text-4xl font-normal sm:text-5xl">
              {L.faq.title}
            </h2>
            <div className="mt-8 border-t border-foreground">
              {L.faq.items.map((f) => (
                <details key={f.q} className="group border-b py-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-lg font-medium">
                    {f.q}
                    <span className="font-display text-2xl text-primary transition-transform group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-7xl rounded-3xl bg-navy px-6 py-16 text-center text-navy-foreground sm:px-12 sm:py-24">
            <h2 className="mx-auto max-w-4xl text-4xl font-normal italic sm:text-6xl">{L.finalCta.title}</h2>
            <Button asChild variant="cta" size="lg" className="mt-10">
              <Link to="/signup">
                {L.finalCta.cta} <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-foreground pb-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-muted-foreground">{t.brand.tagline}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:items-end">
            <ul className="flex gap-4">
              <li>{L.footer.privacy}</li>
              <li>{L.footer.conduct}</li>
              <li>{L.footer.contact}</li>
            </ul>
            <p>{fmt(L.footer.rights, { year: new Date().getFullYear() })}</p>
            <p className="max-w-sm sm:text-right">{L.footer.academic}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
