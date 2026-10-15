import Link from "next/link";

import { FlagList } from "@/app/instructor/flags/flag-list";
import { flagQueue, queueEmpty } from "@/app/instructor/flags/flag-queue";
import { Icon } from "@/components/icon";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { flagQueueQuery } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";

/* Read on the server as the signed-in instructor, so row-level security keeps the queue to their own courses. */
export const Flags = async () => {
  const { id } = await requireRole("instructor");
  const queue = flagQueue(
    await flagQueueQuery(await createClient(), id).queryFn()
  );
  const empty = queueEmpty(queue);
  const {
    added_to_feedback: feedback,
    dismissed,
    open,
    openStudents,
  } = queue.counts;

  if (empty) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center max-md:px-4">
        <span className="bg-muted shadow-hairline text-body grid size-11 place-items-center rounded-xl">
          <Icon className="size-5" name="flag" />
        </span>
        <h1 className="text-title mt-4 font-semibold">{empty.title}</h1>
        <p className="text-body mt-1.5 max-w-100 text-pretty">{empty.body}</p>
        <Link
          className={buttonVariants({ className: "mt-5", variant: "outline" })}
          href="/instructor"
        >
          <Icon name="left" />
          Back to submissions
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="px-6 pt-5 max-md:px-4">
        <h1 className="text-title font-semibold">
          {open} open {open === 1 ? "flag" : "flags"} across {openStudents}{" "}
          {openStudents === 1 ? "student" : "students"}
        </h1>
        <p className="text-muted-foreground mt-1.5 max-w-160 text-pretty">
          {feedback} added to feedback and {dismissed} dismissed. The reflection
          check suggests where a critique may be thin. It misses some, and now
          and then flags a critique that is fine, so read each flag next to the
          critique. Add a flag to feedback to keep it in the report, or dismiss
          it. Flags never change a grade.
        </p>
      </section>
      <FlagList queue={queue} />
    </>
  );
};
