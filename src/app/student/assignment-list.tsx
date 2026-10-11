"use client";

import { FileText } from "lucide-react";
import Link from "next/link";

import { DueLine, LaneBadge } from "@/app/student/assignment-parts";
import {
  describeAssignment,
  noteFor,
  stepLabel,
} from "@/app/student/assignment-state";
import type { AssignmentState } from "@/app/student/assignment-state";
import { LaneTwoActions } from "@/app/student/lane-two-actions";
import { useAssignments } from "@/app/student/use-assignments";
import type { InitialAssignments } from "@/app/student/use-assignments";
import { Note } from "@/components/shell/note";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const gridClassName =
  "mt-12 grid grid-cols-3 gap-10 max-[1100px]:gap-6 max-[760px]:grid-cols-1 max-[760px]:gap-12 min-[1100px]:mt-17.5";

const Actions = ({
  assignmentId,
  state,
  userId,
}: {
  assignmentId: string;
  state: AssignmentState;
  userId: string;
}) => {
  if (state.submitted) {
    return <Badge variant="success">Submitted</Badge>;
  }
  if (!state.aiAllowed) {
    return (
      <Link
        className={buttonVariants({ size: "sm", variant: "outline" })}
        href={`/student/assignments/${assignmentId}`}
      >
        Open
      </Link>
    );
  }
  return (
    <LaneTwoActions
      assignmentId={assignmentId}
      hasProject={state.hasProject}
      userId={userId}
    />
  );
};

export const AssignmentList = (props: InitialAssignments) => {
  const { assignments, now } = useAssignments(props);
  if (assignments.length === 0) {
    return (
      <p className="text-body text-subtitle mt-12">
        No assignments yet. They appear here once your instructor adds you to a
        course.
      </p>
    );
  }
  const cards = assignments
    .map((assignment) => ({
      assignment,
      state: describeAssignment(assignment, now),
    }))
    .toSorted((a, b) => Number(a.state.submitted) - Number(b.state.submitted));
  return (
    <section aria-label="Your assignments" className={gridClassName}>
      {cards.map(({ assignment, state }) => {
        const { aiAllowed, steps } = state;
        const note = noteFor(state);
        return (
          <article
            className="rise-in relative flex min-w-0 flex-col gap-6 [--i:2] [--paper-rotation:-1.4deg] nth-2:[--i:3] nth-2:[--paper-rotation:1.2deg] nth-3:[--i:4] nth-3:[--paper-rotation:-0.8deg]"
            key={assignment.id}
          >
            <Card
              variant="paper"
              className="min-h-140 flex-1 rotate-(--paper-rotation) max-[760px]:min-h-105"
            >
              <CardHeader>
                <FileText aria-hidden="true" size={22} />{" "}
                {assignment.course.code}
              </CardHeader>
              <CardContent>
                <LaneBadge aiAllowed={aiAllowed} />
                <h2 className="text-ink text-panel mt-2.5 font-bold">
                  {assignment.title}
                </h2>
                <DueLine dueAt={assignment.due_at} state={state} />
                <ul
                  aria-label={`${stepLabel(steps)} logged`}
                  className="flex min-h-2.5 flex-wrap gap-2"
                >
                  {Array.from({ length: steps }, (_, stepIndex) => (
                    <li
                      className={cn(
                        "h-2.5 w-6.5 rounded-full",
                        stepIndex % 2 === 0 ? "bg-human" : "bg-ai"
                      )}
                      key={`${assignment.id}-${stepIndex}`}
                    />
                  ))}
                </ul>
                <p className="font-semibold">
                  {aiAllowed
                    ? `${stepLabel(steps)} logged`
                    : "No AI log needed"}
                </p>
                <p className="text-body">{assignment.brief}</p>
                <div className="mt-auto">
                  <Actions
                    assignmentId={assignment.id}
                    state={state}
                    userId={props.userId}
                  />
                </div>
              </CardContent>
            </Card>
            <Note placement="assignment" tone={note.tone}>
              {note.text}
            </Note>
          </article>
        );
      })}
    </section>
  );
};

export const AssignmentsSkeleton = () => (
  <>
    <output className="sr-only">Loading assignments…</output>
    <div aria-hidden="true" className={gridClassName}>
      {["first", "second", "third"].map((position) => (
        <div
          className="bg-card/70 shadow-hairline min-h-140 animate-pulse rounded-2xl motion-reduce:animate-none max-[760px]:min-h-105"
          key={position}
        />
      ))}
    </div>
  </>
);
