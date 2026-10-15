"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  max = 100,
  min = 0,
  value,
  ...props
}: ProgressPrimitive.Root.Props) {
  const fill =
    value !== null && Number.isFinite(value)
      ? Math.min(Math.max((value - min) / (max - min), 0), 1) || 0
      : 1;
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("w-full", className)}
      max={max}
      min={min}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className="bg-muted shadow-hairline block h-1.5 overflow-hidden rounded-full"
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="bg-primary block h-full w-full! -translate-x-(--empty) rounded-full transition-transform duration-240 ease-out"
          style={{ "--empty": `${(1 - fill) * 100}%` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
