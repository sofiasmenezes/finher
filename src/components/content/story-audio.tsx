import { useEffect, useMemo, useRef, useState } from "react";
import { Headphones, Pause, Play, SkipBack, SkipForward, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORY_PARTS, type Story } from "@/content/loader";
import { fmt, useT } from "@/i18n";
import { cn } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

interface Chapter {
  label: string;
  text: string;
}

const htmlToText = (html: string) => {
  if (typeof DOMParser === "undefined") return html.replace(/<[^>]+>/g, " ");
  return new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
};

/** Speech engines cut long utterances off, so read sentence by sentence (max ~220 chars). */
export function chunk(text: string, max = 220): string[] {
  const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?…]+[.!?…]*["”»)]?\s*/g) ?? [];
  const out: string[] = [];
  for (const raw of sentences) {
    let s = raw.trim();
    while (s.length > max) {
      const cut = s.lastIndexOf(" ", max);
      const at = cut > max / 2 ? cut : max;
      out.push(s.slice(0, at).trim());
      s = s.slice(at).trim();
    }
    if (s) out.push(s);
  }
  return out;
}

function chaptersOf(story: Story, partLabels: Record<string, string>): Chapter[] {
  const parts = STORY_PARTS.filter((p) => story.parts[p]);
  if (parts.length) {
    return parts.map((p, i) => ({
      label: partLabels[p],
      text: `${i === 0 ? `${story.title}. ` : ""}${partLabels[p]}. ${htmlToText(story.parts[p]!)}`,
    }));
  }
  return [{ label: story.title, text: `${story.title}. ${htmlToText(story.html)}` }];
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === "pt-BR") ?? voices.find((v) => v.lang.toLowerCase().startsWith("pt"));
}

type Status = "idle" | "playing" | "paused";

/**
 * Audiobook mode for a story: plays recorded audio when the story has it,
 * otherwise reads the text aloud (pt-BR) with the browser's speech engine,
 * one chapter per story part.
 */
export function StoryAudio({ story, className }: { story: Story; className?: string }) {
  const t = useT();
  const A = t.audio;
  const chapters = useMemo(() => chaptersOf(story, t.journeys.storyParts as Record<string, string>), [story, t]);
  const [status, setStatus] = useState<Status>("idle");
  const [chapter, setChapter] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const run = useRef(0); // bumps on every start/stop so callbacks from old utterances are ignored
  const supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  useEffect(() => {
    if (!supported) return;
    // Voices load asynchronously in some browsers.
    window.speechSynthesis.getVoices();
    return () => {
      run.current++;
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  function speak(from: number, rate = speed) {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const id = ++run.current;
    synth.cancel();
    setChapter(from);
    setStatus("playing");
    const voice = pickVoice();
    const queue = chapters.slice(from).flatMap((c, offset) => chunk(c.text).map((text) => ({ text, ch: from + offset })));
    queue.forEach((item, i) => {
      const u = new SpeechSynthesisUtterance(item.text);
      u.lang = "pt-BR";
      if (voice) u.voice = voice;
      u.rate = rate;
      u.onstart = () => {
        if (run.current === id) setChapter(item.ch);
      };
      if (i === queue.length - 1) {
        u.onend = () => {
          if (run.current === id) setStatus("idle");
        };
      }
      u.onerror = (e) => {
        if (run.current === id && e.error !== "interrupted" && e.error !== "canceled") setStatus("idle");
      };
      synth.speak(u);
    });
  }

  function stop() {
    run.current++;
    window.speechSynthesis.cancel();
    setStatus("idle");
  }

  function toggle() {
    const synth = window.speechSynthesis;
    if (status === "playing") {
      synth.pause();
      setStatus("paused");
    } else if (status === "paused") {
      synth.resume();
      setStatus("playing");
    } else {
      speak(chapter);
    }
  }

  const go = (to: number) => {
    const next = Math.max(0, Math.min(chapters.length - 1, to));
    if (status === "idle") setChapter(next);
    else speak(next);
  };

  const changeSpeed = (s: number) => {
    setSpeed(s);
    if (status !== "idle") speak(chapter, s); // a new rate only applies to new utterances
  };

  const shell = (children: React.ReactNode, hint: string) => (
    <section aria-label={A.title} className={cn("rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5", className)}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
          <Headphones className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="label-mono text-[0.62rem] text-primary">{A.title}</p>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );

  if (story.audio) {
    return shell(
      <audio controls preload="none" src={story.audio} className="w-full">
        {A.unsupported}
      </audio>,
      A.hintRecorded,
    );
  }

  if (!supported) return shell(<p className="text-sm">{A.unsupported}</p>, A.hintVoice);

  const many = chapters.length > 1;

  return shell(
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={toggle} aria-label={status === "playing" ? A.pause : status === "paused" ? A.resume : A.play}>
          {status === "playing" ? <Pause /> : <Play />}
          {status === "playing" ? A.pause : status === "paused" ? A.resume : A.play}
        </Button>
        {status !== "idle" && (
          <Button variant="ghost" size="icon" onClick={stop} aria-label={A.stop}>
            <Square />
          </Button>
        )}
        {many && (
          <>
            <Button variant="ghost" size="icon" onClick={() => go(chapter - 1)} disabled={chapter === 0} aria-label={A.previous}>
              <SkipBack />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => go(chapter + 1)} disabled={chapter === chapters.length - 1} aria-label={A.next}>
              <SkipForward />
            </Button>
          </>
        )}
        <div role="group" aria-label={A.speed} className="ml-auto flex items-center gap-1">
          <span className="label-mono mr-1 text-[0.62rem] text-muted-foreground">{A.speed}</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={speed === s}
              onClick={() => changeSpeed(s)}
              className={cn(
                "tabular min-h-8 rounded-full px-2.5 text-xs font-semibold transition-colors",
                speed === s ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              {String(s).replace(".", ",")}×
            </button>
          ))}
        </div>
      </div>
      {many && (
        <div>
          <p className="text-sm font-medium" aria-live="polite">
            {fmt(A.part, { n: chapter + 1, total: chapters.length })} · {chapters[chapter].label}
          </p>
          <ol aria-label={A.chapters} className="mt-2 flex flex-wrap gap-1.5">
            {chapters.map((c, i) => (
              <li key={c.label}>
                <button
                  type="button"
                  aria-current={i === chapter ? "step" : undefined}
                  onClick={() => (status === "idle" ? setChapter(i) : speak(i))}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    i === chapter ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-accent",
                  )}
                >
                  {String(i + 1).padStart(2, "0")} {c.label}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>,
    A.hintVoice,
  );
}
