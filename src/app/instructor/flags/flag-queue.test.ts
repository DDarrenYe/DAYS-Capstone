import assert from "node:assert/strict";
import { test } from "node:test";

import type { FlagQueueRows } from "@/lib/data/queries";
import type { FlagState } from "@/lib/flag-review";

import { flagQueue, queueEmpty } from "./flag-queue";

type Row = FlagQueueRows[number];

const answers = {
  ai_correctness_addressed: true,
  ai_correctness_evidence: "Looks good.",
  changes_addressed: false,
  changes_evidence: "",
  explanation: "A verdict and nothing else.",
  model: "glm-test",
  rubric_version: "three-questions-v1",
  uncertainty: "May follow a talk that was not logged.",
  verification_addressed: false,
  verification_evidence: "",
};

const flag = (id: string, state: FlagState, kind = "blind_acceptance") => ({
  evidence: "“Looks good.”",
  explanation: "No check is described.",
  flag_reviews: [],
  id,
  kind,
  review_note: null,
  review_state: state,
  reviewed_at: null,
});

const step = (id: string, number: number, critique = "Looks good.") => ({
  critique,
  id,
  prompt: `Prompt ${number}`,
  step_number: number,
});

interface Options {
  course?: string;
  name?: string | null;
  results?: Row["analysis_results"];
  steps?: Row["iterations"];
}

const project = (
  id: string,
  {
    course = "INFO 101",
    name = `Student ${id}`,
    results = [],
    steps = [step(`${id}-1`, 1), step(`${id}-2`, 2)],
  }: Options = {}
): Row => ({
  analysis_results: results,
  assignment: {
    course: { code: course, id: `${course}-id`, title: course },
    id: "assignment-1",
    title: "Essay 2",
  },
  final_versions: [{ id: "final-1", version_number: 1 }],
  id,
  iterations: steps,
  student: {
    email: `${id}@example.com`,
    profile: name === null ? null : { display_name: name },
  },
  submitted_at: "2026-10-14T01:00:00Z",
});

const result = (
  stepId: string,
  flags: ReturnType<typeof flag>[],
  version = "v1",
  createdAt = "2026-10-14T02:00:00Z"
) => ({
  ...answers,
  analysis_version: version,
  created_at: createdAt,
  final_version_id: "final-1",
  flags,
  iteration_id: stepId,
});

test("open flags come first, then the ones added to feedback, then dismissed ones", () => {
  const queue = flagQueue([
    project("a", {
      results: [
        result("a-1", [flag("f1", "dismissed")]),
        result("a-2", [flag("f2", "open"), flag("f3", "added_to_feedback")]),
      ],
    }),
    project("b", { results: [result("b-1", [flag("f4", "open")])] }),
  ]);
  assert.deepEqual(
    queue.flags.map(({ flag: { id, state } }) => [id, state]),
    [
      ["f2", "open"],
      ["f4", "open"],
      ["f3", "added_to_feedback"],
      ["f1", "dismissed"],
    ]
  );
  assert.deepEqual(queue.counts, {
    added_to_feedback: 1,
    dismissed: 1,
    open: 2,
    openStudents: 2,
  });
});

test("each entry carries the student, course, step, critique and the step's check", () => {
  const [entry] = flagQueue([
    project("a", {
      course: "INFO 399",
      results: [result("a-2", [flag("f1", "open")])],
      steps: [step("a-2", 4, "Fine."), step("a-1", 3)],
    }),
  ]).flags;
  assert.equal(entry?.project.name, "Student a");
  assert.equal(entry?.project.course, "INFO 399");
  assert.equal(entry?.project.assignment, "Essay 2");
  assert.deepEqual(entry?.step, { number: 4, position: 2, title: "Prompt 4" });
  assert.equal(entry?.critique, "Fine.");
  assert.equal(entry?.check.questions.length, 3);
  assert.equal(entry?.check.uncertainty, answers.uncertainty);
});

test("a student without a profile is listed by email", () => {
  const [entry] = flagQueue([
    project("a", {
      name: null,
      results: [result("a-1", [flag("f1", "open")])],
    }),
  ]).flags;
  assert.equal(entry?.project.name, "a@example.com");
});

test("only the newest saved result set counts, and an earlier set stays out of the queue", () => {
  const queue = flagQueue([
    project("a", {
      results: [
        result("a-1", [flag("old", "open")], "v1", "2026-10-13T00:00:00Z"),
        result("a-1", [flag("new", "open")], "v2", "2026-10-14T00:00:00Z"),
      ],
    }),
  ]);
  assert.deepEqual(
    queue.flags.map(({ flag: { id } }) => id),
    ["new"]
  );
});

test("submissions with no saved result are counted, not mistaken for checks without flags", () => {
  const queue = flagQueue([
    project("a"),
    project("b", { results: [result("b-1", [])] }),
  ]);
  assert.equal(queue.submissions, 2);
  assert.equal(queue.withoutResults, 1);
  assert.equal(queue.flags.length, 0);
});

test("the queue says why it is empty", () => {
  assert.equal(queueEmpty(flagQueue([]))?.title, "No submissions yet");
  assert.equal(
    queueEmpty(flagQueue([project("a"), project("b")]))?.title,
    "No check has finished yet"
  );
  const clear = queueEmpty(
    flagQueue([project("a", { results: [result("a-1", [])] })])
  );
  assert.equal(clear?.title, "Nothing was flagged");
  assert.equal(
    clear?.body,
    "Every submitted log was checked and none was flagged."
  );
  const partly = queueEmpty(
    flagQueue([project("a", { results: [result("a-1", [])] }), project("b")])
  );
  assert.match(partly?.body ?? "", /1 submission has no saved check result/u);
  assert.equal(
    queueEmpty(
      flagQueue([
        project("a", { results: [result("a-1", [flag("f1", "dismissed")])] }),
      ])
    ),
    null
  );
});
