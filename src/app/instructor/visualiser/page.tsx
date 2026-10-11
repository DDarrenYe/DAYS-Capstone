import { Suspense } from "react";

import { Visualiser } from "@/app/instructor/visualiser/visualiser";

const VisualiserPage = () => (
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
    <Visualiser />
  </Suspense>
);

export default VisualiserPage;
