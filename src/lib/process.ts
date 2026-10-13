/*
  The process model the screens share. A step is one prompt, the AI's answer and the student's critique.
  Words are counts, never scores: the untraced share is a prompt for judgement, not proof of authorship.
*/

export type CritiqueQuestion = "verdict" | "check" | "change";

/* The order students answer them in, and the order every screen lists them. */
export const critiqueOrder: readonly CritiqueQuestion[] = [
  "verdict",
  "check",
  "change",
];

export const critiqueQuestions: Record<CritiqueQuestion, string> = {
  change: "What changed",
  check: "How it was checked",
  verdict: "Right or wrong",
};

export interface Segment {
  text: string;
  kind?: "carried" | "error";
}

export interface StepFlag {
  title: string;
  body: string;
}

export interface Step {
  title: string;
  day: string;
  time: string;
  asked: string;
  answer: Segment[];
  critique: string;
  answered: Record<CritiqueQuestion, boolean>;
  depth: 0 | 1 | 2 | 3;
  words: number;
  critiqueWords: number;
  carried: number;
  caught?: string;
  flag?: StepFlag;
}

export const countWords = (text: string) =>
  text.trim() === "" ? 0 : text.trim().split(/\s+/u).length;

export const summarise = (steps: readonly Step[], finalWords: number) => {
  const carried = steps.reduce((total, step) => total + step.carried, 0);
  const depth = steps.reduce((total, step) => total + step.depth, 0);
  return {
    carried,
    caught: steps.filter((step) => step.caught).length,
    depth: steps.length === 0 ? 0 : depth / steps.length,
    flags: steps.filter((step) => step.flag).length,
    untraced: finalWords === 0 ? 0 : 1 - carried / finalWords,
  };
};

export const formatPercent = (share: number) => `${Math.round(share * 100)}%`;

export const MIN_ANSWER_WORDS = 6;

/* A critique answers a question once it says something concrete: a verdict, or at least six words. */
export const critiqueCoverage = ({
  verdict,
  check,
  change,
}: {
  verdict: string | null;
  check: string;
  change: string;
}): Record<CritiqueQuestion, boolean> => ({
  change: countWords(change) >= MIN_ANSWER_WORDS,
  check: countWords(check) >= MIN_ANSWER_WORDS,
  verdict: verdict !== null,
});

const VERDICTS = [
  { key: "right", label: "Right" },
  { key: "partly", label: "Partly right" },
  { key: "wrong", label: "Wrong" },
] as const;

const HEADINGS = {
  change: "What did you change? ",
  check: "How did you check? ",
  verdict: "Was the AI right or wrong? ",
};

const SOURCE_PREFIX = "Source: ";

const verdictLabel = (verdict: string | null) =>
  VERDICTS.find(({ key }) => key === verdict)?.label ?? "Not said";

export const composeCritique = ({
  verdict,
  check,
  sources,
  change,
}: {
  verdict: string | null;
  check: string;
  sources: readonly string[];
  change: string;
}) =>
  [
    `${HEADINGS.verdict}${verdictLabel(verdict)}`,
    [
      `${HEADINGS.check}${check.trim()}`,
      ...sources.map((url) => `${SOURCE_PREFIX}${url}`),
    ].join("\n"),
    `${HEADINGS.change}${change.trim()}`,
  ].join("\n\n");

/* Reads a critique written by composeCritique back into its three answers. Anything else, such as an older free-text critique, gives null. */
export const parseCritique = (text: string) => {
  const checkAt = text.indexOf(`\n\n${HEADINGS.check}`);
  const changeAt = text.indexOf(`\n\n${HEADINGS.change}`, checkAt);
  if (!text.startsWith(HEADINGS.verdict) || checkAt === -1 || changeAt === -1) {
    return null;
  }
  const said = text.slice(HEADINGS.verdict.length, checkAt);
  const lines = text
    .slice(checkAt + 2 + HEADINGS.check.length, changeAt)
    .split("\n");
  const firstSource = lines.findIndex((line) => line.startsWith(SOURCE_PREFIX));
  const checked = firstSource === -1 ? lines : lines.slice(0, firstSource);
  const sourceLines = firstSource === -1 ? [] : lines.slice(firstSource);
  return {
    change: text.slice(changeAt + 2 + HEADINGS.change.length),
    check: checked.join("\n"),
    sources: sourceLines.map((line) => line.slice(SOURCE_PREFIX.length)),
    verdict: VERDICTS.find(({ label }) => label === said)?.key ?? null,
  };
};

/* Rounds up to a readable step times a power of ten. Fine steps keep the tallest bar near the top of its chart. */
export const niceCeil = (value: number) => {
  if (value <= 0) {
    return 1;
  }
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(
    (candidate) => value / power <= candidate
  );
  return (step ?? 10) * power;
};

/* The axis maximum for a set of steps: the longest AI answer, rounded up with niceCeil. */
export const wordsAxis = (steps: readonly Pick<Step, "words">[]) =>
  niceCeil(Math.max(0, ...steps.map((step) => step.words)));
