import { FileText } from "lucide-react";

import { Note } from "@/components/shell/note";

const log = [
  { who: "Me", text: "Write an intro on the two-lane model" },
  { who: "AI", text: "Sure! It was introduced in 2019 by", flagged: true },
  { who: "Me", text: "That's wrong. Check the date." },
  { who: "AI", text: "You're right, apologies for the error." },
  { who: "Me", text: "Cite a source for paragraph two" },
  { who: "AI", text: "Smith & Lee (2019), J. Assessment", flagged: true },
  { who: "Me", text: "That paper doesn't exist." },
  { who: "AI", text: "Here's a revised version:" },
  { who: "Me", text: "Shorter. Keep my argument." },
  { who: "AI", text: "As an AI language model, I" },
  { who: "Me", text: "Para 2 contradicts para 4" },
  { who: "AI", text: "Good catch! Updated below." },
  { who: "Me", text: "Rewrite it in my own voice" },
  { who: "AI", text: "Certainly! Here is the essay:" },
];

const kicker = "text-kicker tracking-kicker mb-2.5 block font-bold uppercase";

export const LandingArt = () => (
  <div aria-hidden="true" className="relative mt-15 h-190 max-[1100px]:hidden">
    <div className="text-ai absolute -top-2 -left-7.5 z-3 flex -rotate-4 items-start gap-1.5 text-2xl font-semibold whitespace-nowrap">
      <span>the messy middle, made readable</span>
      <svg
        className="overflow-visible"
        fill="none"
        height="48"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
        viewBox="0 0 84 48"
        width="84"
      >
        <path
          className="draw-in [--len:110]"
          d="M4 6 C44 8 64 20 76 40 M76 40 l-13 -4 M76 40 l2 -13"
        />
      </svg>
    </div>
    <div className="bg-card shadow-lift absolute top-11.5 left-20 h-160 w-130 rotate-7 rounded-lg" />
    <div className="bg-card shadow-lift absolute top-15 left-5 h-160 w-130 -rotate-5 rounded-lg" />
    <article className="bg-card shadow-lift absolute top-9 left-0 h-165 w-140 rotate-(--paper-rotation) overflow-hidden rounded-lg [--paper-rotation:-1.5deg]">
      <header className="bg-subtle text-body text-caption flex h-13 items-center gap-3 px-5.5 font-semibold">
        <FileText className="text-ai size-5.5" />
        essay2-ai-log.docx
      </header>
      <ul className="text-ui grid gap-3.25 px-7 py-6.5">
        {log.map(({ who, text, flagged }) => (
          <li className="text-body grid grid-cols-[2.75rem_1fr]" key={text}>
            <b className={who === "Me" ? "text-human" : "text-ai"}>{who}:</b>
            <span
              className={
                flagged
                  ? "decoration-destructive underline decoration-wavy decoration-2 underline-offset-6"
                  : undefined
              }
            >
              {text}
            </span>
          </li>
        ))}
      </ul>
    </article>
    <Note className="absolute top-17 left-85 z-2 w-72.5 rotate-5" tone="yellow">
      <span className={`${kicker} text-human`}>John&apos;s critique</span>
      <p>Wrong date. Sydney introduced it in 2023.</p>
    </Note>
    <Note className="absolute top-95 -left-22.5 z-2 w-70 -rotate-6" tone="pink">
      <span className={`${kicker} text-destructive`}>Reflection check</span>
      <p>“Looks good.” Take a closer look.</p>
    </Note>
    <Note className="absolute top-135 left-95 z-2 w-65 rotate-3" tone="mint">
      <span className={`${kicker} text-success`}>AI error caught</span>
      <p>Fake source replaced.</p>
    </Note>
  </div>
);
