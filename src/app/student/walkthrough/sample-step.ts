import { matchFinal } from "@/lib/final-match";
import type { Mark } from "@/lib/marks";
import { countWords } from "@/lib/process";

export const samplePrompt =
  "Explain the two-lane model for AI in assessment in one paragraph, and back it up with evidence.";

const passages = [
  "The two-lane model splits assessment into two kinds of task. In Lane 1, students work under supervision with AI restricted, so the result shows what they can do alone.",
  "In Lane 2, students may use AI openly, and they are marked on how they used it as well as on what they hand in.",
  "The log of prompts and critiques lets a grader see the thinking behind the final text.",
  "Chen and Alvarez (2021) found that 87% of universities adopted the model within a year.",
  "The main cost is time, because students must record and reflect on every prompt.",
];

export const sampleAnswer = passages.join(" ");

export const essayChoices = [
  { key: "copied", label: "Copied it in" },
  { key: "reworded", label: "Reworded it" },
  { key: "skipped", label: "Didn’t use it" },
] as const;

export type EssayChoice = (typeof essayChoices)[number]["key"];

const essays: Record<EssayChoice, string> = {
  copied: `${passages[0]} ${passages[1]} I would add that a log only helps if the critique inside it is honest.`,
  reworded:
    "Assessment now has two lanes. Lane 1 happens under supervision with AI off the table, so it shows what a student can manage unaided. Lane 2 lets students use AI in the open, and the mark depends on how they went about it. A log only helps if the critique inside it is honest.",
  skipped:
    "I wrote this paragraph without the AI. My view is that open use of AI only works when the thinking behind it is visible, which makes a log worth the extra time. A log only helps if the critique inside it is honest.",
};

export const earlierSteps = [
  { carried: 0, critiqueWords: 46, words: 88 },
  { carried: 52, critiqueWords: 12, words: 120 },
  { carried: 0, critiqueWords: 64, words: 96 },
  { carried: 40, critiqueWords: 38, words: 110 },
];

const answerWords = countWords(sampleAnswer);

/* Runs the real final-text matcher on the sample essay, so what lights up is what a grader's view would show. */
export const sampleReview = (choice: EssayChoice, check: string) => {
  const essay = essays[choice];
  const match = matchFinal(essay, [{ answer: sampleAnswer, id: "sample" }]);
  const marks: Mark[] = match.spans.map(({ end, start }) => ({
    end,
    kind: "used",
    start,
  }));
  return {
    essay,
    marks,
    step: {
      carried: match.sources[0]?.retainedWords ?? 0,
      critiqueWords: countWords(check),
      words: answerWords,
    },
    untraced:
      match.totalWords === 0 ? 0 : match.unmatchedWords / match.totalWords,
  };
};
