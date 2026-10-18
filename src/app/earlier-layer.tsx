"use client";

import { useState } from "react";
import type { PointerEvent } from "react";

import { Icon } from "@/components/icon";
import { essay, steps } from "@/lib/example-data";
import { cn } from "@/lib/utils";

const TEXT = "text-lg/relaxed flex flex-col gap-4 p-8 font-serif max-md:p-5";

const Essay = ({ under = false }: { under?: boolean }) =>
  essay.map((paragraph) => (
    <p key={paragraph[0]?.text}>
      {paragraph.map((run) => {
        if (run.step === undefined) {
          return run.text;
        }
        const flagged = Boolean(steps[run.step]?.flag);
        return under ? (
          <mark
            className={
              flagged ? "bg-flag-soft text-flag-ink" : "bg-ai-soft text-ai-ink"
            }
            key={run.text}
          >
            {run.text}
          </mark>
        ) : (
          <span key={run.text}>
            {run.text}
            <span className="sr-only">
              {flagged
                ? " (matches an answer whose critique was flagged)"
                : " (matches a logged AI answer)"}
            </span>
          </span>
        );
      })}
    </p>
  ));

const position = (event: PointerEvent<HTMLDivElement>) => {
  const box = event.currentTarget.getBoundingClientRect();
  const share = ((event.clientX - box.left) / box.width) * 100;
  return Math.round(Math.min(Math.max(share, 0), 100));
};

export const EarlierLayer = () => {
  const [split, setSplit] = useState<number | null>(null);
  const value = split ?? 50;

  return (
    <div className="bg-card shadow-card overflow-clip rounded-xl">
      <div className="text-muted-foreground text-label font-emphasis flex justify-between border-b px-4 py-2.5">
        <span>Finished essay</span>
        <span className="text-ai-ink">Earlier layer</span>
      </div>
      <div
        className="split-area text-reading relative cursor-ew-resize select-none"
        data-split={split === null ? "auto" : undefined}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          if (event.pointerType !== "touch") {
            setSplit(position(event));
          }
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            setSplit(position(event));
          }
        }}
        style={split === null ? undefined : { "--split": `${split}%` }}
      >
        <div className={TEXT}>
          <Essay />
        </div>
        <div
          aria-hidden="true"
          className={cn(
            TEXT,
            "split-layer bg-ai-wash text-muted-foreground absolute inset-0"
          )}
        >
          <Essay under />
        </div>
        <input
          aria-label="Compare the finished essay with its earlier layer"
          aria-valuetext={`${100 - value}% of the width shows the earlier layer`}
          className="peer sr-only"
          max={100}
          min={0}
          onChange={(event) => setSplit(Number(event.target.value))}
          type="range"
          value={value}
        />
        <div
          aria-hidden="true"
          className="bg-foreground peer-focus-visible:*:outline-ring pointer-events-none absolute inset-y-0 left-(--split) w-px peer-focus-visible:*:outline-2 peer-focus-visible:*:outline-offset-2"
        >
          <span className="bg-card shadow-pop text-body split-hint absolute top-1/2 left-1/2 flex h-8 -translate-1/2 items-center rounded-full px-1.5">
            <Icon className="size-3.5" name="left" />
            <Icon className="size-3.5" name="right" />
          </span>
        </div>
      </div>
    </div>
  );
};
