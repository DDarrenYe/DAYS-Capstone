import type { CohortSummary } from "@/lib/cohort-summary";

export const ReviewProgress = ({ summary }: { summary: CohortSummary }) => {
  const { clear, flagged, unfinished } = summary.counts;
  return (
    <>
      <div className="text-muted-foreground text-meta mb-1.75 flex justify-between">
        <span>Checked, no open flags</span>
        <span>
          <b className="text-foreground font-heading tabular-nums">{clear}</b>{" "}
          of {summary.submissions}
        </span>
      </div>
      <p className="sr-only">
        {clear} checked with no open flags, {flagged} with open flags,{" "}
        {unfinished} with a check not finished.
      </p>
      <div
        aria-hidden="true"
        className="bg-muted flex h-1.5 gap-0.5 overflow-hidden rounded-xs"
      >
        <i
          className="bg-success block w-(--share)"
          style={{ "--share": `${(clear / summary.submissions) * 100}%` }}
        />
        <i
          className="bg-flag block w-(--share)"
          style={{ "--share": `${(flagged / summary.submissions) * 100}%` }}
        />
      </div>
      <div className="text-muted-foreground mt-1.75 flex justify-between text-xs">
        <span className="flex items-center gap-1.5">
          <i className="bg-success block size-1.75 rounded-full" />
          No open flags
        </span>
        <span className="flex items-center gap-1.5">
          <i className="bg-flag block size-1.75 rounded-full" />
          {flagged} open
        </span>
        <span>{unfinished} not finished</span>
      </div>
    </>
  );
};
