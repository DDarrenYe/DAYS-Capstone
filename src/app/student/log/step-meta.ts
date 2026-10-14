import { z } from "zod";

import type { ProjectLog } from "@/lib/data/queries";
import { markDraftSchema } from "@/lib/data/schemas";
import { countWords, parseCritique } from "@/lib/process";

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

export const logHref = (assignmentId: string) =>
  `/student/log?assignment=${assignmentId}`;

export const answerLabel = ({
  import_source: source,
  raw_answer: answer,
}: Pick<LoggedStep, "import_source" | "raw_answer">) =>
  `${source === "public_link" ? "Imported" : "Pasted"} · ${countWords(answer)} words`;

export const critiqueDraft = (step: LoggedStep) => {
  const parsed = step.critique === null ? null : parseCritique(step.critique);
  return {
    change: parsed?.change ?? "",
    check: parsed ? parsed.check : (step.critique ?? ""),
    marks: marksOf(step),
    sources: parsed?.sources ?? [],
    verdict: parsed?.verdict ?? null,
  };
};
