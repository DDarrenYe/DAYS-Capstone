import Link from "next/link";
import type { ReactNode } from "react";

import { PageBar } from "@/components/shell/page-bar";
import { buttonVariants } from "@/components/ui/button";

export const NoSubmission = ({ children }: { children: ReactNode }) => (
  <>
    <PageBar
      crumbs={[
        { href: "/instructor", label: "Submissions" },
        { label: "Visualiser" },
      ]}
    />
    <div className="flex flex-1 flex-col items-start gap-3 px-6 pt-8 max-md:px-4">
      <h1 className="text-title font-semibold">No submission to show</h1>
      <p className="text-body max-w-prose text-pretty">{children}</p>
      <Link
        className={buttonVariants({ variant: "outline" })}
        href="/instructor"
      >
        Back to submissions
      </Link>
    </div>
  </>
);
