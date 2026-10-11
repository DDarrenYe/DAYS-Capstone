import { cacheLife } from "next/cache";
import { Suspense } from "react";

import {
  AssignmentList,
  AssignmentsSkeleton,
} from "@/app/student/assignment-list";
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
    <h1 className="text-display rise-in mt-4.5 font-bold">Assignments</h1>
    <p className="text-body text-subtitle rise-in mt-3 [--i:1]">
      Your tasks this semester. Lane 2 ones keep an AI log.
    </p>
    <Suspense fallback={<AssignmentsSkeleton />}>
      <Assignments />
    </Suspense>
  </>
);

export default StudentPage;
