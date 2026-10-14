import assert from "node:assert/strict";
import { test } from "node:test";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { MAX_NOTE } from "@/lib/data/schemas";
import { ImportError } from "@/lib/import/errors";
import type { loadShare } from "@/lib/import/share";

import {
  forbidden,
  readFinalDocument,
  readImport,
  removeEnrolment,
  removeStep,
  writeAssignment,
  writeCourse,
  writeCritique,
  writeEnrolments,
  writeFinal,
  writeImport,
  writeNote,
  writeProject,
  writeReview,
  writeSteps,
  writeSubmission,
} from "./writes";
import type {
  AddStepInput,
  AssignmentInput,
  CourseInput,
  CritiqueInput,
  ImportInput,
  NoteInput,
  OpenInput,
  ReviewInput,
  SubmitInput,
} from "./writes";

const assignmentId = "50000000-0000-0000-0000-000000000001";
const courseId = "60000000-0000-0000-0000-000000000001";
const projectId = "20000000-0000-0000-0000-000000000001";
const stepId = "30000000-0000-0000-0000-000000000001";
const flagId = "40000000-0000-0000-0000-000000000001";
const reviewerId = "10000000-0000-0000-0000-000000000002";
const studentId = "10000000-0000-0000-0000-000000000003";

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
): AddStepInput &
  CritiqueInput &
  ImportInput &
  SubmitInput &
  ReviewInput &
  NoteInput &
  OpenInput &
  CourseInput &
  AssignmentInput => JSON.parse(json);

const step: AddStepInput = {
  aiTool: "ChatGPT",
  projectId,
  prompt: "Explain lanes",
  rawAnswer: "Two lanes",
};

const shareUrl =
  "https://chatgpt.com/share/6f2a1c3e-9b4d-4e7a-8c15-0d2b3f4a5e60";
const shareId = "6f2a1c3e-9b4d-4e7a-8c15-0d2b3f4a5e60";

const shared =
  (
    steps: { id: string; prompt: string; answer: string }[] = [
      { answer: "  A1\n", id: "m1", prompt: "Q1 " },
      { answer: "A2", id: "m2", prompt: "Q2" },
    ]
  ): typeof loadShare =>
  () =>
    Promise.resolve({
      link: { id: shareId, url: new URL(shareUrl) },
      omitted: 0,
      steps,
    });

const refused =
  (reason: ConstructorParameters<typeof ImportError>[0]): typeof loadShare =>
  () =>
    Promise.reject(new ImportError(reason));

const sequence = (...responses: Response[]) => {
  const queue = [...responses];
  return clientWith(() => queue.shift() ?? noRow());
};

const critique: CritiqueInput = {
  critique: "Was the AI right? Wrong.\n\nHow I checked it: the survey.",
  projectId,
  stepId,
};

const invalidCritiques: CritiqueInput[] = [
  { ...critique, projectId: "nope" },
  { ...critique, stepId: "nope" },
  { ...critique, critique: "" },
  { ...critique, critique: "  \n" },
  { ...critique, critique: "x".repeat(50_001) },
  { ...critique, marks: [{ end: 4, kind: "wrong", start: 4 }] },
  { ...critique, marks: [{ end: 2, kind: "wrong", start: 4 }] },
  { ...critique, marks: [{ end: 4, kind: "wrong", note: "   ", start: 0 }] },
  { ...critique, marks: [{ end: 4, kind: "wrong", start: 0 }] },
  wire(
    JSON.stringify({
      ...critique,
      marks: [{ end: 4, kind: "other", note: "x", start: 0 }],
    })
  ),
  {
    ...critique,
    marks: [{ end: 4, kind: "used", note: "x".repeat(2001), start: 0 }],
  },
  { ...critique, marks: [{ end: 4.5, kind: "used", start: 0 }] },
];

test("invalid input is rejected before the database is contacted", async () => {
  const { client, requests } = clientWith();
  const invalidSteps = [
    { ...step, projectId: "not-a-uuid" },
    { ...step, aiTool: "   " },
    { ...step, aiTool: "x".repeat(101) },
    { ...step, prompt: "" },
    { ...step, prompt: "  \n " },
    { ...step, rawAnswer: "x".repeat(50_001) },
    wire(JSON.stringify({ ...step, prompt: 7 })),
  ];
  const results = await Promise.all([
    ...invalidSteps.map((invalid) => writeSteps(client, invalid)),
    writeImport(client, { projectId: "nope", url: shareUrl }),
    writeImport(client, { projectId, url: "x".repeat(2049) }),
    writeImport(
      client,
      wire(JSON.stringify({ projectId, stepIds: [7], url: shareUrl }))
    ),
    readImport(client, { projectId: "nope", url: shareUrl }),
    ...invalidCritiques.map((invalid) => writeCritique(client, invalid)),
    writeProject(client, studentId, { assignmentId: "nope" }),
    writeSubmission(client, { projectId: "nope" }),
    writeReview(client, reviewerId, { flagId: "nope", state: "dismissed" }),
    writeNote(client, reviewerId, { body: "x", projectId: "nope", stepId }),
    writeNote(client, reviewerId, { body: "x", projectId, stepId: "nope" }),
    writeNote(client, reviewerId, {
      body: "x".repeat(MAX_NOTE + 1),
      projectId,
      stepId,
    }),
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

test("opening an assignment that already has a project succeeds without a second one", async () => {
  const responses = [
    Response.json([{ course_id: courseId, id: assignmentId }]),
    Response.json({ code: "23505", message: "duplicate key" }, { status: 409 }),
  ];
  const { client } = clientWith(() => responses.shift() ?? noRow());
  assert.deepEqual(await writeProject(client, studentId, { assignmentId }), {});
});

test("opening an assignment uses the verified student and the assignment's course", async () => {
  const { client, requests } = clientWith(() =>
    Response.json([{ course_id: courseId, id: assignmentId }])
  );
  const result = await writeProject(
    client,
    studentId,
    wire(
      JSON.stringify({
        assignmentId,
        course_id: "other-course",
        student_id: "someone-else",
      })
    )
  );
  assert.deepEqual(result, {});
  assert.equal(requests[0]?.url.pathname, "/rest/v1/assignments");
  assert.equal(requests[0]?.url.searchParams.get("id"), `eq.${assignmentId}`);
  assert.equal(requests[1]?.method, "POST");
  assert.equal(requests[1]?.url.pathname, "/rest/v1/projects");
  assert.deepEqual(requests[1]?.body, {
    assignment_id: assignmentId,
    course_id: courseId,
    student_id: studentId,
  });
});

test("an assignment the student cannot read or a Lane 1 assignment never gets a project", async () => {
  const hidden = clientWith(noRow);
  assert.deepEqual(
    await writeProject(hidden.client, studentId, { assignmentId }),
    forbidden
  );
  assert.equal(hidden.requests.length, 1);
  const responses = [
    Response.json([{ course_id: courseId, id: assignmentId }]),
    Response.json(
      { code: "23514", message: "Projects require a Lane 2 assignment" },
      { status: 400 }
    ),
  ];
  const laneOne = clientWith(() => responses.shift() ?? noRow());
  assert.deepEqual(
    await writeProject(laneOne.client, studentId, { assignmentId }),
    forbidden
  );
});

test("a pasted step goes through add_steps with only the allowed fields", async () => {
  const { client, requests } = clientWith(() =>
    Response.json([{ id: stepId, step_number: 7 }])
  );
  const result = await writeSteps(
    client,
    wire(
      JSON.stringify({
        ...step,
        aiTool: "  Claude ",
        prompt: "  Keep my spacing\n",
        rawAnswer: "Line one\n\nLine two  ",
        stepNumber: 1,
        student_id: "someone-else",
      })
    )
  );
  assert.deepEqual(result, { added: 1, firstStep: 7 });
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.method, "POST");
  assert.equal(requests[0]?.url.pathname, "/rest/v1/rpc/add_steps");
  assert.deepEqual(requests[0]?.body, {
    project: projectId,
    steps: [
      {
        ai_tool: "Claude",
        import_source: "pasted_text",
        prompt: "  Keep my spacing\n",
        raw_answer: "Line one\n\nLine two  ",
      },
    ],
  });
});

test("an import saves the chosen steps with their provenance and the shared text untouched", async () => {
  const { client, requests } = clientWith(() =>
    Response.json([{ id: stepId, step_number: 4 }])
  );
  const result = await writeImport(
    client,
    {
      projectId,
      stepIds: ["m1"],
      url: `${shareUrl.replace("chatgpt.com", "chat.openai.com")}?x=1`,
    },
    shared()
  );
  assert.deepEqual(result, { added: 1, firstStep: 4 });
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0]?.body, {
    project: projectId,
    steps: [
      {
        ai_tool: "ChatGPT",
        import_source: "public_link",
        prompt: "Q1 ",
        raw_answer: "  A1\n",
        source_conversation_id: shareId,
        source_step_id: "m1",
        source_url: shareUrl,
      },
    ],
  });
});

test("an import without a selection adds every step in order, and an empty selection adds none", async () => {
  const { client, requests } = clientWith(() =>
    Response.json([
      { id: stepId, step_number: 5 },
      { id: flagId, step_number: 6 },
    ])
  );
  assert.deepEqual(
    await writeImport(client, { projectId, url: shareUrl }, shared()),
    {
      added: 2,
      firstStep: 5,
    }
  );
  const sent = z
    .array(z.object({ source_step_id: z.string() }))
    .parse(requests[0]?.body?.steps);
  assert.deepEqual(
    sent.map((item) => item.source_step_id),
    ["m1", "m2"]
  );
  const none = await writeImport(
    client,
    { projectId, stepIds: ["other"], url: shareUrl },
    shared()
  );
  assert.deepEqual(none, { error: "Choose at least one step to add." });
  assert.equal(requests.length, 1);
});

test("an import that finds only saved steps reports none added", async () => {
  const { client } = clientWith(() => Response.json([]));
  assert.deepEqual(
    await writeImport(client, { projectId, url: shareUrl }, shared()),
    {
      added: 0,
      firstStep: undefined,
    }
  );
});

test("an import that cannot read the link says why and writes nothing", async () => {
  const reasons = [
    "unsupported_host",
    "unavailable",
    "blocked",
    "too_large",
    "timeout",
    "unreadable",
  ] as const;
  const attempts = await Promise.all(
    reasons.map(async (reason) => {
      const { client, requests } = clientWith();
      const result = await writeImport(
        client,
        { projectId, url: shareUrl },
        refused(reason)
      );
      return { requests: requests.length, result };
    })
  );
  assert.deepEqual(
    attempts.map(({ result }) => result.error),
    reasons.map((reason) => new ImportError(reason).message)
  );
  assert.deepEqual(
    attempts.map(({ requests }) => requests),
    reasons.map(() => 0)
  );
  const { client } = clientWith();
  await assert.rejects(
    writeImport(client, { projectId, url: shareUrl }, () =>
      Promise.reject(new TypeError("unexpected"))
    ),
    TypeError
  );
});

test("a link that is not a ChatGPT share is refused by the real loader before any request", async () => {
  const { client, requests } = clientWith();
  const results = await Promise.all(
    [
      "not a link",
      "https://example.com/share/x",
      "http://169.254.169.254/latest",
    ].map((url) => writeImport(client, { projectId, url }))
  );
  for (const result of results) {
    assert.match(result.error ?? "", /ChatGPT/u);
  }
  assert.equal(requests.length, 0);
});

test("the preview marks steps that are already saved and never touches the network for a foreign project", async () => {
  const { client, requests } = sequence(
    Response.json([{ id: projectId }]),
    Response.json([{ source_step_id: "m1" }])
  );
  const preview = await readImport(
    client,
    { projectId, url: shareUrl },
    shared()
  );
  assert.deepEqual(preview, {
    link: shareUrl,
    omitted: 0,
    steps: [
      { answer: "  A1\n", id: "m1", prompt: "Q1 ", saved: true },
      { answer: "A2", id: "m2", prompt: "Q2", saved: false },
    ],
  });
  assert.equal(
    requests[1]?.url.searchParams.get("project_id"),
    `eq.${projectId}`
  );
  assert.equal(requests[1]?.url.searchParams.get("ai_tool"), "eq.ChatGPT");
  assert.equal(
    requests[1]?.url.searchParams.get("source_conversation_id"),
    `eq.${shareId}`
  );

  let fetched = false;
  const hidden = clientWith(noRow);
  const result = await readImport(
    hidden.client,
    { projectId, url: shareUrl },
    () => {
      fetched = true;
      return shared()("");
    }
  );
  assert.deepEqual(result, forbidden);
  assert.equal(fetched, false);
});

test("a critique saves the text and marks, and records wrong passages as student-reported evidence", async () => {
  const answer = "Nine in ten students use AI. It was introduced in 2019.";
  const { client, requests } = sequence(
    Response.json([{ raw_answer: answer }]),
    Response.json([{ id: stepId }])
  );
  const marks = [
    { end: 27, kind: "wrong", note: "  Survey says 64%. ", start: 0 },
    { end: 55, kind: "unsourced", start: 29 },
    { end: 54, kind: "wrong", note: "Sydney started it in 2023", start: 36 },
  ] as const;
  const result = await writeCritique(client, {
    ...critique,
    marks: marks.map((mark) => ({ ...mark })),
  });
  assert.deepEqual(result, {});
  assert.equal(requests[0]?.method, "GET");
  assert.equal(requests[0]?.url.pathname, "/rest/v1/iterations");
  assert.equal(requests[1]?.method, "PATCH");
  assert.equal(requests[1]?.url.searchParams.get("id"), `eq.${stepId}`);
  assert.equal(
    requests[1]?.url.searchParams.get("project_id"),
    `eq.${projectId}`
  );
  assert.deepEqual(requests[1]?.body, {
    ai_error_evidence:
      "“Nine in ten students use AI” — Survey says 64%.\n\n“introduced in 2019” — Sydney started it in 2023",
    critique: critique.critique,
    marks,
    student_marked_ai_error: true,
  });
});

test("a critique without wrong passages clears any error evidence", async () => {
  const { client, requests } = sequence(
    Response.json([{ raw_answer: "Short answer" }]),
    Response.json([{ id: stepId }])
  );
  assert.deepEqual(await writeCritique(client, critique), {});
  assert.deepEqual(requests[1]?.body, {
    ai_error_evidence: null,
    critique: critique.critique,
    marks: [],
    student_marked_ai_error: false,
  });
});

test("a mark outside the answer, or a step the student cannot see, is not saved", async () => {
  const outside = sequence(Response.json([{ raw_answer: "Short" }]));
  const result = await writeCritique(outside.client, {
    ...critique,
    marks: [{ end: 6, kind: "used", start: 0 }],
  });
  assert.deepEqual(result, { error: "Check the details and try again." });
  assert.equal(outside.requests.length, 1);
  const hidden = clientWith(noRow);
  assert.deepEqual(await writeCritique(hidden.client, critique), forbidden);
  assert.equal(hidden.requests.length, 1);
  const lost = sequence(
    Response.json([{ raw_answer: "Short" }]),
    Response.json([])
  );
  assert.deepEqual(await writeCritique(lost.client, critique), forbidden);
});

test("removing a step goes through remove_step for that project and step only", async () => {
  const { client, requests } = clientWith(() => Response.json(null));
  assert.deepEqual(await removeStep(client, { projectId, stepId }), {});
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.method, "POST");
  assert.equal(requests[0]?.url.pathname, "/rest/v1/rpc/remove_step");
  assert.deepEqual(requests[0]?.body, { project: projectId, step: stepId });
  const invalid = clientWith();
  const results = await Promise.all([
    removeStep(invalid.client, { projectId: "nope", stepId }),
    removeStep(invalid.client, { projectId, stepId: "nope" }),
  ]);
  assert.deepEqual(results, [
    { error: "Check the details and try again." },
    { error: "Check the details and try again." },
  ]);
  assert.equal(invalid.requests.length, 0);
});

test("removing a step the student cannot edit reads as forbidden", async () => {
  const denied = clientWith(() =>
    Response.json({ code: "42501", message: "denied" }, { status: 403 })
  );
  assert.deepEqual(
    await removeStep(denied.client, { projectId, stepId }),
    forbidden
  );
});

test("saving final text goes through save_final_version with the version it was based on", async () => {
  const saved = [
    {
      created_at: "2026-10-14T01:00:00Z",
      id: "70000000-0000-0000-0000-000000000001",
      version_number: 4,
    },
  ];
  const { client, requests } = clientWith(() => Response.json(saved));
  assert.deepEqual(
    await writeFinal(client, {
      base: 3,
      filename: "  essay.docx ",
      projectId,
      text: "My essay",
    }),
    {
      createdAt: "2026-10-14T01:00:00Z",
      id: "70000000-0000-0000-0000-000000000001",
      version: 4,
    }
  );
  assert.equal(requests[0]?.url.pathname, "/rest/v1/rpc/save_final_version");
  assert.deepEqual(requests[0]?.body, {
    base: 3,
    body: "My essay",
    filename: "essay.docx",
    project: projectId,
  });
  const typed = clientWith(() => Response.json(saved));
  await writeFinal(typed.client, {
    base: 0,
    filename: null,
    projectId,
    text: "",
  });
  assert.deepEqual(typed.requests[0]?.body, {
    base: 0,
    body: "",
    project: projectId,
  });
});

test("invalid final text is rejected before the database is contacted", async () => {
  const { client, requests } = clientWith();
  const valid = { base: 0, filename: null, projectId, text: "Essay" };
  const results = await Promise.all([
    writeFinal(client, { ...valid, projectId: "nope" }),
    writeFinal(client, { ...valid, base: -1 }),
    writeFinal(client, { ...valid, base: 1.5 }),
    writeFinal(client, { ...valid, filename: "   " }),
    writeFinal(client, { ...valid, filename: "x".repeat(256) }),
    writeFinal(client, { ...valid, text: "x".repeat(50_001) }),
  ]);
  for (const result of results) {
    assert.deepEqual(result, { error: "Check the details and try again." });
  }
  assert.equal(requests.length, 0);
});

test("a final version changed elsewhere reads as a conflict, not a failure", async () => {
  const stale = clientWith(() =>
    Response.json(
      { code: "40001", message: "The final version changed somewhere else" },
      { status: 409 }
    )
  );
  assert.deepEqual(
    await writeFinal(stale.client, {
      base: 1,
      filename: null,
      projectId,
      text: "Mine",
    }),
    { conflict: true, error: "Your final version was changed somewhere else." }
  );
  const denied = clientWith(() =>
    Response.json({ code: "42501", message: "denied" }, { status: 403 })
  );
  assert.deepEqual(
    await writeFinal(denied.client, {
      base: 0,
      filename: null,
      projectId,
      text: "Mine",
    }),
    forbidden
  );
  const empty = clientWith(() => Response.json([]));
  assert.deepEqual(
    await writeFinal(empty.client, {
      base: 0,
      filename: null,
      projectId,
      text: "Mine",
    }),
    forbidden
  );
});

test("a document upload needs a file and never reaches the database", async () => {
  assert.deepEqual(await readFinalDocument(new FormData()), {
    error: "Check the details and try again.",
  });
  const text = new FormData();
  text.set("file", "not a file");
  assert.deepEqual(await readFinalDocument(text), {
    error: "Check the details and try again.",
  });
  const wrong = new FormData();
  wrong.set("file", new File(["x"], "essay.pdf"));
  assert.deepEqual(await readFinalDocument(wrong), {
    error: "Choose a Word document (.docx).",
  });
});

test("submitting calls the database function, which owns the checks and the lock", async () => {
  const { client, requests } = clientWith(() =>
    Response.json("2026-10-14T00:00:00+00:00")
  );
  assert.deepEqual(await writeSubmission(client, { projectId }), {});
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.method, "POST");
  assert.equal(requests[0]?.url.pathname, "/rest/v1/rpc/submit_project");
  assert.deepEqual(requests[0]?.body, { project: projectId });
});

const failing = (code: string, message: string) =>
  clientWith(() => Response.json({ code, message }, { status: 400 })).client;

test("an incomplete log reports the database's reason and nothing else leaks", async () => {
  assert.deepEqual(
    await writeSubmission(
      failing("P0001", "Save your final version before you submit."),
      { projectId }
    ),
    { error: "Save your final version before you submit." }
  );
  assert.deepEqual(
    await writeSubmission(failing("42501", "Only the enrolled student"), {
      projectId,
    }),
    forbidden
  );
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

test("a note is saved for the verified author and the step it names", async () => {
  const { client, requests } = clientWith();
  const result = await writeNote(
    client,
    reviewerId,
    wire(
      JSON.stringify({
        author_id: "someone-else",
        body: "  Check the source.  ",
        projectId,
        stepId,
      })
    )
  );
  assert.deepEqual(result, {});
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.method, "PATCH");
  assert.equal(requests[0]?.url.pathname, "/rest/v1/grader_notes");
  assert.equal(
    requests[0]?.url.searchParams.get("author_id"),
    `eq.${reviewerId}`
  );
  assert.equal(
    requests[0]?.url.searchParams.get("iteration_id"),
    `eq.${stepId}`
  );
  assert.equal(
    requests[0]?.url.searchParams.get("project_id"),
    `eq.${projectId}`
  );
  assert.deepEqual(requests[0]?.body, { body: "Check the source." });
});

test("the first note on a step is inserted, and a racing insert falls back to an update", async () => {
  const first = clientWith(noRow);
  assert.deepEqual(
    await writeNote(first.client, reviewerId, {
      body: "New",
      projectId,
      stepId,
    }),
    {}
  );
  assert.deepEqual(
    first.requests.map(({ method }) => method),
    ["PATCH", "POST"]
  );
  assert.deepEqual(first.requests[1]?.body, {
    author_id: reviewerId,
    body: "New",
    iteration_id: stepId,
    project_id: projectId,
  });
  const responses = [
    noRow(),
    Response.json({ code: "23505", message: "duplicate key" }, { status: 409 }),
    Response.json([{ id: "x" }]),
  ];
  const raced = clientWith(() => responses.shift() ?? noRow());
  assert.deepEqual(
    await writeNote(raced.client, reviewerId, {
      body: "New",
      projectId,
      stepId,
    }),
    {}
  );
  assert.deepEqual(
    raced.requests.map(({ method }) => method),
    ["PATCH", "POST", "PATCH"]
  );
});

test("clearing a note deletes only the author's note on that step", async () => {
  const { client, requests } = clientWith();
  assert.deepEqual(
    await writeNote(client, reviewerId, { body: "   ", projectId, stepId }),
    {}
  );
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.method, "DELETE");
  assert.equal(
    requests[0]?.url.searchParams.get("author_id"),
    `eq.${reviewerId}`
  );
  assert.equal(
    requests[0]?.url.searchParams.get("iteration_id"),
    `eq.${stepId}`
  );
});

test("rows the database hides and policy violations both read as forbidden", async () => {
  const results = await Promise.all(
    ["42501", "23514"].flatMap((code) => {
      const denied = () =>
        clientWith(() =>
          Response.json({ code, message: "denied" }, { status: 403 })
        ).client;
      return [
        writeSteps(denied(), step),
        writeImport(denied(), { projectId, url: shareUrl }, shared()),
      ];
    })
  );
  assert.deepEqual(results, [forbidden, forbidden, forbidden, forbidden]);
});

test("duplicate sources and unexpected failures return safe messages", async () => {
  const duplicate = clientWith(() =>
    Response.json({ code: "23505", message: "duplicate key" }, { status: 409 })
  );
  assert.deepEqual(await writeSteps(duplicate.client, step), {
    error: "Those steps are already in your log.",
  });
  const broken = clientWith(() =>
    Response.json({ code: "XX000", message: "secret detail" }, { status: 500 })
  );
  const log = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(await writeSteps(broken.client, step), {
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
