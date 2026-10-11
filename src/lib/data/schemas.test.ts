import assert from "node:assert/strict";
import { test } from "node:test";

import { assignmentFormSchema, courseSchema, enrolFormSchema } from "./schemas";

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message);

test("blank course fields say what is missing, per field", () => {
  const result = courseSchema.safeParse({ code: "  ", title: "x".repeat(201) });
  assert.deepEqual(
    result.error?.issues.map(({ message, path }) => [path[0], message]),
    [
      ["code", "Required"],
      ["title", "Use 200 characters or fewer"],
    ]
  );
});

test("assignment form needs a title and accepts an empty due date", () => {
  const form = { brief: "", dueAt: "", lane: "lane_2", title: "Essay" };
  assert.equal(assignmentFormSchema.safeParse(form).success, true);
  assert.deepEqual(
    messages(assignmentFormSchema.safeParse({ ...form, title: " " })),
    ["Required"]
  );
});

test("pasted addresses must contain at least one and at most 500", () => {
  assert.deepEqual(messages(enrolFormSchema.safeParse({ emails: " , ; " })), [
    "Paste at least one email address",
  ]);
  const many = Array.from({ length: 501 }, (_, i) => `s${i}@example.com`);
  assert.deepEqual(
    messages(enrolFormSchema.safeParse({ emails: many.join(" ") })),
    ["Paste up to 500 addresses at a time"]
  );
  assert.equal(
    enrolFormSchema.safeParse({ emails: "a@example.com, b@example.com" })
      .success,
    true
  );
});
