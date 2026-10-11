import assert from "node:assert/strict";
import { test } from "node:test";

import { createClient } from "@supabase/supabase-js";

import {
  forbidden,
  removeEnrolment,
  writeAssignment,
  writeCourse,
  writeEnrolments,
  writeReview,
  writeStep,
  writeSubmission,
} from "./writes";
import type {
  AssignmentInput,
  CourseInput,
  ReviewInput,
  StepInput,
  SubmitInput,
} from "./writes";

const projectId = "20000000-0000-0000-0000-000000000001";
const stepId = "30000000-0000-0000-0000-000000000001";
const flagId = "40000000-0000-0000-0000-000000000001";
const reviewerId = "10000000-0000-0000-0000-000000000002";

type Json = string | number | boolean | null | undefined;

interface Recorded {
  body: Record<string, Json> | undefined;
  method: string;
  url: URL;
}

const noRow = () => Response.json([]);

const clientWith = (
  respond: () => Response = () => Response.json([{ id: "x" }])
) => {
  const requests: Recorded[] = [];
  const client = createClient("https://project.supabase.co", "anonymous-key", {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => {
        requests.push({
          body: init?.body ? JSON.parse(String(init.body)) : undefined,
          method: init?.method ?? "GET",
          url: new URL(String(input)),
        });
        return Promise.resolve(respond());
      },
    },
  });
  return { client, requests };
};

const wire = (
  json: string
): StepInput & SubmitInput & ReviewInput & CourseInput & AssignmentInput =>
  JSON.parse(json);

const step: StepInput = {
  aiTool: "ChatGPT",
  projectId,
  prompt: "Explain lanes",
  rawAnswer: "Two lanes",
  stepNumber: 2,
};

test("invalid input is rejected before the database is contacted", async () => {
  const { client, requests } = clientWith();
  const invalidSteps = [
    { ...step, projectId: "not-a-uuid" },
    { ...step, id: "not-a-uuid" },
    { ...step, stepNumber: 0 },
    { ...step, stepNumber: 1.5 },
    { ...step, stepNumber: 2_147_483_648 },
    { ...step, aiTool: "   " },
    { ...step, prompt: "" },
    { ...step, rawAnswer: "x".repeat(50_001) },
    { ...step, critique: "  " },
    { ...step, aiErrorEvidence: "" },
    wire(JSON.stringify({ ...step, stepNumber: "2" })),
  ];
  const results = await Promise.all([
    ...invalidSteps.map((invalid) => writeStep(client, invalid)),
    writeSubmission(client, { projectId: "nope" }),
    writeReview(client, reviewerId, { flagId: "nope", state: "dismissed" }),
    writeReview(
      client,
      reviewerId,
      wire(JSON.stringify({ flagId, state: "approved" }))
    ),
  ]);
  for (const result of results) {
    assert.deepEqual(result, { error: "Check the details and try again." });
  }
  assert.equal(requests.length, 0);
});

test("a new step is inserted with only the allowed columns", async () => {
  const { client, requests } = clientWith();
  const result = await writeStep(
    client,
    wire(
      JSON.stringify({
        ...step,
        aiErrorEvidence: "It invented a source",
        critique: "Checked it",
        status: "submitted",
        student_id: "someone-else",
      })
    )
  );
  assert.deepEqual(result, {});
  assert.equal(requests[0]?.method, "POST");
  assert.equal(requests[0]?.url.pathname, "/rest/v1/iterations");
  assert.deepEqual(requests[0]?.body, {
    ai_error_evidence: "It invented a source",
    ai_tool: "ChatGPT",
    critique: "Checked it",
    project_id: projectId,
    prompt: "Explain lanes",
    raw_answer: "Two lanes",
    step_number: 2,
    student_marked_ai_error: true,
  });
});

test("editing a step updates it by ID within its project and never moves it", async () => {
  const { client, requests } = clientWith();
  const result = await writeStep(client, { ...step, id: stepId });
  assert.deepEqual(result, {});
  assert.equal(requests[0]?.method, "PATCH");
  assert.equal(requests[0]?.url.searchParams.get("id"), `eq.${stepId}`);
  assert.equal(
    requests[0]?.url.searchParams.get("project_id"),
    `eq.${projectId}`
  );
  assert.equal(requests[0]?.body?.student_marked_ai_error, false);
  assert.equal("project_id" in (requests[0]?.body ?? {}), false);
});

test("submitting only moves a draft the caller can update", async () => {
  const { client, requests } = clientWith();
  assert.deepEqual(await writeSubmission(client, { projectId }), {});
  assert.equal(requests[0]?.method, "PATCH");
  assert.equal(requests[0]?.url.searchParams.get("id"), `eq.${projectId}`);
  assert.equal(requests[0]?.url.searchParams.get("status"), "eq.draft");
  assert.equal(requests[0]?.body?.status, "submitted");
  assert.match(String(requests[0]?.body?.submitted_at), /^\d{4}-\d\d-\d\dT/u);
});

test("a review is attributed to the verified reviewer, not the caller's input", async () => {
  const { client, requests } = clientWith();
  const result = await writeReview(
    client,
    reviewerId,
    wire(
      JSON.stringify({
        flagId,
        reviewed_by: "someone-else",
        state: "added_to_feedback",
      })
    )
  );
  assert.deepEqual(result, {});
  assert.equal(requests[0]?.url.pathname, "/rest/v1/flags");
  assert.equal(requests[0]?.url.searchParams.get("id"), `eq.${flagId}`);
  assert.equal(requests[0]?.body?.reviewed_by, reviewerId);
  assert.equal(requests[0]?.body?.review_state, "added_to_feedback");
});

test("rows the database hides and policy violations both read as forbidden", async () => {
  const hidden = clientWith(noRow);
  assert.deepEqual(
    await writeSubmission(hidden.client, { projectId }),
    forbidden
  );
  const results = await Promise.all(
    ["42501", "23514"].map((code) =>
      writeStep(
        clientWith(() =>
          Response.json({ code, message: "denied" }, { status: 403 })
        ).client,
        step
      )
    )
  );
  assert.deepEqual(results, [forbidden, forbidden]);
});

test("duplicate step numbers and unexpected failures return safe messages", async () => {
  const duplicate = clientWith(() =>
    Response.json({ code: "23505", message: "duplicate key" }, { status: 409 })
  );
  assert.deepEqual(await writeStep(duplicate.client, step), {
    error: "That step number is already used.",
  });
  const broken = clientWith(() =>
    Response.json({ code: "XX000", message: "secret detail" }, { status: 500 })
  );
  const log = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(await writeStep(broken.client, step), {
      error: "Unable to save. Try again shortly.",
    });
  } finally {
    console.error = log;
  }
});

const assignment = {
  brief: "Write it",
  courseId: projectId,
  dueAt: "2026-12-01T06:00:00.000Z",
  lane: "lane_2",
  title: "Essay",
} as const;

const invalidAssignment = (changes: Record<string, string>) =>
  wire(JSON.stringify({ ...assignment, ...changes }));

const denied = () =>
  clientWith(() =>
    Response.json({ code: "42501", message: "denied" }, { status: 403 })
  ).client;

test("setup input is rejected before the database is contacted", async () => {
  const { client, requests } = clientWith();
  const results = await Promise.all([
    writeCourse(client, reviewerId, { code: "  ", title: "Title" }),
    writeCourse(client, reviewerId, { code: "A", title: "x".repeat(201) }),
    writeAssignment(client, invalidAssignment({ courseId: "nope" })),
    writeAssignment(client, invalidAssignment({ lane: "lane_3" })),
    writeAssignment(client, invalidAssignment({ title: " " })),
    writeAssignment(client, invalidAssignment({ dueAt: "2026-12-01" })),
    writeEnrolments(client, { courseId: "nope", emails: "a@example.com" }),
    removeEnrolment(client, { enrolmentId: "nope" }),
    writeEnrolments(client, { courseId: projectId, emails: " , ; " }),
    writeEnrolments(client, {
      courseId: projectId,
      emails: Array.from({ length: 501 }, (_, i) => `s${i}@example.com`).join(
        " "
      ),
    }),
  ]);
  for (const result of results) {
    assert.deepEqual(result, { error: "Check the details and try again." });
  }
  assert.equal(requests.length, 0);
});

test("a course is owned by the verified instructor, not the caller's input", async () => {
  const { client, requests } = clientWith();
  const result = await writeCourse(
    client,
    reviewerId,
    wire(
      JSON.stringify({
        code: " INFOMGMT 399 ",
        instructor_id: "someone-else",
        title: "Capstone",
      })
    )
  );
  assert.deepEqual(result, {});
  assert.equal(requests[0]?.method, "POST");
  assert.equal(requests[0]?.url.pathname, "/rest/v1/courses");
  assert.deepEqual(requests[0]?.body, {
    code: "INFOMGMT 399",
    instructor_id: reviewerId,
    title: "Capstone",
  });
  const duplicate = clientWith(() =>
    Response.json({ code: "23505", message: "duplicate key" }, { status: 409 })
  );
  assert.deepEqual(
    await writeCourse(duplicate.client, reviewerId, {
      code: "INFOMGMT 399",
      title: "Capstone",
    }),
    { error: "You already have a course with that code.", field: "code" }
  );
});

test("an assignment is inserted with only the allowed columns", async () => {
  const { client, requests } = clientWith();
  const result = await writeAssignment(
    client,
    wire(JSON.stringify({ ...assignment, instructor_id: "someone-else" }))
  );
  assert.deepEqual(result, {});
  assert.equal(requests[0]?.url.pathname, "/rest/v1/assignments");
  assert.deepEqual(requests[0]?.body, {
    brief: "Write it",
    course_id: projectId,
    due_at: "2026-12-01T06:00:00.000Z",
    lane: "lane_2",
    title: "Essay",
  });
  const undated = clientWith();
  await writeAssignment(undated.client, {
    courseId: projectId,
    lane: "lane_1",
    title: "Lab",
  });
  assert.deepEqual(undated.requests[0]?.body, {
    brief: "",
    course_id: projectId,
    due_at: null,
    lane: "lane_1",
    title: "Lab",
  });
});

test("pasted addresses are split and sent to the enrolment function", async () => {
  const { client, requests } = clientWith(() =>
    Response.json([{ address: "a@example.com", outcome: "invited" }])
  );
  const result = await writeEnrolments(client, {
    courseId: projectId,
    emails: "a@example.com, B@example.com;\nc@example.com  d",
  });
  assert.deepEqual(result, {
    results: [{ address: "a@example.com", outcome: "invited" }],
  });
  assert.equal(requests[0]?.url.pathname, "/rest/v1/rpc/enrol_students");
  assert.deepEqual(requests[0]?.body, {
    course: projectId,
    emails: ["a@example.com", "B@example.com", "c@example.com", "d"],
  });
});

test("setup writes the database rejects read as forbidden", async () => {
  const results = await Promise.all([
    writeCourse(denied(), reviewerId, { code: "A", title: "B" }),
    writeAssignment(denied(), assignment),
    writeEnrolments(denied(), { courseId: projectId, emails: "a@example.com" }),
    removeEnrolment(denied(), { enrolmentId: projectId }),
  ]);
  assert.deepEqual(results, [forbidden, forbidden, forbidden, forbidden]);
});

test("removing a student deletes one enrolment by id and reports why it can't", async () => {
  const { client, requests } = clientWith();
  assert.deepEqual(
    await removeEnrolment(client, { enrolmentId: projectId }),
    {}
  );
  assert.equal(requests[0]?.method, "DELETE");
  assert.equal(requests[0]?.url.pathname, "/rest/v1/enrolments");
  assert.equal(requests[0]?.url.searchParams.get("id"), `eq.${projectId}`);
  assert.deepEqual(
    await removeEnrolment(clientWith(noRow).client, { enrolmentId: projectId }),
    forbidden
  );
  const withWork = clientWith(() =>
    Response.json({ code: "23503", message: "restrict" }, { status: 409 })
  );
  assert.deepEqual(
    await removeEnrolment(withWork.client, { enrolmentId: projectId }),
    { error: "That student has started work, so they can't be removed." }
  );
});
