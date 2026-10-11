import { Suspense } from "react";

import { StepComposer } from "@/app/student/log/step-composer";

const LogPage = () => (
  <Suspense
    fallback={
      <div className="flex flex-col gap-3.5 p-6">
        <output className="sr-only">Loading your log…</output>
        <div
          aria-hidden="true"
          className="bg-muted h-96 animate-pulse rounded-xl motion-reduce:animate-none"
        />
      </div>
    }
  >
    <StepComposer />
  </Suspense>
);

export default LogPage;
