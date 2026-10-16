import { strict as assert } from "node:assert";
import { test } from "node:test";

import { essayChoices, sampleReview } from "./sample-step";

const CHECK = "I looked for Chen and Alvarez and found nothing";

test("copying the answer into the essay traces it, and the matched words sit inside the answer", () => {
  const { marks, step, untraced } = sampleReview("copied", CHECK);
  assert.ok(marks.length > 0);
  assert.ok(step.carried > 0 && step.carried <= step.words);
  assert.ok(untraced > 0 && untraced < 0.5);
});

test("rewording or skipping the answer traces nothing", () => {
  for (const choice of ["reworded", "skipped"] as const) {
    const { marks, step, untraced } = sampleReview(choice, CHECK);
    assert.deepEqual(marks, []);
    assert.equal(step.carried, 0);
    assert.equal(untraced, 1);
  }
});

test("the critique bar follows the words written, and every choice is covered", () => {
  assert.equal(sampleReview("copied", "").step.critiqueWords, 0);
  assert.equal(sampleReview("copied", CHECK).step.critiqueWords, 9);
  assert.equal(essayChoices.length, 3);
});
