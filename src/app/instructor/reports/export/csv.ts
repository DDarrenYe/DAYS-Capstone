import { CHECK_STATE } from "@/app/instructor/check-state";
import type { SubmissionDetail } from "@/app/instructor/visualiser/submission-detail";
import type { ExportSections } from "@/lib/export-options";
import { FLAG_STATE_LABEL } from "@/lib/flag-review";

const FORMULA_START = /^(?:\s*[=+\-@]|[\t\r])/u;

const NEEDS_QUOTES = /[",\r\n]/u;

export const csvCell = (value: string) => {
  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

type Options = Pick<ExportSections, "notes" | "prompts">;

const flagText = (flags: SubmissionDetail["steps"][number]["flags"]) =>
  flags
    .map(({ label, state }) => `${label} (${FLAG_STATE_LABEL[state]})`)
    .join("; ");

const flagNotes = (flags: SubmissionDetail["steps"][number]["flags"]) =>
  flags
    .filter(({ note }) => note !== "")
    .map(({ label, note }) => `${label}: ${note}`)
    .join("; ");

export const stepsRows = (
  detail: SubmissionDetail,
  { notes, prompts }: Options
): string[][] => {
  const { course } = detail.assignment;
  const header = [
    "student",
    "email",
    "course",
    "assignment",
    "check",
    "step",
    "logged_at",
    "title",
    "ai_words",
    "words_in_essay",
    "critique_words",
    "questions_answered",
    "ai_error_marked",
    "ai_error_evidence",
    "flags",
    ...(notes ? ["flag_notes"] : []),
    "critique",
    ...(prompts ? ["prompt", "ai_answer"] : []),
    ...(notes ? ["grader_note"] : []),
  ];
  const body = detail.steps.map((step, index) => [
    detail.name,
    detail.email,
    `${course.code} ${course.title}`,
    detail.assignment.title,
    CHECK_STATE[detail.check].label,
    String(index + 1),
    step.createdAt,
    step.title,
    String(step.words),
    String(step.carried),
    String(step.critiqueWords),
    String(step.depth),
    step.markedError ? "yes" : "no",
    step.evidence,
    flagText(step.flags),
    ...(notes ? [flagNotes(step.flags)] : []),
    step.critique,
    ...(prompts ? [step.asked, step.answer] : []),
    ...(notes ? [step.note] : []),
  ]);
  return [header, ...body];
};

const BYTE_ORDER_MARK = "\uFEFF";

export const stepsCsv = (detail: SubmissionDetail, options: Options) =>
  `${BYTE_ORDER_MARK}${stepsRows(detail, options)
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")}\r\n`;
