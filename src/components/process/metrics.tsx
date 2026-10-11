import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* Ink for text no logged AI answer explains, cobalt for text traced to one. */
export const CompositionBar = ({
  traced,
  className,
}: {
  traced: number;
  className?: string;
}) => (
  <span
    aria-hidden="true"
    className={cn("flex h-1.5 gap-0.5 overflow-hidden rounded-xs", className)}
  >
    <i className="bg-human block h-full flex-1" />
    <i
      className="bg-ai block h-full w-(--share)"
      style={{ "--share": `${traced * 100}%` }}
    />
  </span>
);

/* Critique depth out of three; below 1.5 the filled marks turn vermilion. */
export const DepthMeter = ({ depth }: { depth: number }) => {
  const filled = Math.round(depth);
  return (
    <span aria-hidden="true" className="inline-flex gap-0.75">
      {[1, 2, 3].map((mark) => (
        <i
          className={cn(
            "bg-border block h-1 w-3 rounded-full",
            mark <= filled && (depth < 1.5 ? "bg-flag" : "bg-human")
          )}
          key={mark}
        />
      ))}
    </span>
  );
};

/* A headline figure: label above, the value large and tabular. Neighbours are divided by a rule. */
export const Stat = ({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "min-w-30 border-l px-5.5 first:border-l-0 first:pl-0",
      className
    )}
  >
    <div className="text-label text-muted-foreground font-emphasis">
      {label}
    </div>
    <div className="text-stat font-heading mt-1 tabular-nums">{children}</div>
  </div>
);
