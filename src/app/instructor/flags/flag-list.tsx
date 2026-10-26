"use client";

import Link from "next/link";
import { useState } from "react";

import { CheckResult } from "@/app/instructor/check-result";
import { FlagDecision } from "@/app/instructor/flag-decision";
import type { FlagQueue, QueueFlag } from "@/app/instructor/flags/flag-queue";
import { Icon } from "@/components/icon";
import { Avatar } from "@/components/shell/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
  ToggleGroupThumb,
} from "@/components/ui/toggle-group";
import { FLAG_STATE_LABEL } from "@/lib/flag-review";
import type { FlagState } from "@/lib/flag-review";
import { cn } from "@/lib/utils";

type View = FlagState | "all";

const VIEWS: readonly { label: string; value: View }[] = [
  { label: "Open", value: "open" },
  { label: "Added to feedback", value: "added_to_feedback" },
  { label: "Dismissed", value: "dismissed" },
  { label: "All", value: "all" },
];

const NOTHING: Record<View, string> = {
  added_to_feedback: "Nothing has been added to feedback yet.",
  all: "There are no flags.",
  dismissed: "Nothing has been dismissed.",
  open: "No open flags. Every flag in your courses has a decision.",
};

const FlagItem = ({
  entry,
  onDecided,
}: {
  entry: QueueFlag;
  onDecided: () => void;
}) => {
  const { check, critique, flag, project, step } = entry;
  return (
    <li>
      <Card>
        <div className="grid gap-x-4 gap-y-3 px-4 py-3.5 md:grid-cols-[220px_minmax(0,1fr)_auto]">
          <div className="flex items-start gap-2.5">
            <Avatar name={project.name} />
            <div className="min-w-0">
              <b className="font-emphasis block">{project.name}</b>
              <span className="text-muted-foreground block text-xs">
                <span className="font-mono">S{step.number}</span> · {step.title}
              </span>
              <span className="text-faint block text-xs">
                {project.course} · {project.assignment}
              </span>
            </div>
          </div>
          <div
            className={cn(
              "min-w-0 transition-opacity duration-200 ease-out",
              flag.state === "dismissed" && "opacity-60"
            )}
          >
            <p
              className={cn(
                "font-heading flex items-center gap-1.75",
                flag.state === "open"
                  ? "text-flag-ink"
                  : "text-muted-foreground"
              )}
            >
              <Icon name="flag" />
              {flag.label}
              <span className="text-label font-emphasis ml-auto">
                {FLAG_STATE_LABEL[flag.state]}
              </span>
            </p>
            <p className="text-body mt-0.5 whitespace-pre-line">
              {flag.explanation}
            </p>
            <blockquote className="text-reading border-border-strong text-lead mt-2 border-l-2 pl-3 font-serif leading-normal whitespace-pre-line">
              {flag.evidence}
            </blockquote>
            <details className="group/check mt-2.5">
              <summary className="text-label text-muted-foreground font-emphasis flex cursor-pointer list-none items-center gap-1">
                Reflection check and full critique
                <Icon
                  className="size-3.5 transition-transform group-open/check:rotate-180"
                  name="down"
                />
              </summary>
              <div className="mt-2 flex flex-col gap-3">
                <CheckResult result={check} />
                <div>
                  <h3 className="text-label text-muted-foreground font-emphasis mb-1">
                    Critique
                  </h3>
                  <p className="text-reading font-serif whitespace-pre-line">
                    {critique === "" ? "No critique was written." : critique}
                  </p>
                </div>
              </div>
            </details>
          </div>
          <Link
            aria-label={`Open ${project.name} step ${step.number} in Submissions`}
            className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
            href={`/instructor/visualiser?project=${project.id}&step=${step.position}`}
          >
            <Icon name="right" />
          </Link>
        </div>
        <div className="border-t px-4 py-3">
          <FlagDecision
            flag={flag}
            key={flag.reviewedAt ?? "open"}
            onDecided={onDecided}
            subject={`${flag.label} flag for ${project.name} on step ${step.number}`}
          />
        </div>
      </Card>
    </li>
  );
};

export const FlagList = ({ queue }: { queue: FlagQueue }) => {
  const [show, setShow] = useState<View>("open");
  const [decidedHere, setDecidedHere] = useState<ReadonlySet<string>>(
    new Set()
  );
  const count = (view: View) =>
    view === "all" ? queue.flags.length : queue.counts[view];
  const visible = queue.flags.filter(
    ({ flag }) =>
      show === "all" || flag.state === show || decidedHere.has(flag.id)
  );

  return (
    <div className="px-6 pt-4 pb-6 max-md:px-4">
      <ToggleGroup
        aria-label="Show flags"
        onValueChange={([next]) => {
          const view = VIEWS.find(({ value }) => value === next);
          if (view) {
            setShow(view.value);
            setDecidedHere(new Set());
          }
        }}
        value={[show]}
      >
        <ToggleGroupThumb>
          {VIEWS.map(({ label, value }) => (
            <ToggleGroupItem key={value} tone="thumb" value={value}>
              {label}
              <span className="text-faint font-mono tabular-nums">
                {count(value)}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroupThumb>
      </ToggleGroup>
      <ul className="mt-3.5 grid gap-2.5">
        {visible.map((entry) => (
          <FlagItem
            entry={entry}
            key={entry.flag.id}
            onDecided={() =>
              setDecidedHere((current) => new Set(current).add(entry.flag.id))
            }
          />
        ))}
      </ul>
      {visible.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center">
          {NOTHING[show]}
        </p>
      ) : null}
    </div>
  );
};
