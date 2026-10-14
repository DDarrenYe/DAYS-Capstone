import { BIN_COUNT } from "@/lib/cohort-summary";

const BAND = 100 / BIN_COUNT;

const band = (bin: number) => `${bin * BAND}–${(bin + 1) * BAND}%`;

export const UnmatchedDistribution = ({
  bins,
}: {
  bins: readonly number[];
}) => {
  const most = Math.max(1, ...bins);
  return (
    <figure>
      <figcaption className="sr-only">
        Submissions grouped by the share of the final text that matches none of
        the logged AI answers, in bands of ten percentage points.
      </figcaption>
      <ol className="grid gap-1.5">
        {bins.map((count, bin) => (
          <li className="flex items-center gap-2.5" key={band(bin)}>
            <span className="text-faint text-label w-16 shrink-0 font-mono">
              {band(bin)}
            </span>
            <span aria-hidden="true" className="flex-1">
              <i
                className="bg-human block h-2.5 w-(--share) rounded-r-xs"
                style={{ "--share": `${(count / most) * 100}%` }}
              />
            </span>
            <span className="text-muted-foreground text-meta w-6 text-right tabular-nums">
              {count}
              <span className="sr-only">
                {count === 1 ? " submission" : " submissions"}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
};
