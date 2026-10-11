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
  change: countWords(change) >= 6,
  check: countWords(check) >= 6,
  verdict: verdict !== null,
});
