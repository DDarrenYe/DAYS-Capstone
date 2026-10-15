import assert from "node:assert/strict";
import { test } from "node:test";

import type { UnresolvedRows } from "./data/queries";
import { checkResult, flagView, unresolvedFlags } from "./flag-review";
import type { FlagState } from "./flag-review";
import { submissionMetrics } from "./submission-metrics";

const OPEN: FlagState = "open";

const raw = (overrides: Partial<Parameters<typeof flagView>[0]> = {}) => ({
  evidence: "“Looks good.”",
  explanation: "No check is described.",
  flag_reviews: [],
  id: "flag-1",
  kind: "blind_acceptance",
  review_note: null,
  review_state: OPEN,
  reviewed_at: null,
  ...overrides,
});

test("a flag nobody has decided has no decision, note or history", () => {
  assert.deepEqual(flagView(raw()), {
    earlier: [],
    evidence: "“Looks good.”",
    explanation: "No check is described.",
    id: "flag-1",
    kind: "blind_acceptance",
    label: "Blind acceptance",
    note: "",
    reviewedAt: null,
    state: "open",
  });
});

test("a corrected decision keeps every earlier one, oldest first, and shows the latest as current", () => {
  const view = flagView(
    raw({
      flag_reviews: [
        {
          note: "Ask about the source.",
          review_state: "added_to_feedback",
          reviewed_at: "2026-10-15T02:00:00Z",
        },
        {
          note: null,
          review_state: "dismissed",
          reviewed_at: "2026-10-14T02:00:00Z",
        },
      ],
      review_note: "Ask about the source.",
      review_state: "added_to_feedback",
      reviewed_at: "2026-10-15T02:00:00Z",
    })
  );
  assert.equal(view.state, "added_to_feedback");
  assert.equal(view.note, "Ask about the source.");
  assert.deepEqual(view.earlier, [
    { at: "2026-10-14T02:00:00Z", note: "", state: "dismissed" },
  ]);
});

test("the three questions come in the order students answer them", () => {
  const result = checkResult({
    ai_correctness_addressed: true,
    ai_correctness_evidence: "The answer is wrong.",
    changes_addressed: false,
    changes_evidence: "",
    explanation: "Verdict only.",
    flags: [],
    model: "glm-test",
    rubric_version: "three-questions-v1",
    uncertainty: "Short critiques can follow a talk that was not logged.",
    verification_addressed: true,
    verification_evidence: "I read the chapter.",
  });
  assert.deepEqual(
    result.questions.map(({ addressed, label }) => [label, addressed]),
    [
      ["Was the AI right or wrong?", true],
      ["How did you check?", true],
      ["What did you change?", false],
    ]
  );
  assert.equal(result.questions[1]?.evidence, "I read the chapter.");
  assert.equal(result.uncertainty.startsWith("Short critiques"), true);
});

const analysis = (
  version: string,
  createdAt: string,
  ...states: FlagState[]
) => ({
  analysis_version: version,
  created_at: createdAt,
  final_version_id: "final-1",
  flags: states.map((review_state) => ({
    kind: "blind_acceptance",
    review_state,
  })),
});

test("unresolved flags count only the open ones of each newest result set", () => {
  const rows: UnresolvedRows = [
    {
      analysis_results: [
        analysis("v1", "2026-10-12T00:00:00Z", "open", "open"),
        analysis("v2", "2026-10-13T00:00:00Z", "open", "added_to_feedback"),
      ],
      final_versions: [{ id: "final-1" }],
    },
    {
      analysis_results: [
        analysis(
          "v1",
          "2026-10-12T00:00:00Z",
          "dismissed",
          "added_to_feedback"
        ),
      ],
      final_versions: [{ id: "final-1" }],
    },
    { analysis_results: [], final_versions: [{ id: "final-1" }] },
    {
      analysis_results: [analysis("v1", "2026-10-12T00:00:00Z", "open")],
      final_versions: [{ id: "final-2" }],
    },
  ];
  assert.equal(unresolvedFlags(rows), 1);
});

test("the sidebar count agrees with the open count a submission reports", () => {
  const results = [
    analysis("v1", "2026-10-12T00:00:00Z", "open"),
    analysis("v2", "2026-10-13T00:00:00Z", "open", "open", "dismissed"),
  ];
  const counted = submissionMetrics({
    analysis_results: results,
    final_versions: [
      { extracted_text: "Final text.", id: "final-1", version_number: 1 },
    ],
    iterations: [],
  }).flags;
  assert.equal(
    unresolvedFlags([
      { analysis_results: results, final_versions: [{ id: "final-1" }] },
    ]),
    counted?.open
  );
});
