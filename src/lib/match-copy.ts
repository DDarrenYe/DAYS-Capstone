import { formatWords } from "@/lib/process";

export const matchTotalsText = ({
  matchedWords,
  totalWords,
  unmatchedPercent,
  unmatchedWords,
}: {
  matchedWords: number;
  totalWords: number;
  unmatchedPercent: number | null;
  unmatchedWords: number;
}) =>
  `${matchedWords.toLocaleString("en")} of ${formatWords(totalWords)} match a logged AI answer. ${unmatchedWords.toLocaleString("en")} don’t (${unmatchedPercent}%).`;

export const matchCaveat = (minWords: number) =>
  `A match is a run of at least ${minWords} words that also appears in a logged AI answer. A quote with a word changed in every few words, or a paraphrase, doesn’t match, and a common phrase can. Words that don’t match aren’t proof the student wrote them, and a match isn’t proof they didn’t. Read matches next to the critique.`;
