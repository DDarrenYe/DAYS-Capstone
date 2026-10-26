import Link from "next/link";
import { Suspense } from "react";

import { OverviewSkeleton } from "@/app/instructor/cohort-overview";
import { Submissions } from "@/app/instructor/submissions";
import { Icon } from "@/components/icon";
import { PageBar } from "@/components/shell/page-bar";
import { buttonVariants } from "@/components/ui/button";

const InstructorPage = () => (
  <>
    <PageBar crumbs={[{ label: "Overview" }]}>
      <Link
        className={buttonVariants({ variant: "outline" })}
        href="/instructor/reports"
      >
        <Icon name="export" />
        Export
      </Link>
    </PageBar>
    <div className="flex-1 overflow-y-auto">
      <Suspense fallback={<OverviewSkeleton />}>
        <Submissions />
      </Suspense>
    </div>
  </>
);

export default InstructorPage;
