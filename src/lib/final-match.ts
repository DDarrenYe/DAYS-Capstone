export const MATCHING_VERSION = "words-6.v1";
export const MIN_MATCH_WORDS = 6;

const WORD = /[\p{L}\p{N}\p{M}]+/gu;
const NO_OWNER = -1;

export interface MatchSource {
  answer: string;
  id: string;
}

export interface MatchSpan {
  end: number;
  start: number;
  stepId: string;
  words: number;
}

export interface SourceMatch {
  answerWords: number;
  id: string;
  retainedWords: number;
}

export interface FinalMatch {
  matchedWords: number;
  matchingVersion: string;
  sources: SourceMatch[];
  spans: MatchSpan[];
  totalWords: number;
  unmatchedPercent: number | null;
  unmatchedWords: number;
}

interface Word {
  end: number;
  start: number;
  text: string;
}

const wordsOf = (text: string): Word[] =>
  Array.from(text.matchAll(WORD), ({ 0: word, index }) => ({
    end: index + word.length,
    start: index,
    text: word.normalize("NFC").toLowerCase(),
  }));

const windowsOf = (words: readonly Word[]) =>
  Array.from(
    { length: Math.max(0, words.length - MIN_MATCH_WORDS + 1) },
    (_, start) =>
      words
        .slice(start, start + MIN_MATCH_WORDS)
        .map(({ text }) => text)
        .join(" ")
  );

const earliestSources = (sources: readonly MatchSource[]) => {
  const earliest = new Map<string, number>();
  const answerWords = sources.map(({ answer }, index) => {
    const words = wordsOf(answer);
    for (const window of windowsOf(words)) {
      if (!earliest.has(window)) {
        earliest.set(window, index);
      }
    }
    return words.length;
  });
  return { answerWords, earliest };
};

const ownersOf = (words: readonly Word[], earliest: Map<string, number>) => {
  const owners = words.map(() => NO_OWNER);
  for (const [start, window] of windowsOf(words).entries()) {
    const owner = earliest.get(window);
    if (owner !== undefined) {
      for (let at = start; at < start + MIN_MATCH_WORDS; at += 1) {
        const current = owners[at] ?? NO_OWNER;
        owners[at] = current === NO_OWNER ? owner : Math.min(current, owner);
      }
    }
  }
  return owners;
};

const spansOf = (
  words: readonly Word[],
  owners: readonly number[],
  sources: readonly MatchSource[]
) => {
  const spans: MatchSpan[] = [];
  for (const [at, { start, end }] of words.entries()) {
    const owner = owners[at] ?? NO_OWNER;
    const source = sources[owner];
    if (source) {
      const last = spans.at(-1);
      if (last && owners[at - 1] === owner) {
        last.end = end;
        last.words += 1;
      } else {
        spans.push({ end, start, stepId: source.id, words: 1 });
      }
    }
  }
  return spans;
};

export const matchFinal = (
  finalText: string,
  sources: readonly MatchSource[]
): FinalMatch => {
  const { answerWords, earliest } = earliestSources(sources);
  const words = wordsOf(finalText);
  const owners = ownersOf(words, earliest);
  const retained = sources.map(
    (_, index) => owners.filter((owner) => owner === index).length
  );
  const matchedWords = retained.reduce((total, count) => total + count, 0);
  const unmatchedWords = words.length - matchedWords;
  return {
    matchedWords,
    matchingVersion: MATCHING_VERSION,
    sources: sources.map(({ id }, index) => ({
      answerWords: answerWords[index] ?? 0,
      id,
      retainedWords: retained[index] ?? 0,
    })),
    spans: spansOf(words, owners, sources),
    totalWords: words.length,
    unmatchedPercent:
      words.length === 0
        ? null
        : Math.round((unmatchedWords / words.length) * 1000) / 10,
    unmatchedWords,
  };
};
