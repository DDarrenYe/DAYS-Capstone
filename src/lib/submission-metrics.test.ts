import assert from "node:assert/strict";
import { test } from "node:test";

import type { ProjectLog } from "./data/queries";
import { composeCritique } from "./process";
import { submissionMetrics } from "./submission-metrics";
import type { MetricsProject } from "./submission-metrics";

const ANSWER_ONE =
  "Photosynthesis converts light energy into chemical energy stored in glucose.";
const ANSWER_TWO =
  "Cellular respiration releases the energy that glucose stores inside mitochondria.";

const full = composeCritique({
  change: "I rewrote the second sentence in my own words",
  check: "I compared it with the textbook chapter on plant biology",
  sources: [],
  verdict: "partly",
});

const step = (
  number: number,
  answer: string,
  critique: string | null = null,
  marked = false
) => ({
  critique,
  id: `step-${number}`,
  raw_answer: answer,
  step_number: number,
  student_marked_ai_error: marked,
});

const final = (version: number, text: string) => ({
  extracted_text: text,
  id: `final-${version}`,
  version_number: version,
});

const project = (overrides: Partial<MetricsProject> = {}): MetricsProject => ({
  final_versions: [final(1, `${ANSWER_ONE} My own closing thought here.`)],
  iterations: [step(1, ANSWER_ONE, full, true), step(2, ANSWER_TWO)],
  ...overrides,
});

test("totals come from the saved final text and reconcile with the step bars", () => {
  const metrics = submissionMetrics(project());
  assert.equal(metrics.totalWords, 15);
  assert.equal(metrics.matchedWords, 10);
  assert.equal(metrics.unmatchedWords, 5);
  assert.equal(metrics.unmatchedPercent, 33.3);
  assert.equal(
    metrics.steps.reduce(
      (total, { retainedWords }) => total + retainedWords,
      0
    ),
    metrics.matchedWords
  );
  assert.deepEqual(
    metrics.steps.map(({ id, retainedWords, answerWords }) => [
      id,
      retainedWords,
      answerWords,
    ]),
    [
      ["step-1", 10, 10],
      ["step-2", 0, 10],
    ]
  );
  assert.deepEqual(
    metrics.spans.map(({ stepId, words }) => [stepId, words]),
    [["step-1", 10]]
  );
  assert.equal(metrics.finalVersion, 1);
  assert.equal(metrics.finalVersionId, "final-1");
});

test("step, error and critique-question counts", () => {
  const metrics = submissionMetrics(project());
  assert.equal(metrics.stepCount, 2);
  assert.equal(metrics.markedErrors, 1);
  assert.equal(metrics.questionsAnswered, 3);
  assert.equal(metrics.questionsPossible, 6);
  assert.deepEqual(
    metrics.steps.map(({ questionsAnswered }) => questionsAnswered),
    [3, 0]
  );
});

test("an older free-text critique answers the check question only when it is specific", () => {
  const thin = submissionMetrics(
    project({ iterations: [step(1, ANSWER_ONE, "Looks good.")] })
  );
  assert.equal(thin.questionsAnswered, 0);
  const specific = submissionMetrics(
    project({
      iterations: [
        step(
          1,
          ANSWER_ONE,
          "I checked every figure against the original paper"
        ),
      ],
    })
  );
  assert.equal(specific.questionsAnswered, 1);
});

test("steps are read in step order whatever order they arrive in", () => {
  const metrics = submissionMetrics(
    project({
      final_versions: [final(1, `${ANSWER_ONE} ${ANSWER_ONE}`)],
      iterations: [step(2, ANSWER_ONE), step(1, ANSWER_ONE)],
    })
  );
  assert.deepEqual(
    metrics.steps.map(({ id, retainedWords }) => [id, retainedWords]),
    [
      ["step-1", 20],
      ["step-2", 0],
    ]
  );
});

test("a project with no saved final or no steps has empty totals", () => {
  const empty = submissionMetrics(project({ final_versions: [] }));
  assert.equal(empty.finalVersion, 0);
  assert.equal(empty.finalVersionId, null);
  assert.equal(empty.totalWords, 0);
  assert.equal(empty.unmatchedPercent, null);
  const blank = submissionMetrics(project({ final_versions: [final(1, "")] }));
  assert.equal(blank.finalVersion, 1);
  assert.equal(blank.unmatchedPercent, null);
  const noSteps = submissionMetrics(project({ iterations: [] }));
  assert.equal(noSteps.stepCount, 0);
  assert.equal(noSteps.questionsPossible, 0);
  assert.equal(noSteps.unmatchedPercent, 100);
});

test("an edit changes the totals and only the newest version counts", () => {
  const first = final(1, ANSWER_ONE);
  const edited = final(2, "Something else entirely, written from scratch.");
  const before = submissionMetrics(project({ final_versions: [first] }));
  const after = submissionMetrics(project({ final_versions: [first, edited] }));
  assert.equal(before.matchedWords, 10);
  assert.equal(after.finalVersion, 2);
  assert.equal(after.matchedWords, 0);
  assert.equal(after.totalWords, 6);
  assert.deepEqual(
    submissionMetrics(project({ final_versions: [edited, first] })),
    after
  );
});

test("the same saved text gives the same totals however it was read", () => {
  const log = project();
  const asGrader = submissionMetrics({
    ...log,
    analysis_results: [],
    analysis_status: "completed",
    analysis_version: "v1",
  });
  const { flags: studentFlags, ...student } = submissionMetrics(log);
  const { flags: graderFlags, ...grader } = asGrader;
  assert.deepEqual(student, grader);
  assert.equal(studentFlags, null);
  assert.equal(graderFlags, null);
});

const result = (
  version: string,
  finalId: string,
  ...states: ("open" | "dismissed" | "added_to_feedback")[]
) => ({
  analysis_version: version,
  final_version_id: finalId,
  flags: states.map((review_state) => ({
    kind: "low_effort_reflection",
    review_state,
  })),
});

const analysed = (
  analysis_results: MetricsProject["analysis_results"],
  analysis_status: MetricsProject["analysis_status"] = "completed"
) => project({ analysis_results, analysis_status, analysis_version: "v2" });

test("flag counts stay unavailable until a completed analysis of this final has results", () => {
  assert.equal(submissionMetrics(project()).flags, null);
  assert.equal(submissionMetrics(analysed([])).flags, null);
  for (const status of ["pending", "running", "failed"] as const) {
    assert.equal(
      submissionMetrics(analysed([result("v2", "final-1", "open")], status))
        .flags,
      null
    );
  }
});

test("flag counts cover the current analysis of the current final version", () => {
  const counts = submissionMetrics(
    analysed([
      result("v2", "final-1", "open", "added_to_feedback", "dismissed"),
      result("v2", "final-1"),
      result("v1", "final-1", "open", "open"),
      result("v2", "final-0", "open"),
    ])
  ).flags;
  assert.deepEqual(counts, {
    active: 2,
    addedToFeedback: 1,
    dismissed: 1,
    open: 1,
    openKinds: [{ count: 1, kind: "low_effort_reflection" }],
  });
});

test("open flags are counted by kind, and decided flags are not", () => {
  const flagged = {
    ...result("v2", "final-1"),
    flags: [
      { kind: "reads_like_ai", review_state: "open" as const },
      { kind: "low_effort_reflection", review_state: "open" as const },
      { kind: "reads_like_ai", review_state: "open" as const },
      { kind: "low_effort_reflection", review_state: "dismissed" as const },
    ],
  };
  assert.deepEqual(submissionMetrics(analysed([flagged])).flags?.openKinds, [
    { count: 1, kind: "low_effort_reflection" },
    { count: 2, kind: "reads_like_ai" },
  ]);
});

test("a completed analysis without flags has zero counts", () => {
  assert.deepEqual(
    submissionMetrics(analysed([result("v2", "final-1")])).flags,
    {
      active: 0,
      addedToFeedback: 0,
      dismissed: 0,
      open: 0,
      openKinds: [],
    }
  );
});

test("results for an earlier final version are not shown against an edited one", () => {
  const edited = analysed([result("v2", "final-1", "open")]);
  edited.final_versions = [...edited.final_versions, final(2, "New text")];
  assert.equal(submissionMetrics(edited).flags, null);
});

test("the project log My log already holds is enough to work out the totals", () => {
  const log: ProjectLog = {
    assignment_id: "assignment",
    final_versions: [
      {
        created_at: "2026-10-14T01:00:00Z",
        extracted_text: `${ANSWER_ONE} My own closing thought here.`,
        id: "final-1",
        original_filename: null,
        version_number: 1,
      },
    ],
    id: "project",
    iterations: [
      {
        ai_error_evidence: null,
        ai_tool: "ChatGPT",
        created_at: "2026-10-14T00:00:00Z",
        critique: full,
        id: "step-1",
        import_source: "pasted_text",
        imported_at: null,
        marks: [],
        prompt: "Explain photosynthesis",
        raw_answer: ANSWER_ONE,
        source_url: null,
        step_number: 1,
        student_marked_ai_error: false,
      },
    ],
    status: "draft",
    submitted_at: null,
  };
  const metrics = submissionMetrics(log);
  assert.equal(metrics.matchedWords, 10);
  assert.equal(metrics.questionsAnswered, 3);
  assert.equal(metrics.flags, null);
});
