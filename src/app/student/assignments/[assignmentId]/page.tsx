import { Suspense } from "react";

import { getAssignments } from "@/app/student/assignments";
import { requireRole } from "@/lib/auth";

import { AssignmentDetails } from "./assignment-details";

const Details = async ({
  params,
}: Pick<PageProps<"/student/assignments/[assignmentId]">, "params">) => {
  const [{ id }, { assignmentId }] = await Promise.all([
    requireRole("student"),
    params,
  ]);
  const { assignments, fetchedAt } = await getAssignments(id);
  return (
    <AssignmentDetails
      assignmentId={assignmentId}
      fetchedAt={fetchedAt}
      initialAssignments={assignments}
      userId={id}
    />
  );
};

const AssignmentPage = ({
  params,
}: PageProps<"/student/assignments/[assignmentId]">) => (
  <Suspense
    fallback={<output className="text-muted-foreground">Loading…</output>}
  >
    <Details params={params} />
  </Suspense>
);

export default AssignmentPage;
