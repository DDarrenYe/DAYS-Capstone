import type { AssignmentRows } from "@/lib/data/queries";

type Assignment = AssignmentRows[number];

export const stepLabel = (steps: number) =>
  `${steps} ${steps === 1 ? "step" : "steps"}`;

export const describeAssignment = (assignment: Assignment, now: number) => {
  const [project] = assignment.projects;
  const aiAllowed = assignment.lane === "lane_2";
  const submitted = project?.status === "submitted";
  const past = assignment.due_at
    ? new Date(assignment.due_at).getTime() < now
    : false;
  return {
    aiAllowed,
    hasProject: project !== undefined,
    overdue: aiAllowed && !submitted && past,
    past,
    steps: project?.iterations[0]?.count ?? 0,
    submitted,
  };
};

export type AssignmentState = ReturnType<typeof describeAssignment>;

export const noteFor = ({
  aiAllowed,
  overdue,
  steps,
  submitted,
}: AssignmentState) => {
  if (submitted) {
    return { text: "Submitted. Nice work.", tone: "mint" } as const;
  }
  if (overdue) {
    return {
      text: "Overdue. Finish your log and submit.",
      tone: "pink",
    } as const;
  }
  if (aiAllowed) {
    return {
      text: `${stepLabel(steps)} so far. Keep logging!`,
      tone: "yellow",
    } as const;
  }
  return { text: "Lane 1: no AI here", tone: "sky" } as const;
};
