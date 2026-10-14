import assert from "node:assert/strict";
import { test } from "node:test";

import { MATCHING_VERSION, MIN_MATCH_WORDS, matchFinal } from "./final-match";

const SOURCE =
  "Photosynthesis converts light energy into chemical energy stored in glucose.";
const OTHER =
  "Cellular respiration releases the energy that glucose stores inside mitochondria.";

const sources = [
  { answer: SOURCE, id: "one" },
  { answer: OTHER, id: "two" },
];

const retained = (match: ReturnType<typeof matchFinal>) =>
  Object.fromEntries(match.sources.map((s) => [s.id, s.retainedWords]));

test("no logged answers leaves every final word unmatched", () => {
  const match = matchFinal(SOURCE, []);
  assert.equal(match.matchingVersion, MATCHING_VERSION);
  assert.equal(match.totalWords, 10);
  assert.equal(match.matchedWords, 0);
  assert.equal(match.unmatchedWords, 10);
  assert.equal(match.unmatchedPercent, 100);
  assert.deepEqual(match.spans, []);
  assert.deepEqual(match.sources, []);
});

test("an empty final has no words and no percentage", () => {
  for (const text of ["", "  \n\t", "— … !"]) {
    const match = matchFinal(text, sources);
    assert.equal(match.totalWords, 0);
    assert.equal(match.matchedWords, 0);
    assert.equal(match.unmatchedWords, 0);
    assert.equal(match.unmatchedPercent, null);
    assert.deepEqual(match.spans, []);
    assert.deepEqual(retained(match), { one: 0, two: 0 });
  }
});

test("a final that is a logged answer matches everything and ends on its source", () => {
  const match = matchFinal(SOURCE, sources);
  assert.equal(match.matchedWords, 10);
  assert.equal(match.unmatchedWords, 0);
  assert.equal(match.unmatchedPercent, 0);
  assert.deepEqual(match.spans, [
    { end: SOURCE.length - 1, start: 0, stepId: "one", words: 10 },
  ]);
  assert.deepEqual(retained(match), { one: 10, two: 0 });
});

test("a run shorter than the minimum span is not a match", () => {
  const short = "Photosynthesis converts light energy into chemical";
  assert.equal(short.split(" ").length, MIN_MATCH_WORDS);
  assert.equal(matchFinal(short, sources).matchedWords, MIN_MATCH_WORDS);
  const five = "Photosynthesis converts light energy into";
  const match = matchFinal(`${five}. Then something else entirely.`, sources);
  assert.equal(match.matchedWords, 0);
  assert.equal(match.unmatchedPercent, 100);
});

test("case, punctuation and spacing do not change a match, and spans index the original text", () => {
  const final = `Intro words here. “PHOTOSYNTHESIS — converts light-energy,\n\tinto chemical energy; stored in glucose!” Outro.`;
  const match = matchFinal(final, sources);
  assert.equal(match.totalWords, 3 + 10 + 1);
  assert.equal(match.matchedWords, 10);
  const [span] = match.spans;
  assert.equal(match.spans.length, 1);
  assert.equal(span?.stepId, "one");
  assert.equal(
    final.slice(span?.start, span?.end),
    "PHOTOSYNTHESIS — converts light-energy,\n\tinto chemical energy; stored in glucose"
  );
});

test("accented and decomposed letters compare equal", () => {
  const answer = "Le café était très agréable ce matin là";
  const decomposed = answer.normalize("NFD").toUpperCase();
  const match = matchFinal(decomposed, [{ answer, id: "one" }]);
  assert.equal(match.totalWords, 8);
  assert.equal(match.matchedWords, 8);
});

test("a repeated quotation counts each final word once and every occurrence matches", () => {
  const final = `${SOURCE} Between them is new text. ${SOURCE}`;
  const match = matchFinal(final, sources);
  assert.equal(match.totalWords, 25);
  assert.equal(match.matchedWords, 20);
  assert.equal(match.unmatchedWords, 5);
  assert.equal(match.spans.length, 2);
  assert.deepEqual(retained(match), { one: 20, two: 0 });
});

test("identical outputs credit the earliest step", () => {
  const match = matchFinal(SOURCE, [
    { answer: SOURCE, id: "late" },
    { answer: SOURCE.toUpperCase(), id: "later" },
  ]);
  assert.deepEqual(retained(match), { late: 10, later: 0 });
  const swapped = matchFinal(SOURCE, [
    { answer: SOURCE, id: "first" },
    { answer: SOURCE, id: "second" },
  ]);
  assert.deepEqual(retained(swapped), { first: 10, second: 0 });
});

test("overlapping outputs credit shared words to the earliest step and still add up", () => {
  const first = "alpha bravo charlie delta echo foxtrot golf hotel";
  const second = "charlie delta echo foxtrot golf hotel india juliet kilo";
  const final =
    "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo";
  const match = matchFinal(final, [
    { answer: first, id: "first" },
    { answer: second, id: "second" },
  ]);
  assert.equal(match.totalWords, 11);
  assert.equal(match.matchedWords, 11);
  assert.deepEqual(retained(match), { first: 8, second: 3 });
  assert.equal(
    match.sources.reduce((total, step) => total + step.retainedWords, 0),
    match.matchedWords
  );
  assert.deepEqual(
    match.spans.map(({ stepId, words }) => [stepId, words]),
    [
      ["first", 8],
      ["second", 3],
    ]
  );
  const reversed = matchFinal(final, [
    { answer: second, id: "second" },
    { answer: first, id: "first" },
  ]);
  assert.deepEqual(retained(reversed), { first: 2, second: 9 });
});

test("a later output only claims words the earlier ones do not match", () => {
  const final = `${SOURCE} ${OTHER}`;
  const match = matchFinal(final, sources);
  assert.deepEqual(retained(match), { one: 10, two: 10 });
  assert.equal(match.unmatchedWords, 0);
  assert.deepEqual(
    match.spans.map(({ stepId }) => stepId),
    ["one", "two"]
  );
  assert.equal(final.slice(match.spans[1]?.start), OTHER);
});

test("per-step answer lengths use the same word count as the final", () => {
  const match = matchFinal("", [
    { answer: "well-known, 3.5 times", id: "one" },
  ]);
  assert.deepEqual(match.sources, [
    { answerWords: 5, id: "one", retainedWords: 0 },
  ]);
});

test("the same inputs always give the same result", () => {
  const final = `${OTHER} extra words ${SOURCE}`;
  assert.deepEqual(matchFinal(final, sources), matchFinal(final, sources));
});

test("the unmatched percentage is rounded to one decimal", () => {
  const answer = "one two three four five six";
  const match = matchFinal(
    `${answer} seven eight nine ten eleven twelve thirteen`,
    [{ answer, id: "one" }]
  );
  assert.equal(match.totalWords, 13);
  assert.equal(match.unmatchedPercent, 53.8);
});
