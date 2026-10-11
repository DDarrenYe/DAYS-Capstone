import assert from "node:assert/strict";
import { test } from "node:test";

import { describeAssignment, noteFor } from "./assignment-state";

const now = Date.parse("2026-10-12T12:00:00Z");
const past = "2026-10-11T12:00:00Z";
const future = "2026-10-13T12:00:00Z";

const assignment = (
  lane: "lane_1" | "lane_2",
  dueAt: string | null,
  project?: { status: "draft" | "submitted"; steps: number }
): Parameters<typeof describeAssignment>[0] => ({
  brief: "",
  course: { code: "INFOMGMT 399", title: "Course" },
  due_at: dueAt,
  id: "assignment",
  lane,
  projects: project
    ? [
        {
          id: "project",
          iterations: [{ count: project.steps }],
          status: project.status,
          submitted_at: project.status === "submitted" ? past : null,
        },
      ]
    : [],
  title: "Title",
});

test("an unsubmitted Lane 2 draft past its due date is overdue", () => {
  const state = describeAssignment(
    assignment("lane_2", past, { status: "draft", steps: 2 }),
    now
  );
  assert.equal(state.overdue, true);
  assert.deepEqual(noteFor(state), {
    text: "Overdue. Finish your log and submit.",
    tone: "pink",
  });
});

test("submitted, upcoming, undated and Lane 1 assignments are never overdue", () => {
  const states = [
    assignment("lane_2", past, { status: "submitted", steps: 3 }),
    assignment("lane_2", future, { status: "draft", steps: 1 }),
    assignment("lane_2", null),
    assignment("lane_1", past),
  ].map((row) => describeAssignment(row, now));
  assert.deepEqual(
    states.map(({ overdue }) => overdue),
    [false, false, false, false]
  );
  assert.equal(states[3]?.past, true);
});

test("project progress comes from the caller's project only", () => {
  const draft = describeAssignment(
    assignment("lane_2", future, { status: "draft", steps: 3 }),
    now
  );
  assert.deepEqual(
    [draft.hasProject, draft.steps, draft.submitted],
    [true, 3, false]
  );
  assert.equal(noteFor(draft).text, "3 steps so far. Keep logging!");
  const fresh = describeAssignment(assignment("lane_2", future), now);
  assert.deepEqual([fresh.hasProject, fresh.steps], [false, 0]);
  assert.equal(noteFor(fresh).text, "0 steps so far. Keep logging!");
});
