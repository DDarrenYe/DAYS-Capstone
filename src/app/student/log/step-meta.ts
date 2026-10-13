import { z } from "zod";

import type { ProjectLog } from "@/lib/data/queries";
import { markDraftSchema } from "@/lib/data/schemas";
import { countWords } from "@/lib/process";

export type LoggedStep = ProjectLog["iterations"][number];

const MAX_TITLE = 80;

const marksList = z.array(markDraftSchema);

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

export const logHref = (assignmentId: string) =>
  `/student/log?assignment=${assignmentId}`;

export const answerLabel = ({
  import_source: source,
  raw_answer: answer,
}: Pick<LoggedStep, "import_source" | "raw_answer">) =>
  `${source === "public_link" ? "Imported" : "Pasted"} · ${countWords(answer)} words`;
