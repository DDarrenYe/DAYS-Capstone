"use client";

import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";

import { ReviewProgress } from "@/app/instructor/review-progress";
import { SubmissionsTable } from "@/app/instructor/submissions-table";
import { UnmatchedDistribution } from "@/app/instructor/unmatched-distribution";
import { Icon } from "@/components/icon";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
  ToggleGroupThumb,
} from "@/components/ui/toggle-group";
import {
  assignmentsOf,
  cohortSummary,
  flagKindLabel,
} from "@/lib/cohort-summary";
import type { CohortSummary } from "@/lib/cohort-summary";
import type { SubmissionRow } from "@/lib/submission-rows";

const noOpenFlags = ({ counts, submissions }: CohortSummary) => {
  if (counts.unfinished === 0) {
    return "Every submission has been checked and none has an open flag.";
  }
  if (counts.unfinished === submissions) {
    return "No check has finished yet, so nothing has been flagged or cleared.";
  }
  return `No open flags so far. ${counts.unfinished} ${counts.unfinished === 1 ? "submission has" : "submissions have"} no finished check yet.`;
};

const Reasons = ({ summary }: { summary: CohortSummary }) => {
  const most = summary.reasons[0]?.count ?? 1;
  if (summary.reasons.length === 0) {
    return (
      <p className="text-muted-foreground mt-2 text-pretty">
        {noOpenFlags(summary)}
      </p>
    );
  }
  return (
    <ul className="mt-2">
      {summary.reasons.map((reason) => (
        <li
          className="flex h-9.5 items-center gap-2.5 border-t first:border-t-0"
          key={reason.kind}
        >
          <Icon className="text-flag" name="flag" />
          <Link className="hover:underline" href="/instructor/flags">
            {flagKindLabel(reason.kind)}
          </Link>
          <span className="font-heading ml-auto tabular-nums">
            {reason.count}
          </span>
          <span className="bg-muted h-1 w-16 overflow-hidden rounded-full">
            <i
              className="bg-flag block h-full w-(--share) rounded-full"
              style={{ "--share": `${(reason.count / most) * 100}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
};

const Totals = ({ summary }: { summary: CohortSummary }) => (
  <dl className="grid grid-cols-3 border-t pt-3">
    {[
      ["Submissions", summary.submissions.toLocaleString("en")],
      ["Final words", summary.totalWords.toLocaleString("en")],
      [
        "Not from logged AI",
        summary.unmatchedPercent === null
          ? "—"
          : `${summary.unmatchedPercent}%`,
      ],
    ].map(([label, value]) => (
      <div className="border-l pl-3.5 first:border-l-0 first:pl-0" key={label}>
        <dt className="text-label text-muted-foreground font-emphasis">
          {label}
        </dt>
        <dd className="text-figure font-heading tracking-title mt-0.5 tabular-nums">
          {value}
        </dd>
      </div>
    ))}
  </dl>
);

export const CohortOverview = ({ rows }: { rows: SubmissionRow[] }) => {
  const [chosen, setChosen] = useQueryState("assignment", parseAsString);
  const assignments = assignmentsOf(rows);
  const selectedId = assignments.some(({ id }) => id === chosen)
    ? chosen
    : rows[0]?.assignmentId;
  const shown = rows.filter(({ assignmentId }) => assignmentId === selectedId);
  const selected = assignments.find(({ id }) => id === selectedId);
  const summary = cohortSummary(shown);
  const [next] = shown;

  if (!selected) {
    return (
      <section className="px-6 pt-5 max-md:px-4">
        <h1 className="text-title font-semibold">No submissions yet</h1>
        <p className="text-muted-foreground mt-1.5 max-w-160 text-pretty">
          Submissions from your courses appear here once a student submits their
          log. Drafts stay private to the student.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="flex flex-wrap items-end gap-6 px-6 pt-5 max-md:px-4">
        <div>
          <h1 className="text-title font-semibold">{selected.title}</h1>
          <p className="text-muted-foreground mt-1.75 flex flex-wrap items-center gap-2.5">
            <span>
              {summary.submissions}{" "}
              {summary.submissions === 1 ? "submission" : "submissions"}
            </span>
            ·<span>Median {summary.medianSteps} steps</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4 max-md:ml-0 max-md:w-full">
          <div className="w-60 max-md:flex-1">
            <ReviewProgress summary={summary} />
          </div>
          {next?.state === "flagged" ? (
            <Link
              className={buttonVariants()}
              href={`/instructor/visualiser?project=${next.id}`}
            >
              Review next
              <Icon name="right" />
            </Link>
          ) : null}
        </div>
      </section>

      {assignments.length > 1 ? (
        <div className="px-6 pt-4 max-md:px-4">
          <ToggleGroup
            aria-label="Assignment"
            onValueChange={([id]) => {
              if (id) {
                void setChosen(id);
              }
            }}
            value={[selected.id]}
          >
            <ToggleGroupThumb>
              {assignments.map(({ id, submissions, title }) => (
                <ToggleGroupItem key={id} tone="thumb" value={id}>
                  {title}
                  <span className="text-faint font-mono tabular-nums">
                    {submissions}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroupThumb>
          </ToggleGroup>
        </div>
      ) : null}

      <div className="grid gap-3.5 px-6 pt-4.5 max-md:px-4 lg:grid-cols-[minmax(0,1fr)_372px]">
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <h2 className="text-ui font-heading">Not from logged AI</h2>
              <span className="text-muted-foreground text-meta">
                Submissions by share of the final text
                {summary.medianUnmatched === null
                  ? ""
                  : ` · median ${summary.medianUnmatched}%`}
              </span>
            </div>
            <div className="mt-3">
              <UnmatchedDistribution
                bins={summary.distribution}
                median={summary.medianUnmatched}
              />
            </div>
            <p className="text-muted-foreground text-meta mt-3 text-pretty">
              This is the share of the final text that matches none of the
              logged AI answers. Paraphrased AI text and answers that were not
              logged also count here, so a low or high share says nothing about
              who wrote the essay.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <h2 className="text-ui font-heading">Look closer</h2>
              <span className="text-muted-foreground text-meta">
                Open flags from the reflection check
              </span>
            </div>
            <Reasons summary={summary} />
            <p className="text-muted-foreground text-meta mt-3 mb-3 text-pretty">
              Flags only ask you to look closer. They never change a grade, and
              you can dismiss any of them.
            </p>
            <Totals summary={summary} />
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-meta max-w-prose px-6 pt-4 text-pretty max-md:px-4">
        The table lists open flags first, then checks that failed or haven’t
        finished, then the rest. The share not from logged AI is shown for
        context and never changes the order.
      </p>
      <SubmissionsTable rows={shown} />
    </>
  );
};

export const OverviewSkeleton = () => (
  <>
    <output className="sr-only">Loading submissions…</output>
    <div
      aria-hidden="true"
      className="flex flex-col gap-3.5 px-6 pt-5 pb-6 max-md:px-4"
    >
      <div className="bg-muted shadow-hairline h-14 w-72 animate-pulse rounded-xl motion-reduce:animate-none" />
      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_372px]">
        <div className="bg-muted shadow-hairline h-72 animate-pulse rounded-xl motion-reduce:animate-none" />
        <div className="bg-muted shadow-hairline h-72 animate-pulse rounded-xl motion-reduce:animate-none" />
      </div>
      <div className="bg-muted shadow-hairline h-96 animate-pulse rounded-xl motion-reduce:animate-none" />
    </div>
  </>
);
