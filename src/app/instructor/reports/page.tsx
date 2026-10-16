import { Suspense } from "react";

import { SubmissionExport } from "@/app/instructor/reports/submission-export";

const ReportsPage = ({ searchParams }: PageProps<"/instructor/reports">) => (
  <Suspense
    fallback={
      <div className="flex flex-col gap-3.5 p-6">
        <output className="sr-only">Loading the report builder…</output>
        <div
          aria-hidden="true"
          className="bg-muted h-24 animate-pulse rounded-xl motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="bg-muted h-64 animate-pulse rounded-xl motion-reduce:animate-none"
        />
      </div>
    }
  >
    <SubmissionExport searchParams={searchParams} />
  </Suspense>
);

export default ReportsPage;
