import assert from "node:assert/strict";
import { test } from "node:test";

import { createClient } from "@supabase/supabase-js";

import {
  forbidden,
  writeProject,
  writeReview,
  writeStep,
  writeSubmission,
} from "./writes";
import type { ReviewInput, StartInput, StepInput, SubmitInput } from "./writes";

const projectId = "20000000-0000-0000-0000-000000000001";
const assignmentId = "50000000-0000-0000-0000-000000000001";
const courseId = "60000000-0000-0000-0000-000000000001";
const studentId = "10000000-0000-0000-0000-000000000001";
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
  respond: (url: URL) => Response = () => Response.json([{ id: "x" }])
) => {
  const requests: Recorded[] = [];
  const client = createClient("https://project.supabase.co", "anonymous-key", {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => {
        const url = new URL(String(input));
        requests.push({
          body: init?.body ? JSON.parse(String(init.body)) : undefined,
          method: init?.method ?? "GET",
          url,
        });
        return Promise.resolve(respond(url));
      },
    },
  });
  return { client, requests };
};

const wire = (
  json: string
): StepInput & SubmitInput & ReviewInput & StartInput => JSON.parse(json);

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
    writeProject(client, studentId, { assignmentId: "nope" }),
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

test("opening a Lane 2 assignment creates the caller's project once", async () => {
  const { client, requests } = clientWith((url) =>
    url.pathname.endsWith("/assignments")
      ? Response.json([{ course_id: courseId }])
      : new Response(null, { status: 201 })
  );
  const result = await writeProject(
    client,
    studentId,
    wire(JSON.stringify({ assignmentId, status: "submitted" }))
  );
  assert.deepEqual(result, {});
  assert.equal(requests[0]?.url.searchParams.get("id"), `eq.${assignmentId}`);
  const [, insert] = requests;
  assert.equal(insert?.method, "POST");
  assert.equal(insert?.url.pathname, "/rest/v1/projects");
  assert.deepEqual(insert?.body, {
    assignment_id: assignmentId,
    course_id: courseId,
    student_id: studentId,
  });
});

test("opening an assignment that already has the caller's project is not an error", async () => {
  const { client, requests } = clientWith((url) =>
    url.pathname.endsWith("/assignments")
      ? Response.json([{ course_id: courseId }])
      : Response.json(
          { code: "23505", message: "duplicate key" },
          { status: 409 }
        )
  );
  assert.deepEqual(await writeProject(client, studentId, { assignmentId }), {});
  assert.equal(requests.at(-1)?.method, "POST");
});

test("opening an assignment the caller cannot see or that is not Lane 2 is forbidden", async () => {
  const hidden = clientWith(noRow);
  assert.deepEqual(
    await writeProject(hidden.client, studentId, { assignmentId }),
    forbidden
  );
  assert.equal(hidden.requests.length, 1);
  const lane1 = clientWith((url) =>
    url.pathname.endsWith("/assignments")
      ? Response.json([{ course_id: courseId }])
      : Response.json(
          { code: "23514", message: "Projects require a Lane 2 assignment" },
          { status: 400 }
        )
  );
  assert.deepEqual(
    await writeProject(lane1.client, studentId, { assignmentId }),
    forbidden
  );
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
