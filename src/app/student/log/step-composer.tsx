"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";

import { AddStep } from "@/app/student/log/add-step";
import { CritiqueForm } from "@/app/student/log/critique-form";
import { LogSkeleton } from "@/app/student/log/log-skeleton";
import { isSaved, logHref } from "@/app/student/log/step-meta";
import type { LoggedStep } from "@/app/student/log/step-meta";
import { StepRail } from "@/app/student/log/step-rail";
import { StepView } from "@/app/student/log/step-view";
import { PageBar } from "@/components/shell/page-bar";
import { Button } from "@/components/ui/button";
import { assignmentsQuery, projectLogQuery } from "@/lib/data/queries";
import type { AssignmentRows, ProjectLog } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/browser";

type Assignment = AssignmentRows[number];

const LoadError = ({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) => (
  <div className="flex flex-col items-start gap-3 p-6" role="alert">
    <p className="text-flag-ink">{message}</p>
    <Button onClick={retry} variant="outline">
      Try again
    </Button>
  </div>
);

const NoLog = () => (
  <>
    <PageBar
      crumbs={[{ href: "/student", label: "Assignments" }, { label: "My log" }]}
    />
    <div className="px-6 pt-5 max-md:px-4">
      <h1 className="text-title font-semibold">My log</h1>
      <p className="text-muted-foreground mt-1.5">
        You haven’t started an AI log yet. Open a Lane 2 assignment from{" "}
        <Link className="text-ai-ink underline" href="/student">
          Assignments
        </Link>{" "}
        to start one.
      </p>
    </div>
  </>
);

const chooseStep = (
  steps: readonly LoggedStep[],
  requested: string | null,
  locked: boolean
): LoggedStep | "new" | undefined => {
  if (requested === "new" && !locked) {
    return "new";
  }
  const asked = steps.find(
    ({ step_number }) => String(step_number) === requested
  );
  if (asked) {
    return asked;
  }
  const waiting = steps.find((step) => !isSaved(step));
  if (waiting) {
    return waiting;
  }
  return locked ? steps.at(-1) : "new";
};

const nextAfter = (steps: readonly LoggedStep[], done: LoggedStep) => {
  const waiting = steps.filter((step) => !isSaved(step) && step.id !== done.id);
  const later = waiting.find(
    ({ step_number }) => step_number > done.step_number
  );
  return (later ?? waiting[0])?.step_number ?? "new";
};

const Workspace = ({
  assignment,
  log,
  userId,
}: {
  assignment: Assignment;
  log: ProjectLog;
  userId: string;
}) => {
  const [stepParam, setStepParam] = useQueryState("step", parseAsString);
  const steps = log.iterations;
  const locked = log.status !== "draft";
  const view = chooseStep(steps, stepParam, locked);
  const viewing = view === "new" ? view : view?.step_number;
  const label = view === "new" ? "Add steps" : `Step ${viewing ?? 0}`;
  return (
    <>
      <PageBar
        crumbs={[
          { href: "/student", label: assignment.title },
          { href: logHref(assignment.id), label: "My log" },
          { label },
        ]}
      />
      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[252px_minmax(0,1fr)_300px] lg:overflow-hidden">
        <StepRail
          locked={locked}
          onView={(next) => setStepParam(String(next))}
          steps={steps}
          title={assignment.title}
          viewing={viewing}
        />
        {view === "new" ? (
          <AddStep projectId={log.id} steps={steps} userId={userId} />
        ) : null}
        {view && view !== "new" && (locked || isSaved(view)) ? (
          <StepView key={view.id} step={view} steps={steps} />
        ) : null}
        {view && view !== "new" && !locked && !isSaved(view) ? (
          <CritiqueForm
            key={view.id}
            next={nextAfter(steps, view)}
            projectId={log.id}
            step={view}
            steps={steps}
            userId={userId}
          />
        ) : null}
        {view ? null : (
          <p className="text-muted-foreground px-10 py-5.5 max-md:px-4">
            This log was submitted without any steps.
          </p>
        )}
      </div>
    </>
  );
};

const ProjectWorkspace = ({
  assignment,
  projectId,
  userId,
}: {
  assignment: Assignment;
  projectId: string;
  userId: string;
}) => {
  const { data, error, refetch } = useQuery(
    projectLogQuery(createClient(), userId, projectId)
  );
  if (error) {
    return <LoadError message={error.message} retry={refetch} />;
  }
  if (!data) {
    return <LogSkeleton />;
  }
  return <Workspace assignment={assignment} log={data} userId={userId} />;
};

export const StepComposer = ({ userId }: { userId: string }) => {
  const [assignmentId] = useQueryState("assignment", parseAsString);
  const { data, error, refetch } = useQuery(
    assignmentsQuery(createClient(), userId)
  );
  if (error) {
    return <LoadError message={error.message} retry={refetch} />;
  }
  if (!data) {
    return <LogSkeleton />;
  }
  const logs = data.filter(
    ({ lane, projects }) => lane === "lane_2" && projects.length > 0
  );
  const assignment =
    logs.find(({ id }) => id === assignmentId) ??
    logs.find(({ projects }) => projects[0]?.status === "draft") ??
    logs[0];
  const project = assignment?.projects[0];
  if (!(assignment && project)) {
    return <NoLog />;
  }
  return (
    <ProjectWorkspace
      assignment={assignment}
      key={project.id}
      projectId={project.id}
      userId={userId}
    />
  );
};
