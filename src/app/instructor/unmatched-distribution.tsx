import { BIN_COUNT } from "@/lib/cohort-summary";

const BAND = 100 / BIN_COUNT;

const band = (bin: number) => `${bin * BAND}–${(bin + 1) * BAND}%`;

export const UnmatchedDistribution = ({
  bins,
  median,
}: {
  bins: readonly number[];
  median: number | null;
}) => {
  const most = Math.max(1, ...bins);
  return (
    <figure>
      <figcaption className="sr-only">
        Submissions grouped by the share of the final text that matches none of
        the logged AI answers, in bands of ten percentage points.
      </figcaption>
      <div className="relative">
        {median === null ? null : (
          <span
            aria-hidden="true"
            className="border-foreground/40 pointer-events-none absolute top-5 -bottom-1 left-(--median) border-l border-dashed"
            style={{ "--median": `${median}%` }}
          />
        )}
        <ol className="border-border-strong grid h-32 grid-cols-10 gap-1.5 border-b">
          {bins.map((count, bin) => (
            <li className="flex flex-col gap-1" key={band(bin)}>
              <span className="text-muted-foreground text-label text-center tabular-nums">
                <span aria-hidden="true">{count > 0 ? count : null}</span>
                <span className="sr-only">
                  {band(bin)}: {count}
                  {count === 1 ? " submission" : " submissions"}
                </span>
              </span>
              <span aria-hidden="true" className="relative flex-1">
                <i
                  className="bg-human absolute inset-x-0 bottom-0 mx-auto block h-(--share) w-3/5 rounded-t-sm"
                  style={{ "--share": `${(count / most) * 100}%` }}
                />
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div
        aria-hidden="true"
        className="text-faint text-label mt-1.5 flex justify-between font-mono"
      >
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </figure>
  );
};
