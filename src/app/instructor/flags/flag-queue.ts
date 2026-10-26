import { stepTitle } from "@/app/student/log/step-meta";
import type { FlagQueueRows } from "@/lib/data/queries";
import { checkResult, flagView } from "@/lib/flag-review";
import type { CheckResultView, FlagState, FlagView } from "@/lib/flag-review";
import { currentAnalyses } from "@/lib/submission-metrics";

export interface QueueFlag {
  check: CheckResultView;
  critique: string;
  flag: FlagView;
  project: {
    assignment: string;
    course: string;
    id: string;
    name: string;
  };
  step: { number: number; position: number; title: string };
}

export interface FlagQueue {
  counts: Record<FlagState, number> & { openStudents: number };
  flags: QueueFlag[];
  submissions: number;
  withoutResults: number;
}

const ORDER: Record<FlagState, number> = {
  open: 0,
  added_to_feedback: 1,
  dismissed: 2,
};

/*
  Every flag in the newest saved result set of each submission the signed-in instructor can read, which
  row-level security limits to their own courses. Flags from an earlier set stay with that set.
*/
export const flagQueue = (rows: FlagQueueRows): FlagQueue => {
  const checked = rows.map((project) => ({
    project,
    results: currentAnalyses(
      project.analysis_results,
      project.final_versions[0]?.id
    ),
  }));
  const flags = checked.flatMap(({ project, results }) => {
    const steps = project.iterations.toSorted(
      (first, second) => first.step_number - second.step_number
    );
    const { email, profile } = project.student;
    return results.flatMap((result) => {
      const position = steps.findIndex(({ id }) => id === result.iteration_id);
      const step = steps[position];
      if (!step) {
        return [];
      }
      const check = checkResult(result);
      return result.flags.map((flag): QueueFlag => ({
        check,
        critique: step.critique ?? "",
        flag: flagView(flag),
        project: {
          assignment: project.assignment.title,
          course: project.assignment.course.code,
          id: project.id,
          name: profile?.display_name ?? email,
        },
        step: {
          number: step.step_number,
          position: position + 1,
          title: stepTitle(step),
        },
      }));
    });
  });
  const count = (state: FlagState) =>
    flags.filter(({ flag }) => flag.state === state).length;
  return {
    counts: {
      added_to_feedback: count("added_to_feedback"),
      dismissed: count("dismissed"),
      open: count("open"),
      openStudents: new Set(
        flags
          .filter(({ flag }) => flag.state === "open")
          .map(({ project }) => project.id)
      ).size,
    },
    flags: flags.toSorted(
      (first, second) => ORDER[first.flag.state] - ORDER[second.flag.state]
    ),
    submissions: rows.length,
    withoutResults: checked.filter(({ results }) => results.length === 0)
      .length,
  };
};

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

/* Why a queue with nothing to review is empty. A check that hasn't finished is never reported as a check with no flags. */
export const queueEmpty = ({
  flags,
  submissions,
  withoutResults,
}: FlagQueue) => {
  if (submissions === 0) {
    return {
      body: "Flags appear here once a student in one of your courses submits their log and the reflection check has run.",
      title: "No submissions yet",
    };
  }
  if (flags.length > 0) {
    return null;
  }
  if (withoutResults === submissions) {
    return {
      body: `${plural(submissions, "submission has", "submissions have")} no saved check result: the check is pending, running or failed. Open it under Submissions to see its state or run it again.`,
      title: "No check has finished yet",
    };
  }
  return {
    body:
      withoutResults === 0
        ? "Every submitted log was checked and none was flagged."
        : `Every finished check came back without a flag. ${plural(withoutResults, "submission has", "submissions have")} no saved check result yet.`,
    title: "Nothing was flagged",
  };
};
