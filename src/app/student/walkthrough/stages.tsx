import { useId } from "react";
import type { ReactNode } from "react";

import { MarkedAnswer } from "@/app/student/log/marked-answer";
import { Question } from "@/app/student/log/part";
import {
  earlierSteps,
  essayChoices,
  sampleAnswer,
  samplePrompt,
  sampleReview,
} from "@/app/student/walkthrough/sample-step";
import type { EssayChoice } from "@/app/student/walkthrough/sample-step";
import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icon";
import { CompositionBar } from "@/components/process/metrics";
import { ProcessBars } from "@/components/process/process-bars";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
  ToggleGroupThumb,
} from "@/components/ui/toggle-group";
import { MIN_MATCH_WORDS } from "@/lib/final-match";
import { countWords, formatPercent } from "@/lib/process";

const verdicts = [
  { dot: "bg-success", key: "right", label: "Right", tone: "success" },
  { dot: "bg-review", key: "partly", label: "Partly", tone: "review" },
  { dot: "bg-flag", key: "wrong", label: "Wrong", tone: "flag" },
] as const;

const Label = ({ children }: { children: ReactNode }) => (
  <h4 className="text-body text-label font-emphasis mb-1.5">{children}</h4>
);

const AnswerWell = () => (
  <div className="bg-muted shadow-hairline text-body rounded-lg px-4 py-3.5 text-sm leading-relaxed">
    {sampleAnswer}
  </div>
);

const ways: { body: string; icon: IconName; title: string }[] = [
  {
    body: "Paste the share link and the chat comes in as steps.",
    icon: "link",
    title: "Import a link",
  },
  {
    body: "Copy the conversation and paste it in.",
    icon: "note",
    title: "Paste the chat",
  },
];

export const LogStage = () => (
  <div className="grid gap-x-6 gap-y-5 sm:grid-cols-[minmax(0,1fr)_210px]">
    <div className="flex flex-col gap-4">
      <div>
        <Label>You asked</Label>
        <p className="text-reading text-read font-serif">{samplePrompt}</p>
      </div>
      <div>
        <Label>ChatGPT answered</Label>
        <AnswerWell />
      </div>
    </div>
    <div>
      <Label>Two ways to add it</Label>
      <ul className="flex flex-col gap-3">
        {ways.map(({ body, icon, title }) => (
          <li className="bg-card shadow-hairline rounded-lg p-3" key={title}>
            <p className="font-heading flex items-center gap-2">
              <Icon className="text-muted-foreground" name={icon} />
              {title}
            </p>
            <p className="text-muted-foreground text-meta mt-1">{body}</p>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export const CritiqueStage = ({
  verdict,
  check,
  onVerdict,
  onCheck,
}: {
  verdict: string | null;
  check: string;
  onVerdict: (verdict: string | null) => void;
  onCheck: (check: string) => void;
}) => {
  const verdictLabel = useId();
  const checkId = useId();
  return (
    <div className="flex max-w-150 flex-col gap-5">
      <div>
        <Label>ChatGPT answered</Label>
        <AnswerWell />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className="text-body text-label font-emphasis"
            id={verdictLabel}
          >
            Was the AI right or wrong?
          </span>
          <ToggleGroup
            aria-labelledby={verdictLabel}
            onValueChange={(value) => onVerdict(value[0] ?? null)}
            value={verdict ? [verdict] : []}
          >
            {verdicts.map(({ dot, key, label, tone }) => (
              <ToggleGroupItem key={key} tone={tone} value={key}>
                <i className={`${dot} size-1.5 rounded-full`} />
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <Question
          hint="Where did you look?"
          id={checkId}
          label="How did you check?"
          words={countWords(check)}
        >
          <Textarea
            id={checkId}
            onChange={(event) => onCheck(event.target.value)}
            placeholder="One passage cites a study. Is it real?"
            value={check}
          />
        </Question>
        <p className="text-muted-foreground text-meta mt-3 flex items-start gap-1.5">
          <Icon className="mt-0.5 size-3.5 shrink-0" name="note" />
          In your real log you can also select a passage and mark it as wrong,
          unsourced or used.
        </p>
      </div>
    </div>
  );
};

const legend = [
  { label: "AI answer", swatch: "bg-ai-soft" },
  { label: "Reached the essay", swatch: "bg-ai" },
  { label: "Your critique", swatch: "bg-human" },
  { label: "Your step", swatch: "bg-ai-wash shadow-ai-ring" },
];

const Legend = () => (
  <ul className="text-muted-foreground text-label mt-3 flex flex-wrap gap-x-3.5 gap-y-1">
    {legend.map(({ label, swatch }) => (
      <li className="flex items-center gap-1.5" key={label}>
        <i className={`${swatch} size-2 rounded-xs`} />
        {label}
      </li>
    ))}
  </ul>
);

export const ReviewStage = ({
  verdict,
  check,
  choice,
  onChoice,
}: {
  verdict: string | null;
  check: string;
  choice: EssayChoice;
  onChoice: (choice: EssayChoice) => void;
}) => {
  const choiceLabel = useId();
  const { essay, marks, step, untraced } = sampleReview(choice, check);
  const chart = [...earlierSteps, step];
  const said = verdicts.find(({ key }) => key === verdict);
  return (
    <div className="grid gap-x-5 gap-y-4 sm:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-body text-label font-emphasis" id={choiceLabel}>
            In your essay, you
          </span>
          <ToggleGroup
            aria-labelledby={choiceLabel}
            onValueChange={(value) => {
              const next = essayChoices.find(({ key }) => key === value[0]);
              if (next) {
                onChoice(next.key);
              }
            }}
            value={[choice]}
          >
            <ToggleGroupThumb>
              {essayChoices.map(({ key, label }) => (
                <ToggleGroupItem key={key} tone="thumb" value={key}>
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroupThumb>
          </ToggleGroup>
        </div>
        <p
          className="bg-card shadow-hairline text-reading text-read animate-swap rounded-lg px-4 py-3.5 font-serif"
          key={choice}
        >
          <MarkedAnswer marks={marks} text={essay} />
        </p>
      </div>
      <div className="bg-card shadow-hairline rounded-xl p-4">
        <div aria-live="polite">
          <span className="text-label text-muted-foreground font-emphasis block">
            Not traced to logged AI
          </span>
          <b className="text-stat font-heading mt-1 block tabular-nums">
            {formatPercent(untraced)}
          </b>
          <CompositionBar className="mt-1.5" traced={1 - untraced} />
        </div>
        <div className="relative mt-5">
          <span
            aria-hidden="true"
            className="bg-ai-wash animate-rise stagger absolute inset-y-0 left-(--from) w-(--span) rounded-md"
            style={{
              "--from": `${(earlierSteps.length / chart.length) * 100}%`,
              "--i": 12,
              "--span": `${100 / chart.length}%`,
            }}
          />
          <div className="animate-reveal stagger relative" style={{ "--i": 2 }}>
            <ProcessBars
              base={76}
              className="w-full"
              height={118}
              labels
              steps={chart}
              width={260}
            />
          </div>
        </div>
        <Legend />
      </div>
      <figure className="bg-card shadow-hairline rounded-lg px-4 py-3.5 sm:col-span-2">
        <figcaption className="text-muted-foreground text-label font-emphasis mb-1.5 flex items-center gap-2">
          Your critique
          <Badge variant={said?.tone ?? "outline"}>
            {said?.label ?? "No verdict"}
          </Badge>
        </figcaption>
        {check.trim() ? (
          <blockquote className="text-reading text-read max-h-28 max-w-150 overflow-y-auto font-serif">
            {check}
          </blockquote>
        ) : (
          <p className="text-muted-foreground text-meta">
            You haven’t said how you checked, so graders see an empty bar below
            the line.
          </p>
        )}
      </figure>
      <p className="text-muted-foreground text-meta text-pretty sm:col-span-2">
        A match is a run of {MIN_MATCH_WORDS} or more words that also appears in
        your logged answer. Reworded text doesn’t match, which is why graders
        also read your critique. A flag only asks a grader to look closer and
        never changes a grade.
      </p>
    </div>
  );
};
