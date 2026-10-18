import { marksOf, stepTitle } from "@/app/student/log/step-meta";
import type { SubmissionProject } from "@/lib/data/queries";
import { MIN_MATCH_WORDS } from "@/lib/final-match";
import type { MatchSpan } from "@/lib/final-match";
import { checkResult, flagView } from "@/lib/flag-review";
import { countWords, critiqueCoverage, readCritique } from "@/lib/process";
import {
  critiqueAverage,
  currentAnalyses,
  submissionMetrics,
} from "@/lib/submission-metrics";
import { checkState } from "@/lib/submission-rows";
import type { CheckState } from "@/lib/submission-rows";

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

export const stamp = (value: string | null) =>
  value ? timeFormat.format(new Date(value)) : null;

const analysisNote = (
  check: CheckState,
  analysis: {
    error: string | null;
    finished: string | null;
    kept: boolean;
    model: string | null;
    rubricVersion: string | null;
    started: string | null;
  }
) => {
  const kept = analysis.kept
    ? " The results below are from the last check that finished."
    : "";
  switch (check) {
    case "pending": {
      return "It starts when a student submits. Run it now if it hasn't started.";
    }
    case "running": {
      return `Started ${analysis.started}.${kept}`;
    }
    case "failed": {
      return `${analysis.error ?? "The check failed."}${kept}`;
    }
    case "unavailable": {
      return "The check finished but saved no results for this submission.";
    }
    default: {
      return `Finished ${analysis.finished}. A step with no flag isn’t necessarily a good critique.`;
    }
  }
};

export const submissionDetail = (project: SubmissionProject) => {
  const metrics = submissionMetrics(project);
  const final = project.final_versions.find(
    ({ id }) => id === metrics.finalVersionId
  );
  const iterations = new Map(project.iterations.map((item) => [item.id, item]));
  const results = currentAnalyses(
    project.analysis_results,
    metrics.finalVersionId
  );
  const flagged = Map.groupBy(results, ({ iteration_id: id }) => id);
  const notes = new Map(
    project.grader_notes.map(({ body, iteration_id: id }) => [id, body])
  );
  const steps = metrics.steps.flatMap((metric) => {
    const iteration = iterations.get(metric.id);
    if (!iteration) {
      return [];
    }
    const createdAt = new Date(iteration.created_at);
    const critique = iteration.critique ?? "";
    const [result] = flagged.get(metric.id) ?? [];
    const flags = (result?.flags ?? []).map(flagView);
    const open = flags.filter(({ state }) => state === "open");
    return [
      {
        answer: iteration.raw_answer,
        answered: critiqueCoverage(readCritique(iteration.critique)),
        asked: iteration.prompt,
        carried: metric.retainedWords,
        check: result ? checkResult(result) : null,
        createdAt: iteration.created_at,
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
        note: notes.get(metric.id) ?? "",
        time: timeFormat.format(createdAt),
        title: stepTitle(iteration),
        words: metric.answerWords,
      },
    ];
  });
  const { email, profile } = project.student;
  const check = checkState({
    analysisStatus: project.analysis_status,
    metrics,
  });
  const analysis = {
    error: project.analysis_error,
    finished: stamp(project.analysis_finished_at),
    kept: metrics.flags !== null && project.analysis_status !== "completed",
    model: results[0]?.model ?? null,
    rubricVersion: results[0]?.rubric_version ?? null,
    started: stamp(project.analysis_started_at),
  };
  return {
    analysis: { ...analysis, note: analysisNote(check, analysis) },
    assignment: project.assignment,
    check,
    critiqueAverage: critiqueAverage(metrics),
    days: new Set(steps.map(({ day }) => day)).size,
    email,
    essay: essayParagraphs(
      final?.extracted_text ?? "",
      metrics.spans,
      new Map(steps.map(({ id }, index) => [id, index]))
    ),
    feedbackFlags: metrics.flags?.addedToFeedback ?? 0,
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
