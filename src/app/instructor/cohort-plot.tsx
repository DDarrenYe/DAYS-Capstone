"use client";

import { useState } from "react";

import type { CohortStudent } from "@/lib/example-data";
import { formatPercent } from "@/lib/process";

const W = 760;
const H = 222;
const LEFT = 34;
const BOTTOM = 30;
const TOP = 8;
const MAX = 0.6;
const x = (share: number) => LEFT + (share / MAX) * (W - LEFT - 8);
const y = (depth: number) => TOP + (1 - depth / 3) * (H - TOP - BOTTOM);

const dotFill = (student: CohortStudent) => {
  if (student.detail) {
    return "var(--card)";
  }
  return student.flags > 0 ? "var(--flag)" : "var(--human)";
};

/* Each dot is a submission: share of the essay traced to logged AI across, critique depth up. */
export const CohortPlot = ({
  students,
  median,
}: {
  students: readonly CohortStudent[];
  median: number;
}) => {
  const [active, setActive] = useState<CohortStudent | null>(null);
  return (
    <figure className="relative mt-1.5">
      <figcaption className="sr-only">
        Scatter plot of {students.length} submissions by share traced to logged
        AI and critique depth. The submissions table below lists the same
        values.
      </figcaption>
      <svg
        aria-hidden="true"
        className="block h-auto w-full"
        viewBox={`0 0 ${W} ${H}`}
      >
        <rect
          className="fill-flag-soft/70"
          height={y(0) - y(1.5)}
          rx="6"
          width={x(MAX) - x(0.35)}
          x={x(0.35)}
          y={y(1.5)}
        />
        <text
          className="fill-flag-ink text-label font-medium"
          textAnchor="end"
          x={x(MAX) - 10}
          y={y(0) - 10}
        >
          Leaned on AI, thin critique
        </text>
        {[0, 1, 2, 3].map((depth) => (
          <g key={depth}>
            <line
              className="stroke-border"
              strokeDasharray={depth ? "2 4" : undefined}
              x1={LEFT}
              x2={W}
              y1={y(depth)}
              y2={y(depth)}
            />
            <text
              className="fill-faint text-micro font-mono"
              textAnchor="end"
              x={LEFT - 10}
              y={y(depth) + 3}
            >
              {depth}
            </text>
          </g>
        ))}
        {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((share) => (
          <text
            className="fill-faint text-micro font-mono"
            key={share}
            textAnchor="middle"
            x={x(share)}
            y={H - 12}
          >
            {formatPercent(share)}
          </text>
        ))}
        <line
          className="stroke-border-strong"
          strokeDasharray="3 3"
          x1={x(median)}
          x2={x(median)}
          y1={TOP}
          y2={y(0)}
        />
        <text
          className="fill-faint text-micro font-mono"
          x={x(median) + 6}
          y={y(0) - 8}
        >
          median {formatPercent(median)}
        </text>
        {students.map((student) => (
          <circle
            className="stroke-card"
            cx={x(student.traced)}
            cy={y(student.depth)}
            fill={dotFill(student)}
            fillOpacity={student.flags > 0 || student.detail ? 1 : 0.72}
            key={student.name}
            onMouseEnter={() => setActive(student)}
            onMouseLeave={() => setActive(null)}
            r={student.detail ? 6 : 5}
            stroke={student.detail ? "var(--ai)" : undefined}
            strokeWidth={student.detail ? 2.5 : 1.5}
          />
        ))}
        {students
          .filter((student) => student.detail)
          .map((student) => (
            <text
              className="fill-ai-ink text-label font-semibold"
              key={student.name}
              textAnchor="middle"
              x={x(student.traced)}
              y={y(student.depth) - 12}
            >
              {student.name}
            </text>
          ))}
      </svg>
      {active ? (
        <div
          className="bg-primary text-primary-foreground shadow-pop pointer-events-none absolute top-(--y) left-(--x) z-10 -mt-3 -translate-x-1/2 -translate-y-full rounded-md px-2.5 py-1.75 text-xs whitespace-nowrap"
          style={{
            "--x": `${(x(active.traced) / W) * 100}%`,
            "--y": `${(y(active.depth) / H) * 100}%`,
          }}
        >
          {active.name}
          <span className="text-primary-foreground/65">
            {" "}
            · {formatPercent(active.traced)} traced · depth{" "}
            {active.depth.toFixed(1)}
            {active.flags > 0
              ? ` · ${active.flags} flag${active.flags > 1 ? "s" : ""}`
              : ""}
          </span>
        </div>
      ) : null}
    </figure>
  );
};
