import type { Step } from "@/lib/process";
import { cn } from "@/lib/utils";

type BarStep = Pick<Step, "words" | "carried" | "critiqueWords" | "flag">;

/*
  The small process chart. AI words rise above the baseline, with the part that reached the essay in cobalt;
  critique words hang below it on the same scale, so a thin critique looks thin.
*/
export const ProcessBars = ({
  steps,
  width,
  height,
  base,
  scale,
  labels = false,
  className,
}: {
  steps: readonly BarStep[];
  width: number;
  height: number;
  base: number;
  scale: number;
  labels?: boolean;
  className?: string;
}) => {
  const slot = width / steps.length;
  const bar = Math.min(slot * 0.6, 14);
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
        return (
          // oxlint-disable-next-line react/no-array-index-key -- steps are positional and never reorder
          <g key={index}>
            <rect
              fill="var(--ai-soft)"
              height={step.words * scale}
              rx="2"
              width={bar}
              x={x}
              y={base - step.words * scale}
            />
            {step.carried > 0 ? (
              <rect
                fill="var(--ai)"
                height={step.carried * scale}
                rx="2"
                width={bar}
                x={x}
                y={base - step.carried * scale}
              />
            ) : null}
            <rect
              fill={step.flag ? "var(--flag)" : "var(--human)"}
              height={Math.max(step.critiqueWords * scale, 1.5)}
              rx="1.5"
              width={bar}
              x={x}
              y={base + 1.5}
            />
            {labels ? (
              <text
                className="fill-faint font-mono font-medium"
                fontSize={Math.max(7, slot * 0.16)}
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
