export type MarkKind = "wrong" | "unsourced" | "used";

export interface Mark {
  start: number;
  end: number;
  kind: MarkKind;
}

/* A new mark replaces any mark it overlaps; empty or inverted ranges are ignored. */
export const addMark = (marks: readonly Mark[], mark: Mark): Mark[] => {
  if (mark.end <= mark.start) {
    return [...marks];
  }
  return [
    ...marks.filter((item) => item.end <= mark.start || item.start >= mark.end),
    mark,
  ].toSorted((a, b) => a.start - b.start);
};

/* Splits text into runs so each marked range renders as one element. */
export const splitMarks = (text: string, marks: readonly Mark[]) => {
  const runs: { text: string; mark?: Mark }[] = [];
  let at = 0;
  for (const mark of marks.toSorted((a, b) => a.start - b.start)) {
    const start = Math.max(mark.start, at);
    const end = Math.min(mark.end, text.length);
    if (end <= start) {
      continue;
    }
    if (start > at) {
      runs.push({ text: text.slice(at, start) });
    }
    runs.push({ mark, text: text.slice(start, end) });
    at = end;
  }
  if (at < text.length) {
    runs.push({ text: text.slice(at) });
  }
  return runs;
};
