"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Clock, FileText } from "lucide-react";
import Link from "next/link";

import { Note } from "@/components/shell/note";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { assignmentsQuery } from "@/lib/data/queries";
import type { AssignmentRows } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/browser";

const dueDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  weekday: "short",
});

const gridClassName =
  "mt-12 grid grid-cols-3 gap-10 max-[1100px]:gap-6 max-[760px]:grid-cols-1 max-[760px]:gap-12 min-[1100px]:mt-17.5";

const stepLabel = (steps: number) =>
  `${steps} ${steps === 1 ? "step" : "steps"}`;

export const AssignmentList = ({
  userId,
  initialAssignments,
  fetchedAt,
}: {
  userId: string;
  initialAssignments: AssignmentRows;
  fetchedAt: number;
}) => {
  const { data: assignments } = useSuspenseQuery({
    ...assignmentsQuery(createClient(), userId),
    initialData: initialAssignments,
    initialDataUpdatedAt: fetchedAt,
  });
  if (assignments.length === 0) {
    return (
      <p className="text-body text-subtitle mt-12">
        No assignments yet. They appear here once your instructor adds you to a
        course.
      </p>
    );
  }
  return (
    <section aria-label="Your assignments" className={gridClassName}>
      {assignments.map((assignment) => {
        const [project] = assignment.projects;
        const steps = project?.iterations[0]?.count ?? 0;
        const submitted = project?.status === "submitted";
        const aiAllowed = assignment.lane === "lane_2";
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
                <Badge variant={aiAllowed ? "ai" : "neutral"}>
                  {aiAllowed ? "Lane 2 · AI allowed" : "Lane 1 · AI restricted"}
                </Badge>
                <h2 className="text-ink text-panel mt-2.5 font-bold">
                  {assignment.title}
                </h2>
                {assignment.due_at ? (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Clock aria-hidden="true" size={18} />
                    <time dateTime={assignment.due_at} suppressHydrationWarning>
                      Due {dueDate.format(new Date(assignment.due_at))}
                    </time>
                  </p>
                ) : null}
                <ul
                  aria-label={`${stepLabel(steps)} logged`}
                  className="flex min-h-2.5 flex-wrap gap-2"
                >
                  {Array.from({ length: steps }, (_, stepIndex) => (
                    <li
                      className="bg-ai h-2.5 w-6.5 rounded-full"
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
                  {submitted ? (
                    <Badge variant="success">Submitted</Badge>
                  ) : (
                    <Link
                      className={buttonVariants({
                        size: "sm",
                        variant: aiAllowed ? "default" : "outline",
                      })}
                      href="/student/log"
                    >
                      {aiAllowed ? "Add steps" : "Open"}
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
            {submitted ? (
              <Note tone="mint" placement="assignment">
                Submitted. Nice work.
              </Note>
            ) : (
              <Note tone={aiAllowed ? "yellow" : "sky"} placement="assignment">
                {aiAllowed
                  ? `${stepLabel(steps)} so far. Keep logging!`
                  : "Lane 1: no AI here"}
              </Note>
            )}
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
