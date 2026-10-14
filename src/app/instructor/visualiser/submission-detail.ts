import { marksOf, stepTitle } from "@/app/student/log/step-meta";
import { flagKindLabel } from "@/lib/cohort-summary";
import type { SubmissionProject } from "@/lib/data/queries";
import { MIN_MATCH_WORDS } from "@/lib/final-match";
import type { MatchSpan } from "@/lib/final-match";
import { countWords, critiqueCoverage, readCritique } from "@/lib/process";
import {
  critiqueAverage,
  currentAnalyses,
  submissionMetrics,
} from "@/lib/submission-metrics";
import { checkState } from "@/lib/submission-rows";

const TIME_ZONE = "Pacific/Auckland";

const dayFormat = new Intl.DateTimeFormat("en", {
  day: "numeric",
  timeZone: TIME_ZONE,
  weekday: "short",
});

const dayLabel = (date: Date) => {
  const parts = Object.fromEntries(
    dayFormat.formatToParts(date).map(({ type, value }) => [type, value])
  );
  return `${parts.weekday} ${parts.day}`;
};

const timeFormat = new Intl.DateTimeFormat("en", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  timeZone: TIME_ZONE,
  weekday: "short",
});

const PARAGRAPH = /[^\r\n]+/gu;

export interface EssayRun {
  start: number;
  step?: number;
  text: string;
}

export const essayParagraphs = (
  text: string,
  spans: readonly MatchSpan[],
  stepIndexes: ReadonlyMap<string, number>
) =>
  Array.from(text.matchAll(PARAGRAPH), ({ 0: line, index }) => ({
    end: index + line.length,
    line,
    start: index,
  }))
    .filter(({ line }) => line.trim() !== "")
    .map(({ end, start }) => {
      const runs: EssayRun[] = [];
      let at = start;
      for (const span of spans) {
        const from = Math.max(span.start, at);
        const to = Math.min(span.end, end);
        const step = stepIndexes.get(span.stepId);
        if (to > from && step !== undefined) {
          if (from > at) {
            runs.push({ start: at, text: text.slice(at, from) });
          }
          runs.push({ start: from, step, text: text.slice(from, to) });
          at = to;
        }
      }
      if (at < end) {
        runs.push({ start: at, text: text.slice(at, end) });
      }
      return runs;
    });

export const submissionDetail = (project: SubmissionProject) => {
  const metrics = submissionMetrics(project);
  const final = project.final_versions.find(
    ({ id }) => id === metrics.finalVersionId
  );
  const iterations = new Map(project.iterations.map((item) => [item.id, item]));
  const flagged = Map.groupBy(
    currentAnalyses(project, project.analysis_results, metrics.finalVersionId),
    ({ iteration_id: id }) => id
  );
  const steps = metrics.steps.flatMap((metric) => {
    const iteration = iterations.get(metric.id);
    if (!iteration) {
      return [];
    }
    const createdAt = new Date(iteration.created_at);
    const critique = iteration.critique ?? "";
    const flags = (flagged.get(metric.id) ?? []).flatMap((result) =>
      result.flags.map(
        ({ evidence, explanation, id, kind, review_state: state }) => ({
          evidence,
          explanation,
          id,
          kind,
          label: flagKindLabel(kind),
          state,
        })
      )
    );
    const open = flags.filter(({ state }) => state === "open");
    return [
      {
        answer: iteration.raw_answer,
        answered: critiqueCoverage(readCritique(iteration.critique)),
        asked: iteration.prompt,
        carried: metric.retainedWords,
        critique,
        critiqueWords: countWords(critique),
        day: dayLabel(createdAt),
        depth: metric.questionsAnswered,
        evidence: iteration.ai_error_evidence ?? "",
        flag: open.length > 1 ? `${open.length} open flags` : open[0]?.label,
        flags,
        id: metric.id,
        markedError: metric.markedError,
        marks: marksOf(iteration),
        time: timeFormat.format(createdAt),
        title: stepTitle(iteration),
        words: metric.answerWords,
      },
    ];
  });
  const { email, profile } = project.student;
  return {
    assignment: project.assignment,
    check: checkState({ analysisStatus: project.analysis_status, metrics }),
    critiqueAverage: critiqueAverage(metrics),
    days: new Set(steps.map(({ day }) => day)).size,
    email,
    essay: essayParagraphs(
      final?.extracted_text ?? "",
      metrics.spans,
      new Map(steps.map(({ id }, index) => [id, index]))
    ),
    file: final?.original_filename ?? null,
    id: project.id,
    markedErrors: metrics.markedErrors,
    match: {
      matchedWords: metrics.matchedWords,
      minWords: MIN_MATCH_WORDS,
      totalWords: metrics.totalWords,
      unmatchedPercent: metrics.unmatchedPercent,
      unmatchedWords: metrics.unmatchedWords,
    },
    name: profile?.display_name ?? email,
    openFlags: metrics.flags?.open ?? 0,
    steps,
    submitted: project.submitted_at
      ? timeFormat.format(new Date(project.submitted_at))
      : "",
  };
};

export type SubmissionDetail = ReturnType<typeof submissionDetail>;
