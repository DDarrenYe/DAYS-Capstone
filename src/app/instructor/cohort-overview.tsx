"use client";

import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";

import { CHECK_STATE } from "@/app/instructor/check-state";
import { SubmissionsTable } from "@/app/instructor/submissions-table";
import { UnmatchedDistribution } from "@/app/instructor/unmatched-distribution";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
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
import { isUnfinished } from "@/lib/submission-rows";
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

/* The grader's first question is "who needs me?", so open flags lead the page as one card each. */
const NeedsReview = ({ rows }: { rows: SubmissionRow[] }) => {
  const flagged = rows
    .filter(({ state }) => state === "flagged")
    .toSorted((first, second) => second.openFlags - first.openFlags);
  const unfinished = rows.filter(isUnfinished);
  return (
    <section aria-labelledby="needs-review" className="px-6 pt-5 max-md:px-4">
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <h2 className="text-ui font-heading" id="needs-review">
          Needs your review
        </h2>
        <span className="text-muted-foreground text-meta">
          {flagged.length === 0
            ? "Nothing flagged right now"
            : `${flagged.length} ${flagged.length === 1 ? "submission has" : "submissions have"} open flags`}
        </span>
      </div>
      {flagged.length > 0 ? (
        <ul className="mt-3 grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {flagged.map((row) => (
            <li key={row.id}>
              <Card>
                <CardContent>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-heading">{row.name}</span>
                      <Badge variant="flag">
                        <Icon name="flag" />
                        {row.openFlags} open
                      </Badge>
                    </div>
                    <p className="text-pretty">
                      {row.openKinds
                        .map(({ kind }) => flagKindLabel(kind))
                        .join(" · ")}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-muted-foreground text-meta">
                        {row.stepCount} {row.stepCount === 1 ? "step" : "steps"}
                      </span>
                      <Link
                        className={buttonVariants()}
                        href={`/instructor/visualiser?project=${row.id}`}
                      >
                        Review
                        <Icon name="right" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
      {unfinished.length > 0 ? (
        <p className="text-muted-foreground text-meta mt-3">
          Also waiting:{" "}
          {unfinished
            .map(
              (row) =>
                `${row.name} (${CHECK_STATE[row.state].label.toLowerCase()})`
            )
            .join(" · ")}
        </p>
      ) : null}
    </section>
  );
};

/* Cohort-wide numbers help with context, not with the next action, so they start folded away. */
const CohortDetails = ({ summary }: { summary: CohortSummary }) => (
  <details className="group mx-6 mb-6 rounded-xl border px-5 py-4 max-md:mx-4">
    <summary className="cursor-pointer select-none">
      <span className="font-heading">Cohort overview</span>
      <span className="text-muted-foreground text-meta">
        {summary.medianUnmatched === null
          ? ""
          : ` · median ${summary.medianUnmatched}% not from logged AI`}
        {` · ${summary.totalWords.toLocaleString("en")} final words`}
      </span>
    </summary>
    <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <h3 className="text-ui font-heading">
          Not from logged AI, by submission
        </h3>
        <div className="mt-3">
          <UnmatchedDistribution
            bins={summary.distribution}
            median={summary.medianUnmatched}
          />
        </div>
      </div>
      <div>
        <h3 className="text-ui font-heading">Open flags by reason</h3>
        <Reasons summary={summary} />
        <p className="text-muted-foreground text-meta mt-2 mb-3">
          {summary.feedbackFlags} added to feedback
        </p>
        <Totals summary={summary} />
      </div>
    </div>
  </details>
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
      <section className="px-6 pt-5 max-md:px-4">
        <h1 className="text-title font-semibold">{selected.title}</h1>
        <p className="text-muted-foreground mt-1.75">
          {summary.submissions}{" "}
          {summary.submissions === 1 ? "submission" : "submissions"} ·{" "}
          {summary.counts.clear} with nothing to review
        </p>
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

      <NeedsReview rows={shown} />

      <SubmissionsTable rows={shown} />

      <CohortDetails summary={summary} />
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
