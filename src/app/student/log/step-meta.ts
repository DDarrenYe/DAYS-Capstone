import { z } from "zod";

import type { ProjectLog } from "@/lib/data/queries";
import { markDraftSchema } from "@/lib/data/schemas";
import { countWords, readCritique } from "@/lib/process";
import type { SubmissionMetrics } from "@/lib/submission-metrics";

export type LoggedStep = ProjectLog["iterations"][number];

const MAX_TITLE = 80;

const marksList = z.array(markDraftSchema);

const loggedFormat = new Intl.DateTimeFormat("en", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  weekday: "short",
});

const savedFormat = new Intl.DateTimeFormat("en", {
  hour: "numeric",
  minute: "2-digit",
});

export const savedTime = (createdAt: string) =>
  savedFormat.format(new Date(createdAt));

export const loggedAt = ({
  created_at: createdAt,
}: Pick<LoggedStep, "created_at">) => loggedFormat.format(new Date(createdAt));

export const stepTitle = ({ prompt }: Pick<LoggedStep, "prompt">) => {
  const line = prompt.trim().split("\n")[0] ?? "";
  return line.length > MAX_TITLE ? `${line.slice(0, MAX_TITLE)}…` : line;
};

export const isSaved = ({ critique }: Pick<LoggedStep, "critique">) =>
  critique !== null;

export const marksOf = ({ marks }: Pick<LoggedStep, "marks">) => {
  const parsed = marksList.safeParse(marks);
  return parsed.success ? parsed.data : [];
};

export const savedFinal = ({ final_versions: [current] }: ProjectLog) => ({
  createdAt: current?.created_at ?? null,
  filename: current?.original_filename ?? null,
  text: current?.extracted_text ?? "",
  version: current?.version_number ?? 0,
});

export type SavedFinal = ReturnType<typeof savedFinal>;

export const submitBlockers = (
  { iterations }: Pick<ProjectLog, "iterations">,
  saved: Pick<SavedFinal, "text">
) => {
  const blockers: string[] = [];
  if (iterations.length === 0) {
    blockers.push("Add at least one step.");
  }
  const open = iterations
    .filter(({ critique }) => (critique ?? "").trim() === "")
    .map(({ step_number: number }) => number);
  if (open.length > 0) {
    blockers.push(`Add a critique to step ${open.join(", ")}.`);
  }
  if (saved.text.trim() === "") {
    blockers.push("Save your final version.");
  }
  return blockers;
};

export const matchedPassages = (
  { spans, steps }: Pick<SubmissionMetrics, "spans" | "steps">,
  text: string
) =>
  spans.flatMap(({ end, start, stepId, words }) => {
    const step = steps.find(({ id }) => id === stepId);
    return step
      ? [
          {
            start,
            stepNumber: step.stepNumber,
            text: text.slice(start, end),
            words,
          },
        ]
      : [];
  });

export const logHref = (assignmentId: string) =>
  `/student/log?assignment=${assignmentId}`;

export const answerLabel = ({
  import_source: source,
  raw_answer: answer,
}: Pick<LoggedStep, "import_source" | "raw_answer">) =>
  `${source === "public_link" ? "Imported" : "Pasted"} · ${countWords(answer)} words`;

export const critiqueDraft = (step: LoggedStep) => ({
  ...readCritique(step.critique),
  marks: marksOf(step),
});
