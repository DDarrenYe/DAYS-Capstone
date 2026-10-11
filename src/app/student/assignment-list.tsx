"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { assignmentsQuery } from "@/lib/data/queries";
import type { AssignmentRows } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/browser";

const dueDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  weekday: "short",
});

const gridClassName =
  "mt-5 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5";

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
      <p className="text-muted-foreground mt-8">
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
          <Card key={assignment.id}>
            <CardContent className="flex flex-1 flex-col">
              <div className="flex flex-1 flex-col gap-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-faint text-label font-mono">
                    {assignment.course.code}
                  </span>
                  <Badge
                    className="ml-auto"
                    variant={aiAllowed ? "ai" : "default"}
                  >
                    {aiAllowed
                      ? "Lane 2 · AI allowed"
                      : "Lane 1 · AI restricted"}
                  </Badge>
                </div>
                <div>
                  <h2 className="tracking-snug text-base font-semibold">
                    {assignment.title}
                  </h2>
                  {assignment.due_at ? (
                    <time
                      className="text-muted-foreground text-meta mt-0.5 block"
                      dateTime={assignment.due_at}
                      suppressHydrationWarning
                    >
                      Due {dueDate.format(new Date(assignment.due_at))}
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
                      {stepLabel(steps)} logged
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    No AI log needed
                  </p>
                )}
                <div className="mt-auto flex h-11 items-end gap-2 border-t">
                  {submitted ? (
                    <Badge variant="success">
                      <Icon name="check" />
                      Submitted
                    </Badge>
                  ) : (
                    <Link
                      className={buttonVariants({
                        variant: aiAllowed ? "default" : "outline",
                      })}
                      href="/student/log"
                    >
                      {aiAllowed ? "Add steps" : "Open"}
                      <Icon name="right" />
                    </Link>
                  )}
                  {aiAllowed && steps > 0 ? (
                    <Link
                      className="text-muted-foreground hover:text-foreground text-meta ml-auto"
                      href="/student/progress"
                    >
                      See progress
                    </Link>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
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
          className="bg-muted shadow-hairline h-62 animate-pulse rounded-xl motion-reduce:animate-none"
          key={position}
        />
      ))}
    </div>
  </>
);
