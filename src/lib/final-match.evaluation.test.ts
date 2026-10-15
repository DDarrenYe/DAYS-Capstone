import assert from "node:assert/strict";
import { test } from "node:test";

import { matchFinal } from "./final-match";

const PHOTOSYNTHESIS =
  "Photosynthesis converts light energy into chemical energy stored in glucose.";
const RESPIRATION =
  "Cellular respiration releases the energy that glucose stores inside mitochondria.";
const INFLATION =
  "Inflation rises when demand outpaces supply for long enough, and central banks respond by raising interest rates to cool spending.";

interface Case {
  answers: string[];
  copied: number;
  final: string;
  kind: "exact" | "edited" | "overlap" | "not copied";
  matched: number;
  name: string;
}

const cases: Case[] = [
  {
    answers: [PHOTOSYNTHESIS],
    copied: 10,
    final: `In my own words, the essay begins here. ${PHOTOSYNTHESIS} I then explain why.`,
    kind: "exact",
    matched: 10,
    name: "a logged sentence inside new writing",
  },
  {
    answers: [PHOTOSYNTHESIS],
    copied: 10,
    final:
      "“photosynthesis converts light-energy\ninto CHEMICAL energy; stored in glucose”",
    kind: "exact",
    matched: 10,
    name: "the same sentence with different case, quotes, hyphen and line break",
  },
  {
    answers: [PHOTOSYNTHESIS],
    copied: 10,
    final: PHOTOSYNTHESIS,
    kind: "exact",
    matched: 10,
    name: "the whole answer pasted alone",
  },
  {
    answers: [PHOTOSYNTHESIS],
    copied: 9,
    final:
      "Photosynthesis converts light energy into chemical energy stored in sugar.",
    kind: "edited",
    matched: 9,
    name: "the last word changed",
  },
  {
    answers: [PHOTOSYNTHESIS],
    copied: 9,
    final:
      "Photosynthesis converts light energy into usable energy stored in glucose.",
    kind: "edited",
    matched: 0,
    name: "one word changed in the middle of a ten-word sentence",
  },
  {
    answers: [PHOTOSYNTHESIS],
    copied: 10,
    final:
      "Photosynthesis converts light energy directly into chemical energy stored in glucose.",
    kind: "edited",
    matched: 6,
    name: "one word inserted after the fourth word",
  },
  {
    answers: [INFLATION],
    copied: 16,
    final:
      "Inflation rises when demand exceeds supply for long enough, but central banks respond by lifting interest rates to cool demand.",
    kind: "edited",
    matched: 0,
    name: "every fifth word of a twenty-word sentence swapped",
  },
  {
    answers: [PHOTOSYNTHESIS],
    copied: 5,
    final: "The plant converts light energy into chemical power for growth.",
    kind: "edited",
    matched: 0,
    name: "a five-word fragment kept",
  },
  {
    answers: [
      `${PHOTOSYNTHESIS} Plants also release oxygen.`,
      `${PHOTOSYNTHESIS} It is the base of most food chains.`,
    ],
    copied: 10,
    final: PHOTOSYNTHESIS,
    kind: "overlap",
    matched: 10,
    name: "a sentence that two logged answers share counts once",
  },
  {
    answers: [PHOTOSYNTHESIS, RESPIRATION],
    copied: 20,
    final: `${PHOTOSYNTHESIS} ${RESPIRATION}`,
    kind: "overlap",
    matched: 20,
    name: "sentences from two different answers",
  },
  {
    answers: [PHOTOSYNTHESIS],
    copied: 0,
    final: "Plants turn sunlight into sugars that they can store.",
    kind: "not copied",
    matched: 0,
    name: "a paraphrase with none of the wording",
  },
  {
    answers: ["On the other hand, it is important to consider costs."],
    copied: 0,
    final: "On the other hand, it is clear that costs matter.",
    kind: "not copied",
    matched: 6,
    name: "a six-word stock phrase the student wrote on their own",
  },
];

for (const { answers, copied, final, kind, matched, name } of cases) {
  test(`${kind}: ${name}`, () => {
    const match = matchFinal(
      final,
      answers.map((answer, index) => ({ answer, id: String(index) }))
    );
    assert.equal(match.matchedWords, matched);
    assert.ok(copied <= match.totalWords);
  });
}

test("the matcher differs from the labels only where the limits are documented", () => {
  assert.deepEqual(
    cases.filter((c) => c.matched !== c.copied).map(({ name }) => name),
    [
      "one word changed in the middle of a ten-word sentence",
      "one word inserted after the fourth word",
      "every fifth word of a twenty-word sentence swapped",
      "a five-word fragment kept",
      "a six-word stock phrase the student wrote on their own",
    ]
  );
});
