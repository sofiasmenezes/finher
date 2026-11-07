import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock3, Headphones } from "lucide-react";
import { Prose } from "@/components/content/blocks";
import { StoryAudio } from "@/components/content/story-audio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStory, INTERVIEWS, STORIES, STORY_PARTS } from "@/content/loader";
import { fmt, useT } from "@/i18n";
import { AREAS, CAREER_STAGES, type AreaId, type CareerStageId } from "@/lib/domain";
import { paths } from "@/lib/routes";

const formatDate = (iso: string, locale: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { month: "long", year: "numeric" });

export function StoriesPage() {
  const t = useT();
  const J = t.journeys;
  const [stage, setStage] = useState<CareerStageId | "">("");
  const [area, setArea] = useState<AreaId | "">("");

  const illustrative = STORIES.filter((s) => s.kind !== "interview");
  const stories = INTERVIEWS.filter((s) => (!stage || s.stages.includes(stage)) && (!area || s.areas.includes(area)));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <header>
        <p className="label-mono text-primary">{J.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{J.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{J.subtitle}</p>
      </header>

      {/* Real stories */}
      <section aria-labelledby="stories-title">
        <h2 id="stories-title" className="text-2xl font-semibold">
          {J.storiesTitle}
        </h2>
        {INTERVIEWS.length === 0 ? (
          <p className="mt-4 flex max-w-2xl gap-3 rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
            <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {J.storiesEmpty}
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="story-stage">{J.filterStage}</Label>
                <Select id="story-stage" value={stage} onChange={(e) => setStage(e.target.value as CareerStageId | "")} className="min-w-56">
                  <option value="">{J.all}</option>
                  {CAREER_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {t.onboarding.stages[s]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="story-area">{J.filterArea}</Label>
                <Select id="story-area" value={area} onChange={(e) => setArea(e.target.value as AreaId | "")} className="min-w-56">
                  <option value="">{J.all}</option>
                  {AREAS.filter((a) => a !== "notSure").map((a) => (
                    <option key={a} value={a}>
                      {t.onboarding.areas[a]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {stories.map((s) => (
                <li key={s.id}>
                  <Link
                    to={paths.story(s.id)}
                    className="group flex h-full flex-col gap-2 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md"
                  >
                    <Badge className="self-start">{J.interview}</Badge>
                    <span className="font-display text-lg font-bold">{s.title}</span>
                    <span className="text-sm font-medium">
                      {s.displayName}
                      {s.role ? ` · ${s.role}` : ""}
                    </span>
                    <span className="text-sm text-muted-foreground">{s.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {illustrative.length > 0 && (
        <section aria-labelledby="illustrative-title">
          <h2 id="illustrative-title" className="text-2xl font-semibold">
            {J.illustrativeTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{J.illustrativeBody}</p>
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {illustrative.map((s) => (
              <li key={s.id}>
                <Link to={paths.story(s.id)} className="group flex h-full flex-col gap-2 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md">
                  <Badge variant="outline" className="self-start">
                    {s.kind === "composite" ? t.family.composite : t.family.illustrative}
                  </Badge>
                  <span className="font-display text-lg font-bold">{s.title}</span>
                  {s.summary && <span className="text-sm text-muted-foreground">{s.summary}</span>}
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-primary">
                    <Headphones className="size-4" aria-hidden="true" /> {t.audio.listen}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function StoryPage() {
  const t = useT();
  const J = t.journeys;
  const { storyId = "" } = useParams();
  const story = getStory(storyId);

  if (!story) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-2xl border border-dashed p-6 text-muted-foreground">{t.notFound.body}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={paths.stories}>
            <ArrowLeft /> {J.storyBack}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link to={paths.stories} className="flex w-fit items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" /> {J.storyBack}
        </Link>
        {story.kind === "interview" ? (
          <Badge className="mt-4">{J.interview}</Badge>
        ) : (
          <Badge variant="outline" className="mt-4">
            {story.kind === "composite" ? t.family.composite : t.family.illustrative}
          </Badge>
        )}
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{story.title}</h1>
        <p className="mt-2 font-medium">
          {story.displayName}
          {story.role ? ` · ${story.role}` : ""}
        </p>
        {story.interviewDate && (
          <p className="mt-1 text-sm text-muted-foreground">{fmt(J.interviewedOn, { date: formatDate(story.interviewDate, t.locale) })}</p>
        )}
      </div>
      <StoryAudio story={story} />
      {!STORY_PARTS.some((p) => story.parts[p]) && (
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <Prose html={story.html} />
        </section>
      )}
      {STORY_PARTS.filter((p) => story.parts[p]).map((p, i) => (
        <section key={p} className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="flex items-baseline gap-3 text-lg font-bold">
            <span className="tabular font-mono text-sm text-primary">0{i + 1}</span>
            {J.storyParts[p]}
          </h2>
          <Prose html={story.parts[p]!} className="mt-3" />
        </section>
      ))}
    </article>
  );
}
