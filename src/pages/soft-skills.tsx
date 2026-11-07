import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Bot, Check, Handshake, Mail, Mic, Shirt, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { Prose } from "@/components/content/blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SOFT_SKILLS, getSoftSkill } from "@/content/loader";
import { fmt, useT } from "@/i18n";
import { paths } from "@/lib/routes";
import { useChecklist } from "@/lib/use-checklist";
import type { MaterialTopic } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { RelatedMaterials } from "@/pages/materials";

/** Which material topics help practise each skill. */
const MATERIAL_TOPICS_FOR: Record<string, MaterialTopic[]> = {
  oratoria: ["communication", "psychology"],
  "presenca-executiva": ["communication", "leadership", "psychology"],
  "etiqueta-corporativa": ["communication", "career"],
  vestimenta: ["career", "leadership"],
  "comunicacao-escrita": ["communication"],
};

const ICONS: Record<string, LucideIcon> = { mic: Mic, handshake: Handshake, shirt: Shirt, mail: Mail, sparkles: Sparkles };

export function SoftSkillsPage() {
  const t = useT();
  const S = t.softSkills;
  const { done } = useChecklist();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <header>
        <p className="label-mono text-primary">{S.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{S.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{S.subtitle}</p>
        <p className="mt-4 flex max-w-2xl gap-3 rounded-xl bg-muted p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          {S.note}
        </p>
      </header>

      <ol className="grid gap-4 sm:grid-cols-2">
        {SOFT_SKILLS.map((s, i) => {
          const Icon = ICONS[s.icon] ?? Sparkles;
          const total = s.practice.length;
          const count = s.practice.filter((p) => done.has(p.id)).length;
          return (
            <li key={s.id}>
              <Link
                to={paths.softSkill(s.id)}
                className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg"
              >
                <span className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="tabular text-sm font-semibold text-primary">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="font-display text-lg font-bold leading-snug">{s.title}</span>
                <span className="text-sm text-muted-foreground">{s.summary}</span>
                {total > 0 && (
                  <span className="mt-auto flex items-center gap-3 pt-2">
                    <Progress value={(count / total) * 100} label={`${s.title}: ${fmt(S.done, { done: count, total })}`} />
                    <span className="tabular shrink-0 text-xs text-muted-foreground">{fmt(S.done, { done: count, total })}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {S.open} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function SoftSkillPage() {
  const t = useT();
  const S = t.softSkills;
  const { skillId = "" } = useParams();
  const { done, toggle } = useChecklist();
  const skill = getSoftSkill(skillId);

  if (!skill) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-2xl border border-dashed p-6 text-muted-foreground">{t.notFound.body}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={paths.softSkills}>
            <ArrowLeft /> {S.back}
          </Link>
        </Button>
      </div>
    );
  }

  const idx = SOFT_SKILLS.findIndex((s) => s.id === skill.id);
  const prev = SOFT_SKILLS[idx - 1];
  const next = SOFT_SKILLS[idx + 1];
  const count = skill.practice.filter((p) => done.has(p.id)).length;
  const ask = `${paths.assistant}?q=${encodeURIComponent(`Tenho uma dúvida sobre ${skill.title.toLowerCase()}: `)}`;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <Link to={paths.softSkills} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" /> {S.back}
        </Link>
        <p className="mt-4 label-mono text-primary">{S.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{skill.title}</h1>
        <p className="mt-2 text-muted-foreground">{skill.summary}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          {skill.sections.map((s) => (
            <section key={s.heading} className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-bold">{s.heading}</h2>
              <Prose html={s.html} className="mt-3" />
            </section>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          {skill.practice.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle as="h2">{S.practice}</CardTitle>
                <p className="text-sm text-muted-foreground">{S.practiceHint}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Progress value={(count / skill.practice.length) * 100} label={fmt(S.done, { done: count, total: skill.practice.length })} />
                <ul className="flex flex-col gap-1">
                  {skill.practice.map((c) => (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 text-sm hover:bg-accent/60">
                        <input
                          type="checkbox"
                          checked={done.has(c.id)}
                          onChange={(e) => toggle(c.id, e.target.checked)}
                          className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
                        />
                        <span className={cn(done.has(c.id) && "text-muted-foreground line-through")}>
                          {done.has(c.id) && <Check className="mr-1 inline size-3.5 text-primary" aria-hidden="true" />}
                          {c.text}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          <Button asChild variant="outline">
            <Link to={ask}>
              <Bot /> {S.askAssistant}
            </Link>
          </Button>
        </div>
      </div>

      <RelatedMaterials topics={MATERIAL_TOPICS_FOR[skill.id] ?? ["communication", "psychology"]} />

      <nav className="flex flex-col gap-3 sm:flex-row sm:justify-between" aria-label={S.back}>
        {prev ? (
          <Button asChild variant="outline">
            <Link to={paths.softSkill(prev.id)}>
              <ArrowLeft /> {fmt(S.previous, { title: prev.title })}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button asChild>
            <Link to={paths.softSkill(next.id)}>
              {fmt(S.next, { title: next.title })} <ArrowRight />
            </Link>
          </Button>
        )}
      </nav>
    </div>
  );
}
