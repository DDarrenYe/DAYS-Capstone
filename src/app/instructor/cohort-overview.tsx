"use client";

import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";

import { SubmissionsTable } from "@/app/instructor/submissions-table";
import { UnmatchedDistribution } from "@/app/instructor/unmatched-distribution";
import { Icon } from "@/components/icon";
import { PageBar } from "@/components/shell/page-bar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  assignmentsOf,
  cohortSummary,
  flagKindLabel,
} from "@/lib/cohort-summary";
import type { CohortSummary } from "@/lib/cohort-summary";
import type { SubmissionRow } from "@/lib/submission-rows";
import { cn } from "@/lib/utils";

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

/* The grader's first question is "who needs me?", so each submission with open flags leads the page as one line. */
const NeedsReview = ({ rows }: { rows: SubmissionRow[] }) => {
  const flagged = rows
    .filter(({ state }) => state === "flagged")
    .toSorted((first, second) => second.openFlags - first.openFlags);
  if (flagged.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="needs-review" className="px-6 pt-5 max-md:px-4">
      <h2 className="sr-only" id="needs-review">
        Needs your review
      </h2>
      <ul className="flex flex-col gap-2">
        {flagged.map((row) => (
          <li
            className="bg-flag-soft flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl py-2.5 pr-2.5 pl-4"
            key={row.id}
          >
            <Icon className="text-flag-ink" name="flag" />
            <p className="min-w-0 flex-1 text-pretty">
              <b className="font-heading">{row.name}</b> has {row.openFlags}{" "}
              open {row.openFlags === 1 ? "flag" : "flags"}:{" "}
              {row.openKinds.map(({ kind }) => flagKindLabel(kind)).join(" · ")}{" "}
              · {row.stepCount} {row.stepCount === 1 ? "step" : "steps"}
            </p>
            <Link
              className={buttonVariants()}
              href={`/instructor/visualiser?project=${row.id}`}
            >
              Review
              <Icon name="right" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

/* Where the assignment stands at a glance; the same groups the table filters by. */
const StatStrip = ({ summary }: { summary: CohortSummary }) => (
  <dl className="mx-6 mt-5 grid grid-cols-2 overflow-hidden rounded-xl border max-md:mx-4 sm:grid-cols-3 lg:grid-cols-5">
    {[
      { label: "Submitted", value: summary.submissions },
      {
        label: "Needs review",
        tone: "text-flag-ink",
        value: summary.counts.flagged,
      },
      {
        label: "Waiting on check",
        tone: "text-review-ink",
        value: summary.counts.unfinished,
      },
      { label: "Done", tone: "text-success", value: summary.counts.clear },
      {
        label: "Median not from logged AI",
        value:
          summary.medianUnmatched === null
            ? "—"
            : `${summary.medianUnmatched}%`,
      },
    ].map(({ label, tone, value }) => (
      <div className="-mt-px -ml-px border-t border-l px-4 py-3" key={label}>
        <dt className="text-muted-foreground text-meta">{label}</dt>
        <dd
          className={cn(
            "text-stat font-heading tracking-title mt-0.5 tabular-nums",
            tone
          )}
        >
          {value}
        </dd>
      </div>
    ))}
  </dl>
);

const ExportLink = () => (
  <Link
    className={buttonVariants({ variant: "outline" })}
    href="/instructor/reports"
  >
    <Icon name="export" />
    Export
  </Link>
);

const AssignmentPicker = ({
  assignments,
  onPick,
  selectedId,
}: {
  assignments: ReturnType<typeof assignmentsOf>;
  onPick: (id: string) => void;
  selectedId: string;
}) => (
  <DropdownMenu modal={false}>
    <DropdownMenuTrigger
      render={
        <button
          aria-label="Choose an assignment"
          className={buttonVariants({ variant: "outline" })}
          type="button"
        />
      }
    >
      {assignments.find(({ id }) => id === selectedId)?.title}
      <Icon className="text-muted-foreground" name="down" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-64">
      {assignments.map(({ id, submissions, title }) => (
        <DropdownMenuItem key={id} onClick={() => onPick(id)}>
          <Icon className={cn(id !== selectedId && "invisible")} name="check" />
          <span className="flex-1">{title}</span>
          <span className="text-faint tabular-nums">{submissions}</span>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

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
      <>
        <PageBar crumbs={[{ label: "Overview" }]}>
          <ExportLink />
        </PageBar>
        <section className="px-6 pt-5 max-md:px-4">
          <h1 className="text-title font-semibold">No submissions yet</h1>
          <p className="text-muted-foreground mt-1.5 max-w-160 text-pretty">
            Submissions from your courses appear here once a student submits
            their log. Drafts stay private to the student.
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <PageBar crumbs={[{ label: "Overview" }]}>
        {assignments.length > 1 ? (
          <AssignmentPicker
            assignments={assignments}
            onPick={setChosen}
            selectedId={selected.id}
          />
        ) : null}
        <ExportLink />
      </PageBar>
      <div className="flex-1 overflow-y-auto">
        <section className="px-6 pt-6 max-md:px-4">
          <h1 className="text-title font-semibold">{selected.title}</h1>
        </section>

        <StatStrip summary={summary} />

        <NeedsReview rows={shown} />

        <SubmissionsTable rows={shown} />

        <CohortDetails summary={summary} />
      </div>
    </>
  );
};

export const OverviewSkeleton = () => (
  <>
    <PageBar crumbs={[{ label: "Overview" }]}>
      <ExportLink />
    </PageBar>
    <output className="sr-only">Loading submissions…</output>
    <div
      aria-hidden="true"
      className="flex flex-col gap-3.5 px-6 pt-6 pb-6 max-md:px-4"
    >
      <div className="bg-muted shadow-hairline h-8 w-72 animate-pulse rounded-xl motion-reduce:animate-none" />
      <div className="bg-muted shadow-hairline h-18 animate-pulse rounded-xl motion-reduce:animate-none" />
      <div className="bg-muted shadow-hairline h-96 animate-pulse rounded-xl motion-reduce:animate-none" />
    </div>
  </>
);
