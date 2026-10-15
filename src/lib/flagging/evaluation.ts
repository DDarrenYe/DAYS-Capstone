import type { ReflectionStep } from "./check";
import { FLAG_KINDS } from "./rubric";
import type { Reflection } from "./rubric";

export const QUESTIONS = ["aiCorrectness", "verification", "changes"] as const;

export type Question = (typeof QUESTIONS)[number];
export type FlagKind = Reflection["flags"][number]["kind"];

export interface Verdict {
  addressed: Record<Question, boolean>;
  flags: readonly FlagKind[];
}

export interface LabelledStep extends Verdict {
  category: "specific" | "verified" | "thin" | "ambiguous" | "polished";
  id: string;
  note?: string;
  step: ReflectionStep;
}

interface Scored {
  example: LabelledStep;
  predicted: Verdict;
}

const ratio = (part: number, whole: number) =>
  whole === 0 ? null : part / whole;

const flagScore = (kind: FlagKind, scored: readonly Scored[]) => {
  const ids = (pick: (row: Scored) => boolean) =>
    scored.filter(pick).map(({ example }) => example.id);
  const labelled = ({ example }: Scored) => example.flags.includes(kind);
  const raised = ({ predicted }: Scored) => predicted.flags.includes(kind);
  const truePositives = ids((row) => labelled(row) && raised(row)).length;
  const falsePositives = ids((row) => !labelled(row) && raised(row));
  const falseNegatives = ids((row) => labelled(row) && !raised(row));
  return {
    falseNegatives,
    falsePositives,
    kind,
    precision: ratio(truePositives, truePositives + falsePositives.length),
    recall: ratio(truePositives, truePositives + falseNegatives.length),
    truePositives,
  };
};

export const score = (
  examples: readonly LabelledStep[],
  predictions: ReadonlyMap<string, Verdict>
) => {
  const scored = examples.flatMap((example) => {
    const predicted = predictions.get(example.id);
    return predicted ? [{ example, predicted }] : [];
  });
  return {
    agreement: QUESTIONS.map((question) => ({
      agreed: scored.filter(
        ({ example, predicted }) =>
          example.addressed[question] === predicted.addressed[question]
      ).length,
      question,
    })),
    flags: FLAG_KINDS.map((kind) => flagScore(kind, scored)),
    scored: scored.length,
  };
};
