import { Suspense } from "react";

import { Submission } from "@/app/instructor/visualiser/submission";

export const maxDuration = 300;

const VisualiserPage = ({
  searchParams,
}: PageProps<"/instructor/visualiser">) => (
  <Suspense
    fallback={
      <div className="flex flex-col gap-3.5 p-6">
        <output className="sr-only">Loading the Visualiser…</output>
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
    <Submission searchParams={searchParams} />
  </Suspense>
);

export default VisualiserPage;
