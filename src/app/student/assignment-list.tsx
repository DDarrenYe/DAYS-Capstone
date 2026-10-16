"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { AssignmentCard } from "@/app/student/assignment-card";
import { GetStarted } from "@/app/student/walkthrough/get-started";
import { assignmentsQuery } from "@/lib/data/queries";
import type { AssignmentRows } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/browser";

const gridClassName =
  "mt-5 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5";

export const AssignmentList = ({
  userId,
  initialAssignments,
  fetchedAt,
}: {
  userId: string;
  initialAssignments: AssignmentRows;
  fetchedAt: number;
}) => {
  const { data: assignments, dataUpdatedAt } = useSuspenseQuery({
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
  const newToLogging =
    assignments.some(({ lane }) => lane === "lane_2") &&
    assignments.every(
      ({ projects }) => (projects[0]?.iterations[0]?.count ?? 0) === 0
    );
  return (
    <>
      {newToLogging ? <GetStarted /> : null}
      <section aria-label="Your assignments" className={gridClassName}>
        {assignments.map((assignment) => (
          <AssignmentCard
            assignment={assignment}
            key={assignment.id}
            now={dataUpdatedAt}
            userId={userId}
          />
        ))}
      </section>
    </>
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
