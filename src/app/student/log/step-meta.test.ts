import assert from "node:assert/strict";
import { test } from "node:test";

import type { ProjectLog } from "@/lib/data/queries";
import { composeCritique } from "@/lib/process";
import { submissionMetrics } from "@/lib/submission-metrics";

import {
  critiqueDraft,
  loggedAt,
  matchedPassages,
  savedFinal,
  submitBlockers,
} from "./step-meta";
import type { LoggedStep } from "./step-meta";

const step = (overrides: Partial<LoggedStep>): LoggedStep => ({
  ai_error_evidence: null,
  ai_tool: "ChatGPT",
  created_at: "2026-10-13T00:00:00Z",
  critique: null,
  id: "step",
  import_source: "pasted_text",
  imported_at: null,
  marks: [],
  prompt: "Prompt",
  raw_answer: "Answer",
  source_url: null,
  step_number: 1,
  student_marked_ai_error: false,
  ...overrides,
});

test("editing a saved critique starts from what the student wrote and marked", () => {
  const marks = [{ end: 6, kind: "wrong", note: "Not so", start: 0 }];
  const draft = critiqueDraft(
    step({
      critique: composeCritique({
        change: "Cut the claim.",
        check: "Read the survey.",
        sources: ["https://example.com/a"],
        verdict: "partly",
      }),
      marks,
    })
  );
  assert.deepEqual(draft, {
    change: "Cut the claim.",
    check: "Read the survey.",
    marks,
    sources: ["https://example.com/a"],
    verdict: "partly",
  });
});

test("an older free-text critique is offered as the check so nothing is lost", () => {
  const draft = critiqueDraft(
    step({ critique: "Smith and Lee does not exist." })
  );
  assert.deepEqual(draft, {
    change: "",
    check: "Smith and Lee does not exist.",
    marks: [],
    sources: [],
    verdict: null,
  });
});

const log = (rows: ProjectLog["final_versions"]): ProjectLog => ({
  assignment_id: "assignment",
  final_versions: rows,
  id: "project",
  iterations: [],
  status: "draft",
  submitted_at: null,
});

test("the saved final version is the current row, or empty before the first save", () => {
  assert.deepEqual(savedFinal(log([])), {
    createdAt: null,
    filename: null,
    text: "",
    version: 0,
  });
  assert.deepEqual(
    savedFinal(
      log([
        {
          created_at: "2026-10-14T01:00:00Z",
          extracted_text: "Essay",
          id: "final",
          original_filename: "essay.docx",
          version_number: 3,
        },
      ])
    ),
    {
      createdAt: "2026-10-14T01:00:00Z",
      filename: "essay.docx",
      text: "Essay",
      version: 3,
    }
  );
});

test("a step with no critique yet starts empty", () => {
  assert.deepEqual(critiqueDraft(step({})), {
    change: "",
    check: "",
    marks: [],
    sources: [],
    verdict: null,
  });
});

test("a step shows the day and time it was saved to the log", () => {
  const shown = loggedAt(step({ created_at: "2026-10-13T12:34:00Z" }));
  assert.match(shown, /Oct/u);
  assert.match(shown, /\d{1,2}:\d{2}/u);
});

test("matched passages quote the saved text and name the step they came from", () => {
  const text =
    "My own opening. Plants turn light into stored sugar every day. Done.";
  const metrics = submissionMetrics({
    final_versions: [{ extracted_text: text, id: "final", version_number: 1 }],
    iterations: [
      {
        critique: null,
        id: "second",
        raw_answer:
          "Plants turn light into stored sugar every day of the year.",
        step_number: 2,
        student_marked_ai_error: false,
      },
    ],
  });
  assert.deepEqual(matchedPassages(metrics, text), [
    {
      start: 16,
      stepNumber: 2,
      text: "Plants turn light into stored sugar every day",
      words: 8,
    },
  ]);
  assert.deepEqual(
    matchedPassages(
      submissionMetrics({ final_versions: [], iterations: [] }),
      ""
    ),
    []
  );
});

test("a log is ready to submit only with a critique on every step and a saved final version", () => {
  const checked = step({ critique: "Checked." });
  const open = [
    step({ critique: "  ", step_number: 2 }),
    step({ step_number: 3 }),
  ];
  assert.deepEqual(submitBlockers({ iterations: [] }, { text: "Essay" }), [
    "Add at least one step.",
  ]);
  assert.deepEqual(
    submitBlockers({ iterations: [checked, ...open] }, { text: " \n" }),
    ["Add a critique to step 2, 3.", "Save your final version."]
  );
  assert.deepEqual(
    submitBlockers({ iterations: [checked] }, { text: "Essay" }),
    []
  );
});
