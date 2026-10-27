import { Suspense } from "react";

import { OverviewSkeleton } from "@/app/instructor/cohort-overview";
import { Submissions } from "@/app/instructor/submissions";

const InstructorPage = () => (
  <Suspense fallback={<OverviewSkeleton />}>
    <Submissions />
  </Suspense>
);

export default InstructorPage;
