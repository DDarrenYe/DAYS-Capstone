import assert from "node:assert/strict";
import { test } from "node:test";

import type { CohortRows } from "./data/queries";
import { composeCritique } from "./process";
import { submissionMetrics } from "./submission-metrics";
import type { MetricsProject } from "./submission-metrics";
import { submissionRows } from "./submission-rows";

type Status = CohortRows[number]["analysisStatus"];
type FlagState = "added_to_feedback" | "dismissed" | "open";

const ANSWER =
  "Photosynthesis converts light energy into chemical energy stored in glucose.";

const full = composeCritique({
  change: "I rewrote the second sentence in my own words",
  check: "I compared it with the textbook chapter on plant biology",
  sources: [],
  verdict: "partly",
});

const entry = (
  id: string,
  {
    critiques = [full],
    flags,
    profile = { display_name: `Student ${id}` },
    status = "completed",
  }: {
    critiques?: (string | null)[];
    flags?: FlagState[];
    profile?: { display_name: string } | null;
    status?: Status;
  } = {}
): CohortRows[number] => {
  const project: MetricsProject = {
    analysis_results: flags
      ? [
          {
            analysis_version: "v1",
            created_at: "2026-10-12T00:00:00Z",
            final_version_id: "final-1",
            flags: flags.map((review_state) => ({
              kind: "low_effort_reflection",
              review_state,
            })),
          },
        ]
      : [],
    final_versions: [
      {
        extracted_text: `${ANSWER} My own closing thought here.`,
        id: "final-1",
        version_number: 1,
      },
    ],
    iterations: critiques.map((critique, index) => ({
      critique,
      id: `step-${index + 1}`,
      raw_answer: ANSWER,
      step_number: index + 1,
      student_marked_ai_error: false,
    })),
  };
  return {
    analysisStatus: status,
    assignment: { id: "a", title: "Essay 2" },
    id,
    metrics: submissionMetrics(project),
    student: { email: `${id}@example.com`, profile },
    submittedAt: "2026-10-14T01:00:00Z",
  };
};

const stateOf = (cohort: CohortRows[number]) =>
  submissionRows([cohort])[0]?.state;

test("a check that has not finished is never shown as a check with no flags", () => {
  assert.equal(stateOf(entry("a", { status: "pending" })), "pending");
  assert.equal(stateOf(entry("a", { status: "running" })), "running");
  assert.equal(stateOf(entry("a", { status: "failed" })), "failed");
  assert.equal(stateOf(entry("a", { status: "completed" })), "unavailable");
  assert.equal(stateOf(entry("a", { flags: [] })), "none");
});

test("a check that is running or has failed again keeps the earlier flags in view", () => {
  for (const status of ["running", "failed"] as const) {
    const [row] = submissionRows([
      entry("a", { flags: ["open", "dismissed"], status }),
    ]);
    assert.equal(row?.state, status);
    assert.equal(row?.openFlags, 1);
  }
});

test("flags are open until every one has a decision", () => {
  assert.equal(
    stateOf(entry("a", { flags: ["open", "dismissed"] })),
    "flagged"
  );
  assert.equal(
    stateOf(entry("a", { flags: ["dismissed", "added_to_feedback"] })),
    "reviewed"
  );
  assert.equal(
    submissionRows([entry("a", { flags: ["open", "open", "dismissed"] })])[0]
      ?.openFlags,
    2
  );
});

test("flags added to feedback are counted apart from open ones", () => {
  const [row] = submissionRows([
    entry("a", {
      flags: ["open", "added_to_feedback", "added_to_feedback", "dismissed"],
    }),
  ]);
  assert.equal(row?.openFlags, 1);
  assert.equal(row?.feedbackFlags, 2);
  assert.equal(row?.state, "flagged");
  const [unchecked] = submissionRows([entry("b", { status: "pending" })]);
  assert.equal(unchecked?.feedbackFlags, 0);
});

test("unresolved flags come first, then checks without a result, then the rest in read order", () => {
  const rows = submissionRows([
    entry("clear", { flags: [] }),
    entry("pending", { status: "pending" }),
    entry("one", { flags: ["open"] }),
    entry("failed", { status: "failed" }),
    entry("reviewed", { flags: ["dismissed"] }),
    entry("two", { flags: ["open", "open"] }),
  ]);
  assert.deepEqual(
    rows.map(({ id }) => id),
    ["two", "one", "failed", "pending", "clear", "reviewed"]
  );
});

test("critique questions are averaged over the steps", () => {
  assert.equal(
    submissionRows([entry("a", { critiques: [full, null] })])[0]
      ?.critiqueAverage,
    1.5
  );
});

test("a student without a readable profile is shown by email", () => {
  const [row] = submissionRows([entry("a", { profile: null })]);
  assert.equal(row?.name, "a@example.com");
  assert.equal(row?.email, "a@example.com");
  assert.equal(submissionRows([entry("b")])[0]?.name, "Student b");
});

test("the unmatched share is the shared matcher's figure", () => {
  assert.equal(submissionRows([entry("a")])[0]?.unmatchedPercent, 33.3);
});
