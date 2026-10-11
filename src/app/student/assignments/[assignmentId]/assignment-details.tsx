"use client";

import { FileText } from "lucide-react";
import { notFound } from "next/navigation";

import { DueLine, LaneBadge } from "@/app/student/assignment-parts";
import { describeAssignment, stepLabel } from "@/app/student/assignment-state";
import { useAssignments } from "@/app/student/use-assignments";
import type { InitialAssignments } from "@/app/student/use-assignments";
import { Note } from "@/components/shell/note";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const AssignmentDetails = ({
  assignmentId,
  ...initial
}: InitialAssignments & { assignmentId: string }) => {
  const { assignments, now } = useAssignments(initial);
  const assignment = assignments.find(({ id }) => id === assignmentId);
  if (!assignment) {
    notFound();
  }
  const state = describeAssignment(assignment, now);
  return (
    <>
      <h1 className="text-display rise-in mt-4.5 font-bold">
        {assignment.title}
      </h1>
      <div className="rise-in mt-10 max-w-190 [--i:1]">
        <Card variant="paper">
          <CardHeader>
            <FileText aria-hidden="true" size={22} /> {assignment.course.code}
          </CardHeader>
          <CardContent>
            <LaneBadge aiAllowed={state.aiAllowed} />
            <DueLine dueAt={assignment.due_at} state={state} />
            <p className="text-body">{assignment.brief}</p>
            {state.aiAllowed ? (
              <p className="font-semibold">{stepLabel(state.steps)} logged</p>
            ) : (
              <p className="font-semibold">
                AI is restricted for this assignment, so there is no AI log to
                keep.
              </p>
            )}
            {state.aiAllowed && !state.submitted ? (
              <Note className="my-4 max-w-100" tone="yellow">
                Adding steps is not connected to this page yet.
              </Note>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
