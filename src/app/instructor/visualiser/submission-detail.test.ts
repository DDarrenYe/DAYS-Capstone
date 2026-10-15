import assert from "node:assert/strict";
import { test } from "node:test";

import type { SubmissionProject } from "@/lib/data/queries";
import { matchFinal } from "@/lib/final-match";
import { composeCritique } from "@/lib/process";
import { submissionMetrics } from "@/lib/submission-metrics";
import { submissionRows } from "@/lib/submission-rows";

import { essayParagraphs, submissionDetail } from "./submission-detail";

const ANSWER =
  "Photosynthesis converts light energy into chemical energy stored in glucose.";
const SECOND =
  "Cellular respiration releases the energy that glucose stores inside mitochondria.";

const full = composeCritique({
  change: "I rewrote the second sentence in my own words",
  check: "I compared it with the textbook chapter on plant biology",
  sources: [],
  verdict: "partly",
});

const flag = (
  id: string,
  review_state: "added_to_feedback" | "dismissed" | "open"
) => ({
  evidence: "“Done.”",
  explanation: "The critique says too little.",
  id,
  flag_reviews: [],
  kind: "low_effort_reflection",
  review_note: null,
  review_state,
  reviewed_at: null,
});

const answers = {
  ai_correctness_addressed: true,
  ai_correctness_evidence: "Done.",
  changes_addressed: false,
  changes_evidence: "",
  explanation: "The critique gives a verdict and nothing else.",
  uncertainty: "A short critique may follow a discussion that was not logged.",
  verification_addressed: false,
  verification_evidence: "",
};

const result = (flags: ReturnType<typeof flag>[]) => ({
  ...answers,
  analysis_version: "v1",
  created_at: "2026-10-14T01:04:00Z",
  final_version_id: "final-1",
  flags,
  iteration_id: "step-2",
  model: "glm-test",
  rubric_version: "three-questions-v1",
});

const project = (
  overrides: Partial<SubmissionProject> = {}
): SubmissionProject => ({
  analysis_results: [
    {
      ...answers,
      analysis_version: "v1",
      created_at: "2026-10-14T01:04:00Z",
      final_version_id: "final-1",
      flags: [flag("flag-1", "open"), flag("flag-2", "dismissed")],
      iteration_id: "step-2",
      model: "glm-test",
      rubric_version: "three-questions-v1",
    },
    {
      ...answers,
      analysis_version: "v1",
      created_at: "2026-10-14T01:04:00Z",
      final_version_id: "final-0",
      flags: [flag("flag-3", "open")],
      iteration_id: "step-1",
      model: "glm-test",
      rubric_version: "three-questions-v1",
    },
  ],
  analysis_error: null,
  analysis_finished_at: "2026-10-14T01:05:00Z",
  analysis_started_at: "2026-10-14T01:01:00Z",
  analysis_status: "completed",
  analysis_version: "v1",
  assignment: {
    course: { code: "INFOMGMT 399", id: "course-1", title: "Capstone" },
    id: "assignment-1",
    title: "Essay 2",
  },
  final_versions: [
    {
      extracted_text: `${ANSWER} My own closing thought here.\n\nSecond paragraph.`,
      id: "final-1",
      original_filename: "essay.docx",
      version_number: 1,
    },
  ],
  grader_notes: [{ body: "Check the cited source.", iteration_id: "step-2" }],
  id: "project-1",
  iterations: [
    {
      ai_error_evidence: null,
      created_at: "2026-10-06T06:02:00Z",
      critique: full,
      id: "step-1",
      marks: [],
      prompt: "Explain photosynthesis",
      raw_answer: ANSWER,
      step_number: 1,
      student_marked_ai_error: false,
    },
    {
      ai_error_evidence: "“mitochondria” — it is in the cytoplasm",
      created_at: "2026-10-07T06:02:00Z",
      critique: null,
      id: "step-2",
      marks: [{ end: 10, kind: "wrong", note: "no", start: 0 }],
      prompt: "Explain respiration",
      raw_answer: SECOND,
      step_number: 2,
      student_marked_ai_error: true,
    },
  ],
  student: {
    email: "student@example.com",
    profile: { display_name: "Student One" },
  },
  submitted_at: "2026-10-14T01:00:00Z",
  ...overrides,
});

const indexes = new Map([
  ["a", 0],
  ["b", 1],
]);

test("an essay with no matches is plain paragraphs", () => {
  assert.deepEqual(essayParagraphs("One line.\n\nTwo lines.", [], indexes), [
    [{ start: 0, text: "One line." }],
    [{ start: 11, text: "Two lines." }],
  ]);
});

test("an essay that matches throughout is one marked run", () => {
  const text = "all of this text matches";
  assert.deepEqual(
    essayParagraphs(
      text,
      [{ end: 24, start: 0, stepId: "a", words: 5 }],
      indexes
    ),
    [[{ start: 0, step: 0, text }]]
  );
});

test("a match that crosses a paragraph break is cut at the break", () => {
  const text = "start of one\nrest of two and more";
  const paragraphs = essayParagraphs(
    text,
    [
      { end: 4, start: 0, stepId: "a", words: 1 },
      { end: 22, start: 9, stepId: "b", words: 4 },
    ],
    indexes
  );
  assert.deepEqual(paragraphs, [
    [
      { start: 0, step: 0, text: "star" },
      { start: 4, text: "t of " },
      { start: 9, step: 1, text: "one" },
    ],
    [
      { start: 13, step: 1, text: "rest of t" },
      { start: 22, text: "wo and more" },
    ],
  ]);
});

test("runs rebuild the essay text and agree with the shared matcher", () => {
  const text = `${ANSWER} My own words.\n\n\n${SECOND} More of mine here.\n`;
  const { spans } = matchFinal(text, [
    { answer: ANSWER, id: "a" },
    { answer: SECOND, id: "b" },
  ]);
  const paragraphs = essayParagraphs(text, spans, indexes);
  assert.equal(paragraphs.length, 2);
  const runs = paragraphs.flat();
  assert.equal(
    runs.map(({ text: run }) => run).join(""),
    text.replaceAll("\n", "")
  );
  for (const run of runs) {
    assert.equal(text.slice(run.start, run.start + run.text.length), run.text);
  }
  assert.deepEqual(
    runs.filter(({ step }) => step !== undefined).map(({ step }) => step),
    [0, 1]
  );
});

test("the page shows the same figures as the submissions table", () => {
  const found = project();
  const [row] = submissionRows([
    {
      analysisStatus: found.analysis_status,
      assignment: found.assignment,
      id: found.id,
      metrics: submissionMetrics(found),
      student: found.student,
      submittedAt: found.submitted_at,
    },
  ]);
  const detail = submissionDetail(found);
  assert.equal(detail.match.unmatchedPercent, row?.unmatchedPercent);
  assert.equal(detail.match.unmatchedWords, row?.unmatchedWords);
  assert.equal(detail.match.totalWords, row?.totalWords);
  assert.equal(detail.critiqueAverage, row?.critiqueAverage);
  assert.equal(detail.openFlags, row?.openFlags);
  assert.equal(detail.check, row?.state);
  assert.equal(detail.name, row?.name);
  assert.equal(detail.match.matchedWords, 10);
  assert.equal(detail.match.minWords, 6);
});

test("each step carries its retained words, critique depth, marks and open flags", () => {
  const { steps } = submissionDetail(project());
  assert.deepEqual(
    steps.map(({ carried, depth, flag: open, markedError, words }) => [
      carried,
      depth,
      open,
      markedError,
      words,
    ]),
    [
      [10, 3, undefined, false, 10],
      [0, 0, "Thin critique", true, 10],
    ]
  );
  assert.deepEqual(
    steps[1]?.flags.map(({ id, state }) => [id, state]),
    [
      ["flag-1", "open"],
      ["flag-2", "dismissed"],
    ]
  );
  assert.equal(steps[1]?.evidence, "“mitochondria” — it is in the cytoplasm");
  assert.equal(steps[1]?.marks.length, 1);
  assert.equal(steps[1]?.critique, "");
  assert.equal(steps[0]?.title, "Explain photosynthesis");
});

test("a step carries the question results, explanation and uncertainty of the current check", () => {
  const { steps } = submissionDetail(project());
  assert.equal(steps[0]?.check, null);
  assert.deepEqual(steps[1]?.check, {
    explanation: "The critique gives a verdict and nothing else.",
    model: "glm-test",
    questions: [
      {
        addressed: true,
        evidence: "Done.",
        label: "Was the AI right or wrong?",
      },
      { addressed: false, evidence: "", label: "How did you check?" },
      { addressed: false, evidence: "", label: "What did you change?" },
    ],
    rubricVersion: "three-questions-v1",
    uncertainty:
      "A short critique may follow a discussion that was not logged.",
  });
});

test("open flags and flags added to feedback are counted apart, and a decided flag no longer marks the step", () => {
  const detail = submissionDetail(
    project({
      analysis_results: [
        result([
          flag("a", "open"),
          flag("b", "added_to_feedback"),
          flag("c", "dismissed"),
        ]),
      ],
    })
  );
  assert.equal(detail.openFlags, 1);
  assert.equal(detail.feedbackFlags, 1);
  assert.equal(detail.steps[1]?.flag, "Thin critique");
  const decided = submissionDetail(
    project({
      analysis_results: [
        result([flag("b", "added_to_feedback"), flag("c", "dismissed")]),
      ],
    })
  );
  assert.equal(decided.openFlags, 0);
  assert.equal(decided.feedbackFlags, 1);
  assert.equal(decided.steps[1]?.flag, undefined);
  assert.equal(decided.steps[1]?.flags.length, 2);
});

test("each step carries only its own saved note", () => {
  const { steps } = submissionDetail(project());
  assert.deepEqual(
    steps.map(({ note }) => note),
    ["", "Check the cited source."]
  );
});

test("a first check that has not finished invents no flags or counts", () => {
  for (const status of ["pending", "running", "failed"] as const) {
    const detail = submissionDetail(
      project({ analysis_results: [], analysis_status: status })
    );
    assert.equal(detail.check, status);
    assert.equal(detail.openFlags, 0);
    assert.equal(detail.analysis.kept, false);
    assert.deepEqual(
      detail.steps.map(({ flags }) => flags),
      [[], []]
    );
    assert.equal(detail.match.matchedWords, 10);
  }
});

test("a re-run that is going or has failed keeps the last results in view", () => {
  for (const status of ["running", "failed"] as const) {
    const detail = submissionDetail(
      project({
        analysis_error:
          status === "failed" ? "The reflection check timed out." : null,
        analysis_status: status,
        analysis_version: "v2",
      })
    );
    assert.equal(detail.check, status);
    assert.equal(detail.analysis.kept, true);
    assert.equal(detail.openFlags, 1);
    assert.deepEqual(
      detail.steps.map(({ flags }) => flags.length),
      [0, 2]
    );
    assert.match(
      detail.analysis.note,
      /The results below are from the last check that finished\.$/u
    );
  }
});

const note = (overrides: Partial<SubmissionProject>) =>
  submissionDetail(project(overrides)).analysis.note;

test("the status line says what happened and with which model", () => {
  assert.match(
    note({}),
    /^Finished .+ with glm-test, rubric three-questions-v1\. It can miss thin critiques, so a step with no flag isn’t necessarily a good critique\.$/u
  );
  assert.match(
    note({ analysis_results: [], analysis_status: "pending" }),
    /^It starts when a student submits/u
  );
  assert.match(
    note({ analysis_results: [], analysis_status: "running" }),
    /^Started .+\.$/u
  );
  assert.equal(
    note({
      analysis_error: "The model provider was busy. Try again shortly.",
      analysis_results: [],
      analysis_status: "failed",
    }),
    "The model provider was busy. Try again shortly."
  );
  assert.equal(
    note({ analysis_results: [] }),
    "The check finished but saved no results for this submission."
  );
});

test("a submission with no final text has no essay and no percentage", () => {
  const detail = submissionDetail(project({ final_versions: [] }));
  assert.deepEqual(detail.essay, []);
  assert.equal(detail.match.unmatchedPercent, null);
  assert.equal(detail.file, null);
  assert.deepEqual(
    detail.steps.map(({ carried }) => carried),
    [0, 0]
  );
});

test("steps are grouped by the day they were logged", () => {
  const detail = submissionDetail(project());
  assert.deepEqual(
    detail.steps.map(({ day }) => day),
    ["Tue 6", "Wed 7"]
  );
  assert.equal(detail.days, 2);
});
