import { matchFinal } from "@/lib/final-match";
import { critiqueCoverage, critiqueOrder, readCritique } from "@/lib/process";
import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export interface MetricsStep {
  critique: string | null;
  id: string;
  raw_answer: string;
  step_number: number;
  student_marked_ai_error: boolean;
}

export interface MetricsFinal {
  extracted_text: string;
  id: string;
  version_number: number;
}

export interface MetricsAnalysis {
  analysis_version: string;
  final_version_id: string;
  flags: readonly { review_state: Enums["flag_review_state"] }[];
}

export interface MetricsProject {
  analysis_results?: readonly MetricsAnalysis[];
  analysis_status?: Enums["analysis_status"];
  analysis_version?: string | null;
  final_versions: readonly MetricsFinal[];
  iterations: readonly MetricsStep[];
}

export interface FlagCounts {
  active: number;
  addedToFeedback: number;
  dismissed: number;
  open: number;
}

const flagCounts = (
  {
    analysis_results: results = [],
    analysis_status: status,
    analysis_version: version,
  }: MetricsProject,
  final: MetricsFinal | undefined
): FlagCounts | null => {
  const current = results.filter(
    (result) =>
      result.final_version_id === final?.id &&
      result.analysis_version === version
  );
  if (status !== "completed" || current.length === 0) {
    return null;
  }
  const states = current.flatMap(({ flags }) =>
    flags.map(({ review_state: state }) => state)
  );
  const count = (wanted: Enums["flag_review_state"]) =>
    states.filter((state) => state === wanted).length;
  const open = count("open");
  const addedToFeedback = count("added_to_feedback");
  return {
    active: open + addedToFeedback,
    addedToFeedback,
    dismissed: count("dismissed"),
    open,
  };
};

const latest = (versions: readonly MetricsFinal[]): MetricsFinal | undefined =>
  versions.toSorted(
    (first, second) => second.version_number - first.version_number
  )[0];

export const submissionMetrics = (project: MetricsProject) => {
  const logged = project.iterations.toSorted(
    (first, second) => first.step_number - second.step_number
  );
  const final = latest(project.final_versions);
  const { sources, ...match } = matchFinal(
    final?.extracted_text ?? "",
    logged.map(({ id, raw_answer: answer }) => ({ answer, id }))
  );
  const steps = logged.map((step, index) => {
    const coverage = critiqueCoverage(readCritique(step.critique));
    return {
      answerWords: sources[index]?.answerWords ?? 0,
      id: step.id,
      markedError: step.student_marked_ai_error,
      questionsAnswered: critiqueOrder.filter((question) => coverage[question])
        .length,
      retainedWords: sources[index]?.retainedWords ?? 0,
      stepNumber: step.step_number,
    };
  });
  return {
    ...match,
    finalVersion: final?.version_number ?? 0,
    finalVersionId: final?.id ?? null,
    flags: flagCounts(project, final),
    markedErrors: steps.filter(({ markedError }) => markedError).length,
    questionsAnswered: steps.reduce(
      (total, step) => total + step.questionsAnswered,
      0
    ),
    questionsPossible: steps.length * critiqueOrder.length,
    stepCount: steps.length,
    steps,
  };
};

export type SubmissionMetrics = ReturnType<typeof submissionMetrics>;
