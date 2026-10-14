import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";

import type { SubmissionDetail } from "@/app/instructor/visualiser/submission-detail";
import { MARKS, MarkedAnswer } from "@/app/student/log/marked-answer";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";
import {
  countWords,
  critiqueOrder,
  critiqueQuestions,
  formatWords,
} from "@/lib/process";
import { cn } from "@/lib/utils";

/* Past this many words, prompts and answers collapse to four lines. ChatGPT replies often run to hundreds. */
const LONG_TEXT_WORDS = 45;

type DetailStep = SubmissionDetail["steps"][number];

const FLAG_STATE: Record<DetailStep["flags"][number]["state"], string> = {
  added_to_feedback: "Added to feedback",
  dismissed: "Dismissed",
  open: "Open",
};

const Clamped = ({
  words,
  children,
}: {
  words: number;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const long = words > LONG_TEXT_WORDS;
  return (
    <>
      <p
        className={cn(
          "text-body break-words whitespace-pre-wrap",
          long && !open && "line-clamp-4",
          open && "max-h-96 overflow-y-auto pr-1"
        )}
      >
        {children}
      </p>
      {long ? (
        <button
          aria-expanded={open}
          className="text-ai-ink text-meta mt-1 hover:underline"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? "Show less" : `Show all ${words.toLocaleString("en")} words`}
        </button>
      ) : null}
    </>
  );
};

const Field = ({
  label,
  meta,
  children,
}: {
  label: string;
  meta?: ReactNode;
  children: ReactNode;
}) => (
  <section>
    <div className="mb-1.25 flex items-center gap-2">
      <h3 className="text-label text-muted-foreground font-emphasis">
        {label}
      </h3>
      <span className="text-muted-foreground text-label ml-auto">{meta}</span>
    </div>
    {children}
  </section>
);

const FlagCard = ({ flag }: { flag: DetailStep["flags"][number] }) => (
  <div
    className={cn(
      "rounded-lg px-3 py-2.75",
      flag.state === "open"
        ? "bg-flag-soft text-flag-ink shadow-flag-ring"
        : "bg-muted text-muted-foreground shadow-hairline"
    )}
  >
    <div className="font-heading flex items-center gap-1.75">
      <Icon name="flag" />
      {flag.label}
      <span className="text-label font-emphasis ml-auto">
        {FLAG_STATE[flag.state]}
      </span>
    </div>
    <p className="mt-0.75 ml-5.75 whitespace-pre-line">{flag.explanation}</p>
    {flag.evidence ? (
      <blockquote className="mt-1.5 ml-5.75 border-l-2 pl-2.5 font-serif whitespace-pre-line">
        {flag.evidence}
      </blockquote>
    ) : null}
    <div className="text-label mt-2 ml-5.75 flex items-center gap-2">
      <p className="opacity-60">Reflection check · suggested</p>
      <Link
        className="font-emphasis ml-auto underline-offset-4 hover:underline"
        href="/instructor/flags"
      >
        Review in Flags
      </Link>
    </div>
  </div>
);

const MarkKey = ({ marks }: { marks: DetailStep["marks"] }) => (
  <ul className="text-label text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
    {MARKS.filter(({ kind }) => marks.some((mark) => mark.kind === kind)).map(
      ({ kind, label, style }) => (
        <li key={kind}>
          <span className={cn("px-0.5", style)}>{label}</span>
        </li>
      )
    )}
  </ul>
);

const CritiqueQuestions = ({
  answered,
}: {
  answered: DetailStep["answered"];
}) => (
  <ul className="mt-2.5 flex flex-wrap gap-1.5">
    {critiqueOrder.map((question) => {
      const done = answered[question];
      return (
        <li
          className={cn(
            "flex h-6 items-center gap-1.5 rounded-full pr-2 pl-1.25 text-xs",
            done
              ? "bg-success-soft text-success"
              : "text-muted-foreground shadow-hairline"
          )}
          key={question}
        >
          <span
            className={cn(
              "grid size-3.75 place-items-center rounded-full",
              done ? "bg-card" : "bg-muted text-faint"
            )}
          >
            <Icon className="size-2.5" name={done ? "check" : "x"} />
          </span>
          {critiqueQuestions[question]}
          <span className="sr-only">{done ? "answered" : "not answered"}</span>
        </li>
      );
    })}
  </ul>
);

export const StepCard = ({
  animate,
  children,
  index,
  onSelect,
  step,
}: {
  animate: boolean;
  children: ReactNode;
  index: number;
  onSelect: (index: number) => void;
  step: DetailStep;
}) => (
  <Card>
    <CardHeader>
      <span className="bg-muted shadow-hairline text-label rounded-sm px-1.5 font-mono leading-5">
        S{index + 1}
      </span>
      <CardTitle>{step.title}</CardTitle>
      <CardAction>
        <Button
          aria-label="Previous step"
          onClick={() => onSelect(index - 1)}
          size="icon-sm"
          variant="ghost"
        >
          <Icon name="left" />
        </Button>
        <Button
          aria-label="Next step"
          onClick={() => onSelect(index + 1)}
          size="icon-sm"
          variant="ghost"
        >
          <Icon name="right" />
        </Button>
      </CardAction>
    </CardHeader>
    <div
      aria-live="polite"
      className={cn(
        "flex flex-col gap-3.5 px-4.5 py-3.5",
        animate && "animate-swap"
      )}
      key={step.id}
    >
      {step.flags.map((flag) => (
        <FlagCard flag={flag} key={flag.id} />
      ))}
      {step.markedError ? (
        <div className="bg-success-soft text-success rounded-lg px-3 py-2.25">
          <div className="font-emphasis flex items-center gap-2">
            <Icon name="caught" />
            Student marked an AI error
          </div>
          {step.evidence ? (
            <p className="mt-1 ml-6 whitespace-pre-line">{step.evidence}</p>
          ) : null}
        </div>
      ) : null}
      <Field
        label="Asked"
        meta={<span className="font-mono">{step.time}</span>}
      >
        <Clamped words={countWords(step.asked)}>{step.asked}</Clamped>
      </Field>
      <Field
        label="AI answered"
        meta={
          <>
            {formatWords(step.words)}
            {step.carried > 0 ? (
              <span className="text-ai-ink">
                {" "}
                · {step.carried.toLocaleString("en")} reached the essay
              </span>
            ) : null}
          </>
        }
      >
        <Clamped words={step.words}>
          <MarkedAnswer marks={step.marks} text={step.answer} />
        </Clamped>
        {step.marks.length > 0 ? <MarkKey marks={step.marks} /> : null}
      </Field>
      <Field label="Critique" meta={formatWords(step.critiqueWords)}>
        {step.critique === "" ? (
          <p className="text-muted-foreground">
            No critique was written for this step.
          </p>
        ) : (
          <blockquote
            className={cn(
              "text-reading text-lead border-l-2 pl-3 font-serif whitespace-pre-line",
              step.flag ? "border-flag" : "border-border-strong"
            )}
          >
            {step.critique}
          </blockquote>
        )}
        <CritiqueQuestions answered={step.answered} />
      </Field>
    </div>
    {children}
  </Card>
);
