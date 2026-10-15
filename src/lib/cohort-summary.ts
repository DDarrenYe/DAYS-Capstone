import { isUnfinished } from "@/lib/submission-rows";
import type { SubmissionRow } from "@/lib/submission-rows";

export const BIN_COUNT = 10;
const BIN_WIDTH = 100 / BIN_COUNT;

const flagKindLabels = new Map([
  ["low_effort_reflection", "Thin critique"],
  ["reads_like_ai", "Critique may read as AI-written"],
]);

export const flagKindLabel = (kind: string) =>
  flagKindLabels.get(kind) ??
  `${kind.charAt(0).toUpperCase()}${kind.slice(1).replaceAll("_", " ")}`;

export const assignmentsOf = (rows: readonly SubmissionRow[]) =>
  Array.from(
    Map.groupBy(rows, ({ assignmentId }) => assignmentId),
    ([id, group]) => ({
      id,
      submissions: group.length,
      title: group[0]?.assignment ?? "",
    })
  ).toSorted((first, second) => first.title.localeCompare(second.title));

const sum = (
  rows: readonly SubmissionRow[],
  pick: (row: SubmissionRow) => number
) => rows.reduce((total, row) => total + pick(row), 0);

const median = (values: readonly number[]) => {
  if (values.length === 0) {
    return null;
  }
  const sorted = values.toSorted((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? (sorted[middle] ?? 0)
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
};

const binOf = (percent: number) =>
  Math.min(BIN_COUNT - 1, Math.floor(percent / BIN_WIDTH));

export const cohortSummary = (rows: readonly SubmissionRow[]) => {
  const percents = rows.flatMap(({ unmatchedPercent }) =>
    unmatchedPercent === null ? [] : [unmatchedPercent]
  );
  const flagged = rows.filter(({ state }) => state === "flagged").length;
  const unfinished = rows.filter(isUnfinished).length;
  const totalWords = sum(rows, (row) => row.totalWords);
  const unmatchedWords = sum(rows, (row) => row.unmatchedWords);
  const kinds = new Map<string, number>();
  for (const { openKinds } of rows) {
    for (const { count, kind } of openKinds) {
      kinds.set(kind, (kinds.get(kind) ?? 0) + count);
    }
  }
  return {
    counts: {
      clear: rows.length - flagged - unfinished,
      flagged,
      unfinished,
    },
    distribution: Array.from(
      { length: BIN_COUNT },
      (_, bin) => percents.filter((percent) => binOf(percent) === bin).length
    ),
    feedbackFlags: sum(rows, (row) => row.feedbackFlags),
    medianSteps: median(rows.map((row) => row.stepCount)),
    medianUnmatched: median(percents),
    reasons: Array.from(kinds, ([kind, count]) => ({ count, kind })).toSorted(
      (first, second) =>
        second.count - first.count || first.kind.localeCompare(second.kind)
    ),
    submissions: rows.length,
    totalWords,
    unmatchedPercent:
      totalWords === 0
        ? null
        : Math.round((unmatchedWords / totalWords) * 1000) / 10,
  };
};

export type CohortSummary = ReturnType<typeof cohortSummary>;
