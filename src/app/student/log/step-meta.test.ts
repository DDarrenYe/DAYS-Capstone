import assert from "node:assert/strict";
import { test } from "node:test";

import { composeCritique } from "@/lib/process";

import { critiqueDraft, loggedAt } from "./step-meta";
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
