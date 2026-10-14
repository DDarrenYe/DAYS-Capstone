import Link from "next/link";
import { Suspense } from "react";

import { CohortPlot } from "@/app/instructor/cohort-plot";
import { ReviewProgress } from "@/app/instructor/review-progress";
import { Submissions } from "@/app/instructor/submissions";
import { Icon } from "@/components/icon";
import { PageBar } from "@/components/shell/page-bar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  assignmentName,
  cohort,
  cohortFlags,
  cohortSize,
  essayTitle,
} from "@/lib/example-data";
import { formatPercent } from "@/lib/process";

const median = (values: number[]) => {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? (sorted[middle] ?? 0)
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
};

const medianTraced = median(cohort.map((student) => student.traced));
const reasons = Object.entries(
  Object.groupBy(cohortFlags, (flag) => flag.title)
)
  .map(([title, flags = []]) => ({ count: flags.length, title }))
  .toSorted((a, b) => b.count - a.count);
const mostReasons = Math.max(...reasons.map((reason) => reason.count));

const InstructorPage = () => (
  <>
    <PageBar
      crumbs={[
        { href: "/instructor", label: assignmentName },
        { label: "Submissions" },
      ]}
      example
    >
      <Link
        className={buttonVariants({ variant: "outline" })}
        href="/instructor/reports"
      >
        <Icon name="export" />
        Export
      </Link>
      <Link className={buttonVariants()} href="/instructor/visualiser">
        Review next
        <Icon name="right" />
      </Link>
    </PageBar>

    <div className="flex-1 overflow-y-auto">
      <section className="flex flex-wrap items-end gap-6 px-6 pt-5 max-md:px-4">
        <div>
          <h1 className="text-title font-semibold">{essayTitle}</h1>
          <p className="text-muted-foreground mt-1.75 flex flex-wrap items-center gap-2.5">
            <Badge variant="ai">Lane 2 · AI permitted</Badge>
            <span>Due Fri 10 Oct, 23:59</span>·
            <span>
              {cohort.length} of {cohortSize} submitted
            </span>
            ·
            <span>
              Median {median(cohort.map((student) => student.steps.length))}{" "}
              steps
            </span>
          </p>
        </div>
        <div className="ml-auto w-60 max-md:ml-0">
          <ReviewProgress students={cohort} />
        </div>
      </section>

      <div className="grid gap-3.5 px-6 pt-4.5 max-md:px-4 lg:grid-cols-[minmax(0,1fr)_372px]">
        <Card>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-4 pt-3.5">
            <h2 className="text-ui font-heading">Where each submission sits</h2>
            <span className="text-muted-foreground text-meta">
              Each dot is a student
            </span>
            <ul className="text-muted-foreground ml-auto flex gap-3.5 text-xs">
              <li className="flex items-center gap-1.5">
                <i className="bg-human block size-2 rounded-full" />
                Submitted
              </li>
              <li className="flex items-center gap-1.5">
                <i className="bg-flag block size-2 rounded-full" />
                Flagged
              </li>
              <li className="flex items-center gap-1.5">
                <i className="ring-ai block size-2 rounded-full ring-2" />
                Open in Visualiser
              </li>
            </ul>
          </div>
          <div className="px-4 pb-2">
            <CohortPlot median={medianTraced} students={cohort} />
          </div>
        </Card>

        <Card>
          <CardContent>
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <h2 className="text-ui font-heading">Look closer</h2>
              <span className="text-muted-foreground text-meta">
                Suggested by the reflection check
              </span>
            </div>
            <ul className="mt-2">
              {reasons.map((reason) => (
                <li
                  className="flex h-9.5 items-center gap-2.5 border-t first:border-t-0"
                  key={reason.title}
                >
                  <Icon className="text-flag" name="flag" />
                  <Link className="hover:underline" href="/instructor/flags">
                    {reason.title}
                  </Link>
                  <span className="font-heading ml-auto tabular-nums">
                    {reason.count}
                  </span>
                  <span className="bg-muted h-1 w-16 overflow-hidden rounded-full">
                    <i
                      className="bg-flag block h-full w-(--share) rounded-full"
                      style={{
                        "--share": `${(reason.count / mostReasons) * 100}%`,
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-meta mt-3 mb-3 text-pretty">
              Flags only ask you to look closer. They never change a grade, and
              you can dismiss any of them.
            </p>
            <dl className="grid grid-cols-3 border-t pt-3">
              {[
                [
                  "Errors caught",
                  (
                    cohort.reduce(
                      (total, student) => total + student.caught,
                      0
                    ) / cohort.length
                  ).toFixed(1),
                ],
                [
                  "Critique depth",
                  median(cohort.map((student) => student.depth)).toFixed(1),
                ],
                ["Traced to AI", formatPercent(medianTraced)],
              ].map(([label, value]) => (
                <div
                  className="border-l pl-3.5 first:border-l-0 first:pl-0"
                  key={label}
                >
                  <dt className="text-label text-muted-foreground font-emphasis">
                    {label}
                  </dt>
                  <dd className="text-figure font-heading tracking-title mt-0.5 tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Suspense
        fallback={
          <div className="px-6 pt-4 pb-6 max-md:px-4">
            <output className="sr-only">Loading submissions…</output>
            <div
              aria-hidden="true"
              className="bg-muted shadow-hairline h-96 animate-pulse rounded-xl motion-reduce:animate-none"
            />
          </div>
        }
      >
        <Submissions />
      </Suspense>
    </div>
  </>
);

export default InstructorPage;
