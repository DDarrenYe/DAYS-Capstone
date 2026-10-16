"use client";

import { useRef, useState } from "react";
import type { PointerEvent } from "react";

import { Switch } from "@/components/ui/switch";
import { essay, steps, student } from "@/lib/example-data";
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

export const EarlierLayer = () => {
  const area = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"scan" | "track" | "rest">("scan");
  const [whole, setWhole] = useState(false);

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    if (whole || event.pointerType === "touch" || !area.current) {
      return;
    }
    const box = area.current.getBoundingClientRect();
    area.current.style.setProperty("--lens-x", `${event.clientX - box.left}px`);
    area.current.style.setProperty("--lens-y", `${event.clientY - box.top}px`);
    setMode("track");
  };

  return (
    <div className="flex flex-col gap-3.5">
      <figure className="bg-card shadow-card overflow-clip rounded-xl">
        <figcaption className="text-muted-foreground text-label flex items-center gap-2 border-b px-4 py-2.5 font-mono">
          {student.file}
          <span aria-hidden="true">·</span>
          {student.name}
          <span className="ml-auto">Final essay</span>
        </figcaption>
        <div
          className="text-reading lens-area relative"
          data-lens={whole ? "open" : mode}
          onPointerLeave={() =>
            setMode((now) => (now === "track" ? "rest" : now))
          }
          onPointerMove={follow}
          ref={area}
        >
          <div className={TEXT}>
            <Essay />
          </div>
          <div
            aria-hidden="true"
            className="lens-ring bg-ai-line pointer-events-none absolute inset-0"
          />
          <div
            aria-hidden="true"
            className={cn(
              TEXT,
              "lens bg-ai-wash text-muted-foreground pointer-events-none absolute inset-0 select-none"
            )}
          >
            <Essay under />
          </div>
        </div>
      </figure>
      <div className="text-muted-foreground text-meta flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- Base UI Switch renders the control inside the label */}
        <label className="text-body font-emphasis flex cursor-pointer items-center gap-2">
          <Switch checked={whole} onCheckedChange={setWhole} />
          Show the whole layer
        </label>
        <span className="max-sm:hidden">
          or move over the essay to look through it
        </span>
      </div>
    </div>
  );
};
