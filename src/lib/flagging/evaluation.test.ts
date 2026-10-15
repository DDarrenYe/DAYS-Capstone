import assert from "node:assert/strict";
import { test } from "node:test";

import { score } from "./evaluation";
import type { LabelledStep, Verdict } from "./evaluation";
import { DATASET } from "./evaluation.dataset";

const none = { aiCorrectness: false, changes: false, verification: false };

const example = (
  id: string,
  flags: LabelledStep["flags"],
  addressed = none
): LabelledStep => ({
  addressed,
  category: "thin",
  flags,
  id,
  step: { aiAnswer: "answer", critique: "critique", prompt: "prompt" },
});

const verdict = (flags: Verdict["flags"], addressed = none): Verdict => ({
  addressed,
  flags,
});

test("the dataset has at least 30 unique steps across every required category", () => {
  assert.ok(DATASET.length >= 30);
  assert.equal(new Set(DATASET.map(({ id }) => id)).size, DATASET.length);
  assert.deepEqual(
    [...new Set(DATASET.map(({ category }) => category))].toSorted(),
    ["ambiguous", "polished", "specific", "thin", "verified"]
  );
});

test("blind acceptance is only labelled when no check and no change is addressed", () => {
  for (const { addressed, flags, step } of DATASET) {
    assert.notEqual(step.critique.trim(), "");
    assert.equal(new Set(flags).size, flags.length);
    if (flags.includes("blind_acceptance")) {
      assert.equal(addressed.verification, false);
      assert.equal(addressed.changes, false);
    }
  }
});

test("every supported flag has labelled positives and negatives", () => {
  for (const kind of [
    "low_effort_reflection",
    "blind_acceptance",
    "reads_like_ai",
  ] as const) {
    const positives = DATASET.filter(({ flags }) => flags.includes(kind));
    assert.ok(positives.length >= 3, kind);
    assert.ok(positives.length < DATASET.length, kind);
  }
});

test("precision, recall and the missed and wrong ids are counted per flag", () => {
  const examples = [
    example("a", ["blind_acceptance"]),
    example("b", ["blind_acceptance"]),
    example("c", []),
    example("d", []),
  ];
  const result = score(
    examples,
    new Map([
      ["a", verdict(["blind_acceptance"])],
      ["b", verdict([])],
      ["c", verdict(["blind_acceptance"])],
      ["d", verdict([])],
    ])
  );
  assert.deepEqual(
    result.flags.map(({ kind }) => kind),
    ["low_effort_reflection", "blind_acceptance", "reads_like_ai"]
  );
  assert.deepEqual(result.flags[1], {
    falseNegatives: ["b"],
    falsePositives: ["c"],
    kind: "blind_acceptance",
    precision: 0.5,
    recall: 0.5,
    truePositives: 1,
  });
  assert.equal(result.flags[2]?.precision, null);
  assert.equal(result.flags[2]?.recall, null);
});

test("question agreement counts only the steps that have a prediction", () => {
  const result = score(
    [
      example("a", [], { ...none, changes: true }),
      example("b", []),
      example("missing", []),
    ],
    new Map([
      ["a", verdict([], { ...none, changes: true, verification: true })],
      ["b", verdict([])],
    ])
  );
  assert.equal(result.scored, 2);
  assert.deepEqual(result.agreement, [
    { agreed: 2, question: "aiCorrectness" },
    { agreed: 1, question: "verification" },
    { agreed: 2, question: "changes" },
  ]);
});
