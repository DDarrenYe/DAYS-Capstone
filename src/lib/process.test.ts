import { strict as assert } from "node:assert";
import { test } from "node:test";

import { cohort, cohortFlags, steps, student, summary } from "./example-data";
import {
  composeCritique,
  countWords,
  parseCritique,
  critiqueCoverage,
  formatPercent,
  formatWords,
  niceCeil,
  wordsAxis,
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

test("formatWords says one word and groups thousands", () => {
  assert.equal(formatWords(0), "0 words");
  assert.equal(formatWords(1), "1 word");
  assert.equal(formatWords(1204), "1,204 words");
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

test("the three answers become one critique with the questions as headings", () => {
  assert.equal(
    composeCritique({
      change: "  Rewrote the claim.  ",
      check: " Read the survey. ",
      sources: ["https://example.com/a", "https://example.com/b"],
      verdict: "partly",
    }),
    [
      "Was the AI right or wrong? Partly right",
      "How did you check? Read the survey.\nSource: https://example.com/a\nSource: https://example.com/b",
      "What did you change? Rewrote the claim.",
    ].join("\n\n")
  );
  assert.match(
    composeCritique({ change: "", check: "", sources: [], verdict: null }),
    /^Was the AI right or wrong\? Not said/u
  );
  assert.match(
    composeCritique({ change: "", check: "", sources: [], verdict: "right" }),
    /Right\n/u
  );
});

test("a composed critique reads back into its three answers", () => {
  const input = {
    change: "Rewrote the claim.\n\nThen cut the second sentence.",
    check: "Read the survey.\n\nChecked the table too.",
    sources: ["https://example.com/a", "https://example.com/b"],
    verdict: "wrong",
  };
  assert.deepEqual(parseCritique(composeCritique(input)), input);
  assert.deepEqual(
    parseCritique(
      composeCritique({ change: "x", check: "y", sources: [], verdict: null })
    ),
    { change: "x", check: "y", sources: [], verdict: null }
  );
});

test("a critique that was not composed from the three answers is left as written", () => {
  assert.equal(parseCritique("Looks good."), null);
  assert.equal(
    parseCritique("Was the AI right or wrong? Wrong\n\nNothing else."),
    null
  );
  assert.equal(parseCritique(""), null);
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

test("niceCeil rounds up to a readable step that keeps bars tall", () => {
  assert.equal(niceCeil(0), 1);
  assert.equal(niceCeil(1), 1);
  assert.equal(niceCeil(1.2), 1.5);
  assert.equal(niceCeil(420), 500);
  assert.equal(niceCeil(500), 500);
  assert.equal(niceCeil(501), 600);
  assert.equal(niceCeil(1840), 2000);
  assert.equal(niceCeil(2019), 2500);
  assert.equal(niceCeil(9001), 10_000);
});

test("wordsAxis fits the longest answer, so long ChatGPT turns never overflow", () => {
  assert.equal(wordsAxis(steps), 500);
  assert.equal(wordsAxis([{ words: 2600 }, { words: 40 }]), 3000);
  assert.equal(wordsAxis([]), 1);
});
