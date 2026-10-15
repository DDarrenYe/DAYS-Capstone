import { Suspense } from "react";

import { Flags } from "@/app/instructor/flags/flags";
import { PageBar } from "@/components/shell/page-bar";

const FlagsPage = () => (
  <>
    <PageBar crumbs={[{ label: "Flags" }]} />
    <div className="flex flex-1 flex-col overflow-y-auto">
      <Suspense
        fallback={
          <>
            <output className="sr-only">Loading flags…</output>
            <div
              aria-hidden="true"
              className="flex flex-col gap-3.5 px-6 pt-5 pb-6 max-md:px-4"
            >
              <div className="bg-muted shadow-hairline h-14 w-72 animate-pulse rounded-xl motion-reduce:animate-none" />
              <div className="bg-muted shadow-hairline h-40 animate-pulse rounded-xl motion-reduce:animate-none" />
              <div className="bg-muted shadow-hairline h-40 animate-pulse rounded-xl motion-reduce:animate-none" />
            </div>
          </>
        }
      >
        <Flags />
      </Suspense>
    </div>
  </>
);

export default FlagsPage;
