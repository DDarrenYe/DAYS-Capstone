import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/icon";
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
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center max-md:px-4">
      <span className="bg-muted shadow-hairline text-body grid size-11 place-items-center rounded-xl">
        <Icon className="size-5" name="essay" />
      </span>
      <h1 className="text-title mt-4 font-semibold">No submission to show</h1>
      <p className="text-body mt-1.5 max-w-100 text-pretty">{children}</p>
      <Link
        className={buttonVariants({ className: "mt-5", variant: "outline" })}
        href="/instructor"
      >
        <Icon name="left" />
        Back to submissions
      </Link>
    </div>
  </>
);
