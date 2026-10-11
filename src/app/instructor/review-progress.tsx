"use client";

import type { CohortStudent } from "@/lib/example-data";
import { useReviewed } from "@/lib/review-state";

/* Reviewed counts students marked in this browser as well as the example data; flagged means flagged and still waiting. */
export const ReviewProgress = ({
  students,
}: {
  students: readonly CohortStudent[];
}) => {
  const { reviewed: marked } = useReviewed();
  const isReviewed = (student: CohortStudent) =>
    student.status === "done" || Boolean(marked[student.id]);
  const reviewed = students.filter(isReviewed).length;
  const flagged = students.filter(
    (student) => student.flags > 0 && !isReviewed(student)
  ).length;
  const left = students.length - reviewed - flagged;
  return (
    <>
      <div className="text-muted-foreground text-meta mb-1.75 flex justify-between">
        <span>Review progress</span>
        <span>
          <b className="text-foreground font-heading tabular-nums">
            {reviewed}
          </b>{" "}
          of {students.length}
        </span>
      </div>
      <p className="sr-only">
        {reviewed} reviewed, {flagged} flagged, {left} more to review.
      </p>
      <div
        aria-hidden="true"
        className="bg-muted flex h-1.5 gap-0.5 overflow-hidden rounded-xs"
      >
        <i
          className="bg-success block w-(--share)"
          style={{ "--share": `${(reviewed / students.length) * 100}%` }}
        />
        <i
          className="bg-flag block w-(--share)"
          style={{ "--share": `${(flagged / students.length) * 100}%` }}
        />
      </div>
      <div className="text-muted-foreground mt-1.75 flex justify-between text-xs">
        <span className="flex items-center gap-1.5">
          <i className="bg-success block size-1.75 rounded-full" />
          Reviewed
        </span>
        <span className="flex items-center gap-1.5">
          <i className="bg-flag block size-1.75 rounded-full" />
          Flagged
        </span>
        <span>{left} to go</span>
      </div>
    </>
  );
};
