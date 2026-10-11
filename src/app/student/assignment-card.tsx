"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AssignmentRows } from "@/lib/data/queries";
import { useOpenProject } from "@/lib/data/use-mutations";

const dueDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  weekday: "short",
});

const stepLabel = (steps: number) =>
  `${steps} ${steps === 1 ? "step" : "steps"}`;

const LOG_HREF = "/student/log";

type Assignment = AssignmentRows[number];

const LogAction = ({
  hasProject,
  isPending,
  open,
  variant,
  children,
}: {
  hasProject: boolean;
  isPending: boolean;
  open: () => void;
  variant: "default" | "outline";
  children: ReactNode;
}) =>
  hasProject ? (
    <Link className={buttonVariants({ variant })} href={LOG_HREF}>
      {children}
    </Link>
  ) : (
    <Button disabled={isPending} onClick={open} variant={variant}>
      {children}
    </Button>
  );

const Lane1Details = ({ assignment }: { assignment: Assignment }) => (
  <Dialog>
    <DialogTrigger render={<Button variant="outline" />}>
      Details
      <Icon name="right" />
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{assignment.title}</DialogTitle>
        <DialogDescription>
          {assignment.course.code} · Lane 1 · AI restricted
        </DialogDescription>
      </DialogHeader>
      <p className="text-body text-pretty whitespace-pre-line">
        {assignment.brief}
      </p>
      <p className="text-muted-foreground text-xs">
        AI is restricted for this assignment, so there is no AI log to keep.
      </p>
    </DialogContent>
  </Dialog>
);

export const AssignmentCard = ({
  assignment,
  now,
  userId,
}: {
  assignment: Assignment;
  now: number;
  userId: string;
}) => {
  const router = useRouter();
  const { mutate, isPending, error } = useOpenProject(userId);
  const [project] = assignment.projects;
  const steps = project?.iterations[0]?.count ?? 0;
  const submitted = project?.status === "submitted";
  const aiAllowed = assignment.lane === "lane_2";
  const overdue =
    aiAllowed &&
    !submitted &&
    assignment.due_at !== null &&
    Date.parse(assignment.due_at) < now;
  const logAction = {
    hasProject: project !== undefined,
    isPending,
    open: () =>
      mutate(
        { assignmentId: assignment.id },
        { onSuccess: () => router.push(LOG_HREF) }
      ),
  };
  return (
    <Card>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-3.5">
          <div className="flex items-center gap-2">
            <span className="text-faint text-label font-mono">
              {assignment.course.code}
            </span>
            <Badge className="ml-auto" variant={aiAllowed ? "ai" : "default"}>
              {aiAllowed ? "Lane 2 · AI allowed" : "Lane 1 · AI restricted"}
            </Badge>
          </div>
          <div>
            <h2 className="tracking-snug text-base font-semibold">
              {assignment.title}
            </h2>
            {assignment.due_at ? (
              <time
                className={
                  overdue
                    ? "text-flag-ink text-meta font-emphasis mt-0.5 block"
                    : "text-muted-foreground text-meta mt-0.5 block"
                }
                dateTime={assignment.due_at}
                suppressHydrationWarning
              >
                {overdue ? "Overdue · due " : "Due "}
                {dueDate.format(new Date(assignment.due_at))}
              </time>
            ) : null}
          </div>
          <p className="text-body line-clamp-3 text-pretty">
            {assignment.brief}
          </p>
          {aiAllowed ? (
            <div>
              <ul
                aria-label={`${stepLabel(steps)} logged`}
                className="flex min-h-1.5 flex-wrap gap-1"
              >
                {Array.from({ length: steps }, (_, step) => (
                  <li
                    className="bg-primary h-1.5 w-4 rounded-full"
                    key={`${assignment.id}-${step + 1}`}
                  />
                ))}
              </ul>
              <p className="text-muted-foreground mt-1.5 text-xs">
                {project?.status === "draft" ? "Draft · " : null}
                {stepLabel(steps)} logged
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              AI is restricted here. There is no AI log to keep.
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-3.5">
            {aiAllowed ? (
              <>
                {submitted ? (
                  <Badge size="control" variant="success">
                    <Icon name="check" />
                    Submitted
                  </Badge>
                ) : (
                  <LogAction {...logAction} variant="default">
                    Add steps
                    <Icon name="right" />
                  </LogAction>
                )}
                <LogAction {...logAction} variant="outline">
                  My log
                </LogAction>
                {steps > 0 ? (
                  <Link
                    className="text-muted-foreground hover:text-foreground text-meta ml-auto"
                    href="/student/progress"
                  >
                    See progress
                  </Link>
                ) : null}
              </>
            ) : (
              <Lane1Details assignment={assignment} />
            )}
          </div>
          {error ? (
            <p className="text-flag-ink text-xs" role="alert">
              {error.message}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
