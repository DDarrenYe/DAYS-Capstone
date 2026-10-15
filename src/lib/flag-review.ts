import { flagKindLabel } from "@/lib/cohort-summary";
import type { UnresolvedRows } from "@/lib/data/queries";
import { currentAnalyses } from "@/lib/submission-metrics";
import type { Database } from "@/lib/supabase/database.types";

export type FlagState = Database["public"]["Enums"]["flag_review_state"];

export const FLAG_STATE_LABEL: Record<FlagState, string> = {
  added_to_feedback: "Added to feedback",
  dismissed: "Dismissed",
  open: "Open",
};

interface RawFlag {
  evidence: string;
  explanation: string;
  flag_reviews: readonly {
    note: string | null;
    review_state: FlagState;
    reviewed_at: string;
  }[];
  id: string;
  kind: string;
  review_note: string | null;
  review_state: FlagState;
  reviewed_at: string | null;
}

interface RawResult {
  ai_correctness_addressed: boolean;
  ai_correctness_evidence: string;
  changes_addressed: boolean;
  changes_evidence: string;
  explanation: string;
  flags: readonly RawFlag[];
  model: string;
  rubric_version: string;
  uncertainty: string;
  verification_addressed: boolean;
  verification_evidence: string;
}

export interface FlagView {
  earlier: { at: string; note: string; state: FlagState }[];
  evidence: string;
  explanation: string;
  id: string;
  kind: string;
  label: string;
  note: string;
  reviewedAt: string | null;
  state: FlagState;
}

/* `earlier` is every decision before the current one, oldest first. A corrected decision adds to it and removes nothing. */
export const flagView = (flag: RawFlag): FlagView => ({
  earlier: flag.flag_reviews
    .toSorted(
      (first, second) =>
        Date.parse(first.reviewed_at) - Date.parse(second.reviewed_at)
    )
    .slice(0, -1)
    .map(({ note, review_state: state, reviewed_at: at }) => ({
      at,
      note: note ?? "",
      state,
    })),
  evidence: flag.evidence,
  explanation: flag.explanation,
  id: flag.id,
  kind: flag.kind,
  label: flagKindLabel(flag.kind),
  note: flag.review_note ?? "",
  reviewedAt: flag.reviewed_at,
  state: flag.review_state,
});

export interface CheckResultView {
  explanation: string;
  model: string;
  questions: { addressed: boolean; evidence: string; label: string }[];
  rubricVersion: string;
  uncertainty: string;
}

/* The three questions of the rubric, in the order students answer them. See docs/flagging.md. */
export const checkResult = (result: RawResult): CheckResultView => ({
  explanation: result.explanation,
  model: result.model,
  questions: [
    {
      addressed: result.ai_correctness_addressed,
      evidence: result.ai_correctness_evidence,
      label: "Was the AI right or wrong?",
    },
    {
      addressed: result.verification_addressed,
      evidence: result.verification_evidence,
      label: "How did you check?",
    },
    {
      addressed: result.changes_addressed,
      evidence: result.changes_evidence,
      label: "What did you change?",
    },
  ],
  rubricVersion: result.rubric_version,
  uncertainty: result.uncertainty,
});

/* Flags that still need a decision, in the newest saved result set of each submission. The same rule as `FlagCounts.open`. */
export const unresolvedFlags = (rows: UnresolvedRows) =>
  rows.reduce(
    (total, { analysis_results: results, final_versions: finals }) =>
      total +
      currentAnalyses(results, finals[0]?.id)
        .flatMap(({ flags }) => flags)
        .filter(({ review_state: state }) => state === "open").length,
    0
  );
