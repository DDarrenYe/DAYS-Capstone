import assert from "node:assert/strict";
import { test } from "node:test";

import { assignmentsOf, cohortSummary, flagKindLabel } from "./cohort-summary";
import type { CohortRows } from "./data/queries";
import { submissionMetrics } from "./submission-metrics";
import { submissionRows } from "./submission-rows";

const ANSWER =
  "Photosynthesis converts light energy into chemical energy stored in glucose.";
const MATCHED_THIRD = `${ANSWER} one two three four five`;
const UNMATCHED = "Entirely different words with nothing shared at all";

type Status = CohortRows[number]["analysisStatus"];
type ReviewState = "open" | "dismissed" | "added_to_feedback";

const flag = (state: ReviewState, kind = "reads_like_ai") => ({
  kind,
  review_state: state,
});

interface Options {
  assignment?: string;
  flags?: ReturnType<typeof flag>[] | null;
  status?: Status;
  text?: string;
}

const entry = (
  id: string,
  {
    assignment = "essay",
    flags = [],
    status = "completed",
    text = MATCHED_THIRD,
  }: Options = {}
): CohortRows[number] => ({
  analysisStatus: status,
  assignment: {
    id: assignment,
    title: assignment === "essay" ? "Essay 2" : "Reflection 1",
  },
  id,
  metrics: submissionMetrics({
    analysis_results: flags
      ? [{ analysis_version: "v1", final_version_id: "final", flags }]
      : [],
    analysis_status: status,
    analysis_version: "v1",
    final_versions: [{ extracted_text: text, id: "final", version_number: 1 }],
    iterations: [
      {
        critique: null,
        id: "step",
        raw_answer: ANSWER,
        step_number: 1,
        student_marked_ai_error: false,
      },
    ],
  }),
  student: { email: `${id}@example.com`, profile: null },
  submittedAt: "2026-10-14T01:00:00Z",
});

const rowsOf = (...entries: CohortRows) => submissionRows(entries);

test("a row carries the figures the overview adds up", () => {
  const [row] = rowsOf(
    entry("a", { flags: [flag("open"), flag("dismissed")] })
  );
  assert.equal(row?.assignmentId, "essay");
  assert.equal(row?.totalWords, 15);
  assert.equal(row?.unmatchedWords, 5);
  assert.deepEqual(row?.openKinds, [{ count: 1, kind: "reads_like_ai" }]);
});

test("assignments are listed by title with their submission counts", () => {
  const rows = rowsOf(
    entry("a", { assignment: "reflection" }),
    entry("b"),
    entry("c", { assignment: "reflection" })
  );
  assert.deepEqual(assignmentsOf(rows), [
    { id: "essay", submissions: 1, title: "Essay 2" },
    { id: "reflection", submissions: 2, title: "Reflection 1" },
  ]);
});

test("a check that has not finished is never counted as checked", () => {
  const summary = cohortSummary(
    rowsOf(
      entry("open", { flags: [flag("open")] }),
      entry("none", { flags: [] }),
      entry("reviewed", { flags: [flag("dismissed")] }),
      entry("failed", { flags: null, status: "failed" }),
      entry("pending", { flags: null, status: "pending" }),
      entry("running", { flags: null, status: "running" }),
      entry("no-result", { flags: null })
    )
  );
  assert.deepEqual(summary.counts, { clear: 2, flagged: 1, unfinished: 4 });
  assert.equal(
    summary.counts.clear + summary.counts.flagged + summary.counts.unfinished,
    summary.submissions
  );
});

test("cohort totals are the sums of the rows", () => {
  const rows = rowsOf(
    entry("a", {
      flags: [flag("open"), flag("open", "low_effort_reflection")],
    }),
    entry("b", { flags: [flag("open")], text: ANSWER }),
    entry("c", { flags: null, status: "failed", text: UNMATCHED }),
    entry("d", { flags: [flag("dismissed")] })
  );
  const summary = cohortSummary(rows);
  assert.equal(summary.submissions, 4);
  assert.equal(
    summary.totalWords,
    rows.reduce((total, { totalWords }) => total + totalWords, 0)
  );
  assert.equal(summary.totalWords, 15 + 10 + 8 + 15);
  assert.equal(summary.unmatchedPercent, 37.5);
  assert.equal(summary.medianSteps, 1);
  assert.deepEqual(summary.reasons, [
    { count: 2, kind: "reads_like_ai" },
    { count: 1, kind: "low_effort_reflection" },
  ]);
});

test("the distribution counts every submission once and puts 100% in the last band", () => {
  const summary = cohortSummary(
    rowsOf(
      entry("none", { text: ANSWER }),
      entry("third-a"),
      entry("third-b"),
      entry("all", { text: UNMATCHED })
    )
  );
  assert.deepEqual(summary.distribution, [1, 0, 0, 2, 0, 0, 0, 0, 0, 1]);
  assert.equal(
    summary.distribution.reduce((total, count) => total + count, 0),
    summary.submissions
  );
  assert.equal(summary.medianUnmatched, 33.3);
});

test("a submission with no final text is counted but not plotted", () => {
  const summary = cohortSummary(
    rowsOf(entry("blank", { text: "" }), entry("b"))
  );
  assert.equal(summary.submissions, 2);
  assert.equal(
    summary.distribution.reduce((total, count) => total + count, 0),
    1
  );
  assert.equal(summary.medianUnmatched, 33.3);
});

test("an empty cohort has no figures rather than zeros", () => {
  const summary = cohortSummary([]);
  assert.equal(summary.submissions, 0);
  assert.equal(summary.unmatchedPercent, null);
  assert.equal(summary.medianUnmatched, null);
  assert.equal(summary.medianSteps, null);
  assert.deepEqual(summary.reasons, []);
  assert.deepEqual(
    summary.distribution,
    Array.from({ length: 10 }, () => 0)
  );
});

test("flag kinds have a plain label, and an unknown kind is made readable", () => {
  assert.equal(flagKindLabel("low_effort_reflection"), "Thin critique");
  assert.equal(
    flagKindLabel("reads_like_ai"),
    "Critique may read as AI-written"
  );
  assert.equal(flagKindLabel("skipped_check"), "Skipped check");
  assert.equal(flagKindLabel("constructor"), "Constructor");
});
