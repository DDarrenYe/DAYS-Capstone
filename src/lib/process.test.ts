import { strict as assert } from "node:assert";
import { test } from "node:test";

import { cohort, cohortFlags, steps, student, summary } from "./example-data";
import {
  countWords,
  critiqueCoverage,
  formatPercent,
  summarise,
} from "./process";

test("summarise derives the headline figures from the steps", () => {
  assert.equal(summary.carried, 384);
  assert.equal(formatPercent(summary.untraced), "68%");
  assert.equal(summary.caught, 3);
  assert.equal(summary.flags, 2);
  assert.equal(summary.depth.toFixed(1), "2.0");
});

test("summarise stays defined for an empty log or an empty essay", () => {
  assert.deepEqual(summarise([], 0), {
    carried: 0,
    caught: 0,
    depth: 0,
    flags: 0,
    untraced: 0,
  });
  assert.equal(summarise(steps, 0).untraced, 0);
});

test("countWords ignores surrounding and repeated whitespace", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords("   "), 0);
  assert.equal(countWords("  Looks   good. "), 2);
});

test("a critique answers a question only with a verdict or six words", () => {
  assert.deepEqual(
    critiqueCoverage({ change: "Fixed it.", check: "", verdict: null }),
    { change: false, check: false, verdict: false }
  );
  assert.deepEqual(
    critiqueCoverage({
      change: "I rewrote the sentence in paragraph 3",
      check: "I looked up the 2025 student survey",
      verdict: "wrong",
    }),
    { change: true, check: true, verdict: true }
  );
});

test("the example cohort agrees with its flag list and the open student", () => {
  assert.equal(cohort.length, 41);
  assert.equal(
    cohort.reduce((total, row) => total + row.flags, 0),
    cohortFlags.length
  );
  const john = cohort.find((row) => row.name === student.name);
  assert.equal(john?.flags, summary.flags);
  assert.equal(john?.detail, true);
  for (const row of cohort) {
    const flagged = row.steps.filter((step) => step.flag).length;
    assert.equal(flagged, row.flags, row.name);
  }
});
