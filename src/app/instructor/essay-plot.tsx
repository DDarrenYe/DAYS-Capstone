const binCounts = [
  [6, 1],
  [9, 3],
  [10, 2],
  [11, 3],
  [12, 3],
  [13, 4],
  [14, 4],
  [15, 5],
  [16, 3],
  [17, 7],
  [18, 2],
  [19, 1],
  [20, 2],
  [21, 3],
  [22, 1],
  [23, 1],
  [24, 2],
  [26, 1],
] as const;

const highlighted = { bin: 14, name: "John Doe", percent: 68 };
const median = 71;
const left = 44;
const width = 472;
const baseline = 240;
const unit = width / 60;
const xFor = (percent: number) => left + (percent - 40) * unit;
const binX = (bin: number) => xFor(40 + bin * 2 + 1);
const ticks = [40, 60, 80, 100];

export const EssayPlot = () => {
  const highlightX = binX(highlighted.bin);
  const highlightY = baseline - 9;
  return (
    <figure className="my-4.5 mb-2">
      <figcaption className="sr-only">
        Dot plot of 48 essays by share not from logged AI. Median {median}
        percent. {highlighted.name} is at {highlighted.percent} percent.
      </figcaption>
      <svg aria-hidden="true" className="h-auto w-full" viewBox="0 0 560 300">
        <line
          stroke="var(--ink-2)"
          strokeDasharray="4 5"
          strokeOpacity=".3"
          strokeWidth="1.5"
          x1={xFor(median)}
          x2={xFor(median)}
          y1="20"
          y2={baseline}
        />
        <text
          fill="var(--body)"
          fontSize="15"
          fontWeight="600"
          x={xFor(median) + 8}
          y="34"
        >
          median {median}%
        </text>
        {binCounts.flatMap(([bin, count]) =>
          Array.from({ length: count }, (_, level) => {
            const isHighlighted = bin === highlighted.bin && level === 0;
            return (
              <circle
                cx={binX(bin)}
                cy={baseline - 9 - level * 18}
                fill={isHighlighted ? "var(--human)" : "#ffc79f"}
                key={`${bin}-${level}`}
                opacity={isHighlighted ? 1 : 0.55}
                r={isHighlighted ? 10 : 7.5}
              />
            );
          })
        )}
        <rect
          fill="var(--line)"
          height="1.5"
          width={width}
          x={left}
          y={baseline}
        />
        {ticks.map((tick) => (
          <text
            fill="var(--muted-foreground)"
            fontSize="15"
            key={tick}
            textAnchor="middle"
            x={xFor(tick)}
            y="274"
          >
            {tick}%
          </text>
        ))}
        <circle
          cx={highlightX}
          cy={highlightY}
          fill="none"
          r="16"
          stroke="var(--human)"
          strokeWidth="2.5"
        />
        <rect
          fill="var(--ink-2)"
          height="34"
          rx="17"
          width="136.4"
          x={highlightX - 68.2}
          y={highlightY - 62}
        />
        <path
          d={`M${highlightX - 7} ${highlightY - 28.5} l7 7 l7 -7z`}
          fill="var(--ink-2)"
        />
        <text
          fill="var(--card)"
          fontSize="16"
          fontWeight="600"
          textAnchor="middle"
          x={highlightX}
          y={highlightY - 39}
        >
          {highlighted.name} · {highlighted.percent}%
        </text>
      </svg>
    </figure>
  );
};
