import { wordsAxis } from "@/lib/process";
import type { Step } from "@/lib/process";
import { cn } from "@/lib/utils";

type BarStep = Pick<Step, "words" | "carried" | "critiqueWords"> & {
  flag?: unknown;
};

/* Labels need about 14px each; narrower slots label every nth step instead. */
const LABEL_SLOT = 14;

/*
  The small process chart. AI words rise above the baseline, with the part that reached the essay in cobalt;
  critique words hang below it on the same scale, so a thin critique looks thin. The scale fits the longest
  answer, or a shared max so rows in a table compare fairly.
*/
export const ProcessBars = ({
  steps,
  width,
  height,
  base,
  max,
  labels = false,
  className,
}: {
  steps: readonly BarStep[];
  width: number;
  height: number;
  base: number;
  max?: number;
  labels?: boolean;
  className?: string;
}) => {
  const slot = width / Math.max(steps.length, 1);
  const bar = Math.max(Math.min(slot * 0.6, 14), 1);
  const scale = (base - 1) / (max ?? wordsAxis(steps));
  const below = height - base - 1.5 - (labels ? 10 : 0);
  const labelEvery = Math.ceil(LABEL_SLOT / slot);
  return (
    <svg
      aria-hidden="true"
      className={cn("block h-auto max-w-full overflow-visible", className)}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <line
        stroke="var(--border-strong)"
        x1="0"
        x2={width}
        y1={base + 0.5}
        y2={base + 0.5}
      />
      {steps.map((step, index) => {
        const x = slot * index + (slot - bar) / 2;
        const up = step.words * scale;
        const labelled =
          labels && (index === 0 || (index + 1) % labelEvery === 0);
        return (
          // oxlint-disable-next-line react/no-array-index-key -- steps are positional and never reorder
          <g key={index} style={{ "--i": index }}>
            <rect
              data-part="answer"
              fill="var(--ai-soft)"
              height={up}
              rx="2"
              width={bar}
              x={x}
              y={base - up}
            />
            {step.carried > 0 ? (
              <rect
                data-part="carried"
                fill="var(--ai)"
                height={step.carried * scale}
                rx="2"
                width={bar}
                x={x}
                y={base - step.carried * scale}
              />
            ) : null}
            <rect
              data-part="critique"
              fill={step.flag ? "var(--flag)" : "var(--human)"}
              height={Math.min(
                Math.max(step.critiqueWords * scale, 1.5),
                below
              )}
              rx="1.5"
              width={bar}
              x={x}
              y={base + 1.5}
            />
            {labelled ? (
              <text
                className="fill-faint font-mono font-medium"
                fontSize={7}
                textAnchor="middle"
                x={x + bar / 2}
                y={height - 1}
              >
                S{index + 1}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
