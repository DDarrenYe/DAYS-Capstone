import { strict as assert } from "node:assert";
import { test } from "node:test";

import { addMark, splitMarks } from "./marks";

test("splitMarks keeps every character in order", () => {
  const text = "Yes, around 90% of students use AI tools.";
  const runs = splitMarks(text, [{ end: 26, kind: "wrong", start: 5 }]);
  assert.equal(runs.map((run) => run.text).join(""), text);
  assert.deepEqual(
    runs.map((run) => run.mark?.kind),
    [undefined, "wrong", undefined]
  );
  assert.equal(runs[1]?.text, "around 90% of student");
});

test("splitMarks clamps marks to the text and skips empty ranges", () => {
  assert.deepEqual(splitMarks("abc", [{ end: 9, kind: "used", start: 1 }]), [
    { text: "a" },
    { mark: { end: 9, kind: "used", start: 1 }, text: "bc" },
  ]);
  assert.deepEqual(splitMarks("abc", [{ end: 1, kind: "used", start: 1 }]), [
    { text: "abc" },
  ]);
});

test("addMark replaces overlapping marks and ignores empty selections", () => {
  const first = addMark([], { end: 10, kind: "used", start: 0 });
  const second = addMark(first, { end: 14, kind: "wrong", start: 8 });
  assert.deepEqual(second, [{ end: 14, kind: "wrong", start: 8 }]);
  const third = addMark(second, { end: 30, kind: "unsourced", start: 20 });
  assert.deepEqual(
    third.map((mark) => mark.kind),
    ["wrong", "unsourced"]
  );
  assert.deepEqual(addMark(third, { end: 3, kind: "used", start: 3 }), third);
});
