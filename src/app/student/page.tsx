import { cacheLife } from "next/cache";
import { Suspense } from "react";

import {
  AssignmentList,
  AssignmentsSkeleton,
} from "@/app/student/assignment-list";
import { Walkthrough } from "@/app/student/walkthrough/walkthrough";
import { PageBar } from "@/components/shell/page-bar";
import { requireRole } from "@/lib/auth";
import { assignmentsQuery } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";

const getAssignments = async (userId: string) => {
  "use cache: private";
  cacheLife({ stale: 300 });
  const assignments = await assignmentsQuery(
    await createClient(),
    userId
  ).queryFn();
  return { assignments, fetchedAt: Date.now() };
};

const Assignments = async () => {
  const { id } = await requireRole("student");
  const { assignments, fetchedAt } = await getAssignments(id);
  return (
    <AssignmentList
      fetchedAt={fetchedAt}
      initialAssignments={assignments}
      userId={id}
    />
  );
};

const StudentPage = () => (
  <>
    <PageBar crumbs={[{ label: "Assignments" }]}>
      <Walkthrough size="sm" variant="outline">
        How it works
      </Walkthrough>
    </PageBar>
    <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6 max-md:px-4">
      <h1 className="text-title font-semibold">Assignments</h1>
      <p className="text-muted-foreground mt-1.5">
        Your tasks this semester. Lane 2 tasks keep an AI log; Lane 1 tasks
        restrict AI.
      </p>
      <Suspense fallback={<AssignmentsSkeleton />}>
        <Assignments />
      </Suspense>
    </div>
  </>
);

export default StudentPage;
