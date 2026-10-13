import { Suspense } from "react";

import { LogSkeleton } from "@/app/student/log/log-skeleton";
import { StepComposer } from "@/app/student/log/step-composer";
import { requireRole } from "@/lib/auth";

const Composer = async () => {
  const { id } = await requireRole("student");
  return <StepComposer userId={id} />;
};

const LogPage = () => (
  <Suspense fallback={<LogSkeleton />}>
    <Composer />
  </Suspense>
);

export default LogPage;
