"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useEffectEvent, useId } from "react";
import type { ReactNode } from "react";
import { z } from "zod";

import { AnswerMarker } from "@/app/student/log/answer-marker";
import { CritiqueSidebar } from "@/app/student/log/critique-sidebar";
import { Center, Part, SourceChip } from "@/app/student/log/part";
import { SourceList } from "@/app/student/log/source-list";
import { answerLabel, stepTitle } from "@/app/student/log/step-meta";
import type { LoggedStep } from "@/app/student/log/step-meta";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { markDraftSchema } from "@/lib/data/schemas";
import { useSaveCritique } from "@/lib/data/use-mutations";
import { usePersistentState } from "@/lib/local-state";
import {
  MIN_ANSWER_WORDS,
  composeCritique,
  countWords,
  critiqueCoverage,
  critiqueOrder,
  critiqueQuestions,
} from "@/lib/process";
import { cn } from "@/lib/utils";

const draftSchema = z.object({
  change: z.string(),
  check: z.string(),
  marks: z.array(markDraftSchema),
  sources: z.array(z.url()),
  verdict: z.string().nullable(),
});

type Draft = z.infer<typeof draftSchema>;

const EMPTY: Draft = {
  change: "",
  check: "",
  marks: [],
  sources: [],
  verdict: null,
};

const saveStatus = (complete: boolean, unexplained: boolean, done: number) => {
  if (complete) {
    return "Ready to save.";
  }
  if (unexplained) {
    return "Explain each passage you marked as wrong to save.";
  }
  return `${done} of 3 answered`;
};

const Question = ({
  id,
  label,
  hint,
  words,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  words: number;
  children: ReactNode;
}) => (
  <div className="mt-4.5">
    <div className="mb-1.5 flex items-baseline gap-2">
      <label className="text-body text-label font-emphasis" htmlFor={id}>
        {label}
      </label>
      <span className="text-faint text-label">{hint}</span>
      {words >= MIN_ANSWER_WORDS ? (
        <span className="text-success text-label ml-auto flex items-center gap-1">
          <Icon className="size-3" name="check" />
          Enough to go on
        </span>
      ) : (
        <span className="text-faint text-micro ml-auto font-mono tabular-nums">
          {words}/{MIN_ANSWER_WORDS} words
        </span>
      )}
    </div>
    {children}
  </div>
);

const SaveBar = ({
  coverage,
  status,
  kept,
  error,
  saving,
  disabled,
}: {
  coverage: Record<(typeof critiqueOrder)[number], boolean>;
  status: string;
  kept: boolean;
  error: string | undefined;
  saving: boolean;
  disabled: boolean;
}) => (
  <div className="bg-card/85 sticky bottom-0 z-10 -mx-10 mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-10 py-3 backdrop-blur-md max-md:-mx-4 max-md:px-4">
    <ol aria-label="Questions answered" className="flex items-center gap-1">
      {critiqueOrder.map((question) => (
        <li
          className={cn(
            "h-1.25 w-5 rounded-full transition-colors duration-300",
            coverage[question] ? "bg-ai" : "bg-border-strong"
          )}
          key={question}
        >
          <span className="sr-only">
            {critiqueQuestions[question]}:{" "}
            {coverage[question] ? "answered" : "not answered"}
          </span>
        </li>
      ))}
    </ol>
    <span
      aria-live="polite"
      className="text-muted-foreground text-xs tabular-nums"
    >
      {status}
    </span>
    {kept ? (
      <span className="text-faint flex items-center gap-1 text-xs max-sm:hidden">
        <Icon className="text-success size-3.5" name="check" />
        Draft kept on this device
      </span>
    ) : null}
    {error ? (
      <span className="text-flag-ink text-xs" role="alert">
        {error} Your draft is still here.
      </span>
    ) : null}
    <Button className="ml-auto" disabled={disabled} size="lg" type="submit">
      {saving ? "Saving…" : "Save step"}
      <Kbd>⌘↵</Kbd>
    </Button>
  </div>
);

export const CritiqueForm = ({
  step,
  steps,
  projectId,
  userId,
  next,
}: {
  step: LoggedStep;
  steps: readonly LoggedStep[];
  projectId: string;
  userId: string;
  next: number | "new";
}) => {
  const [, setStepParam] = useQueryState("step", parseAsString);
  const [draft, setDraft, clearDraft] = usePersistentState(
    `log:${projectId}:draft:${step.id}`,
    draftSchema,
    EMPTY
  );
  const { verdict, check, change, sources, marks } = draft;
  const edit = (patch: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const verdictLabel = useId();
  const fieldId = useId();
  const mutation = useSaveCritique(userId);

  const coverage = critiqueCoverage({ change, check, verdict });
  const unexplained = marks.some(
    ({ kind, note }) => kind === "wrong" && (note ?? "").trim() === ""
  );
  const complete = Object.values(coverage).every(Boolean) && !unexplained;
  const answered = Object.values(coverage).filter(Boolean).length;

  const save = async () => {
    if (!complete || mutation.isPending) {
      return;
    }
    try {
      await mutation.mutateAsync({
        critique: composeCritique({ change, check, sources, verdict }),
        marks,
        projectId,
        stepId: step.id,
      });
    } catch {
      return;
    }
    clearDraft();
    setStepParam(String(next));
  };

  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      save();
    }
  });

  useEffect(() => {
    const handle = (event: KeyboardEvent) => onShortcut(event);
    globalThis.addEventListener("keydown", handle);
    return () => globalThis.removeEventListener("keydown", handle);
  }, []);

  return (
    <>
      <Center>
        <form
          className="animate-swap flex flex-1 flex-col px-10 pt-6 max-md:px-4"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <p className="text-muted-foreground text-meta flex flex-wrap items-center gap-2">
            <span className="bg-card text-foreground shadow-hairline text-label rounded-md px-1.5 py-0.5 font-mono">
              Step {step.step_number}
            </span>
            <span>of {steps.length}</span>
            <Badge variant="ai">{step.ai_tool}</Badge>
            <Badge variant="review">
              <i className="bg-review size-1.5 rounded-full" />
              Needs your critique
            </Badge>
          </p>
          <h1 className="text-title mt-2 mb-5 font-semibold text-balance">
            {stepTitle(step)}
          </h1>

          <Part
            meta={<SourceChip step={step} />}
            number="01"
            title="What you asked"
          >
            <p className="bg-card shadow-field text-reading text-read rounded-lg px-3.5 py-2.75 font-serif whitespace-pre-wrap">
              {step.prompt}
            </p>
          </Part>

          <Part
            meta={answerLabel(step)}
            number="02"
            title="What the AI answered"
          >
            <AnswerMarker
              marks={marks}
              onChange={(list) => edit({ marks: list })}
              text={step.raw_answer}
            />
          </Part>

          <Part
            active
            meta="Your grader reads this"
            number="03"
            title="Your critique"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                className="text-body text-label font-emphasis"
                id={verdictLabel}
              >
                Was the AI right or wrong?
              </span>
              <ToggleGroup
                aria-labelledby={verdictLabel}
                onValueChange={(value) => edit({ verdict: value[0] ?? null })}
                value={verdict ? [verdict] : []}
              >
                <ToggleGroupItem tone="success" value="right">
                  <i className="bg-success size-1.5 rounded-full" />
                  Right
                </ToggleGroupItem>
                <ToggleGroupItem tone="review" value="partly">
                  <i className="bg-review size-1.5 rounded-full" />
                  Partly
                </ToggleGroupItem>
                <ToggleGroupItem tone="flag" value="wrong">
                  <i className="bg-flag size-1.5 rounded-full" />
                  Wrong
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <Question
              hint="Where did you look?"
              id={`${fieldId}-check`}
              label="How did you check?"
              words={countWords(check)}
            >
              <Textarea
                id={`${fieldId}-check`}
                onChange={(event) => edit({ check: event.target.value })}
                value={check}
              />
              <SourceList
                onChange={(list) => edit({ sources: list })}
                sources={sources}
              />
            </Question>

            <Question
              hint="What is different now?"
              id={`${fieldId}-change`}
              label="What did you change?"
              words={countWords(change)}
            >
              <Textarea
                id={`${fieldId}-change`}
                onChange={(event) => edit({ change: event.target.value })}
                value={change}
              />
            </Question>
          </Part>

          <SaveBar
            coverage={coverage}
            disabled={!complete || mutation.isPending}
            error={mutation.error?.message}
            kept={draft !== EMPTY}
            saving={mutation.isPending}
            status={saveStatus(complete, unexplained, answered)}
          />
        </form>
      </Center>
      <CritiqueSidebar
        coverage={coverage}
        sources={sources.length}
        steps={steps}
      />
    </>
  );
};
