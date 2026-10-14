import type { CohortRows } from "@/lib/data/queries";

/*
  Where a submission stands with the reflection check. Pending, running, failed and unavailable are
  kept apart from "none", so a check that hasn't finished never reads as a check with no flags.
*/
export type CheckState =
  | "failed"
  | "flagged"
  | "none"
  | "pending"
  | "reviewed"
  | "running"
  | "unavailable";

export interface SubmissionRow {
  assignment: string;
  critiqueAverage: number;
  email: string;
  id: string;
  name: string;
  openFlags: number;
  state: CheckState;
  stepCount: number;
  submittedAt: string;
  unmatchedPercent: number | null;
}

type Cohort = CohortRows[number];

const checkState = ({ analysisStatus, metrics }: Cohort): CheckState => {
  if (analysisStatus !== "completed") {
    return analysisStatus;
  }
  if (!metrics.flags) {
    return "unavailable";
  }
  if (metrics.flags.open > 0) {
    return "flagged";
  }
  return metrics.flags.active + metrics.flags.dismissed > 0
    ? "reviewed"
    : "none";
};

const ATTENTION: Record<CheckState, number> = {
  failed: 2,
  flagged: 3,
  none: 0,
  pending: 1,
  reviewed: 0,
  running: 1,
  unavailable: 1,
};

/* Unresolved flags first, then checks that haven't produced a result, then everything else. */
export const attention = ({
  openFlags,
  state,
}: Pick<SubmissionRow, "openFlags" | "state">) =>
  ATTENTION[state] * 1000 + openFlags;

const UNFINISHED: ReadonlySet<CheckState> = new Set([
  "failed",
  "pending",
  "running",
  "unavailable",
]);

export const isUnfinished = ({ state }: Pick<SubmissionRow, "state">) =>
  UNFINISHED.has(state);

export const submissionRows = (cohort: CohortRows): SubmissionRow[] =>
  cohort
    .map((entry): SubmissionRow => {
      const { metrics, student } = entry;
      const { email, profile } = student;
      return {
        assignment: entry.assignment.title,
        critiqueAverage:
          metrics.questionsAnswered / Math.max(metrics.stepCount, 1),
        email,
        id: entry.id,
        name: profile?.display_name ?? email,
        openFlags: metrics.flags?.open ?? 0,
        state: checkState(entry),
        stepCount: metrics.stepCount,
        submittedAt: entry.submittedAt ?? "",
        unmatchedPercent: metrics.unmatchedPercent,
      };
    })
    .toSorted((first, second) => attention(second) - attention(first));
