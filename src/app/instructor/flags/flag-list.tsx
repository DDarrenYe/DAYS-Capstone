"use client";

import Link from "next/link";
import { useState } from "react";

import { Icon } from "@/components/icon";
import { Avatar } from "@/components/shell/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
  ToggleGroupThumb,
} from "@/components/ui/toggle-group";
import type { CohortFlag } from "@/lib/example-data";
import { stepKey, useFlagDecisions } from "@/lib/review-state";
import { cn } from "@/lib/utils";

type View = "open" | "kept" | "dismissed";

const flagKey = (flag: CohortFlag) => stepKey(flag.name, flag.step);

export const FlagList = ({
  flags,
  detailFor,
}: {
  flags: readonly CohortFlag[];
  detailFor: string;
}) => {
  const { decide: record, decisions } = useFlagDecisions();
  const [show, setShow] = useState<string>("open");
  const [decidedHere, setDecidedHere] = useState<ReadonlySet<string>>(
    new Set()
  );
  const decisionOf = (flag: CohortFlag): View =>
    decisions[flagKey(flag)] ?? "open";
  const decide = (flag: CohortFlag, decision: View) => {
    record(flagKey(flag), decision === "open" ? undefined : decision);
    setDecidedHere((current) => new Set(current).add(flagKey(flag)));
  };
  const visible = flags.filter(
    (flag) =>
      show === "all" ||
      decisionOf(flag) === show ||
      decidedHere.has(flagKey(flag))
  );
  const count = (decision: View) =>
    flags.filter((flag) => decisionOf(flag) === decision).length;

  return (
    <div className="px-6 pt-4 pb-6 max-md:px-4">
      <ToggleGroup
        aria-label="Show flags"
        onValueChange={(value) => {
          const [next] = value;
          if (next) {
            setShow(next);
            setDecidedHere(new Set());
          }
        }}
        value={[show]}
      >
        <ToggleGroupThumb>
          {(
            [
              ["open", "Open", count("open")],
              ["kept", "Kept", count("kept")],
              ["dismissed", "Dismissed", count("dismissed")],
              ["all", "All", flags.length],
            ] as const
          ).map(([value, label, total]) => (
            <ToggleGroupItem key={value} tone="thumb" value={value}>
              {label}
              <span className="text-faint font-mono tabular-nums">{total}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroupThumb>
      </ToggleGroup>
      <ul className="mt-3.5 grid gap-2.5">
        {visible.map((flag) => {
          const decision = decisionOf(flag);
          return (
            <li key={flagKey(flag)}>
              <Card>
                <div
                  className={cn(
                    "grid gap-x-4 gap-y-2 px-4 py-3.5 transition-opacity duration-200 ease-out md:grid-cols-[220px_minmax(0,1fr)_auto]",
                    decision === "dismissed" && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar name={flag.name} />
                    <div>
                      <b className="font-emphasis block">{flag.name}</b>
                      <span className="text-muted-foreground text-xs">
                        <span className="font-mono">S{flag.step}</span> ·{" "}
                        {flag.stepTitle}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "font-heading flex items-center gap-1.75 transition-colors duration-200",
                        decision === "dismissed"
                          ? "text-muted-foreground"
                          : "text-flag-ink"
                      )}
                    >
                      <Icon name="flag" />
                      {flag.title}
                    </p>
                    <p className="text-body mt-0.5">{flag.body}</p>
                    <blockquote className="text-reading border-border-strong text-lead mt-2 border-l-2 pl-3 font-serif leading-normal">
                      {flag.critique}
                    </blockquote>
                  </div>
                  <div className="flex items-start gap-1.5 md:justify-end">
                    <span
                      className={cn(
                        "flex gap-1.5",
                        decidedHere.has(flagKey(flag)) && "animate-swap"
                      )}
                      key={decision}
                    >
                      {decision === "open" ? (
                        <>
                          <Button
                            onClick={() => decide(flag, "dismissed")}
                            size="sm"
                            variant="outline"
                          >
                            Dismiss
                          </Button>
                          <Button
                            onClick={() => decide(flag, "kept")}
                            size="sm"
                          >
                            Keep flag
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => decide(flag, "open")}
                          size="sm"
                          variant="ghost"
                        >
                          {decision === "kept" ? "Kept" : "Dismissed"} · Undo
                        </Button>
                      )}
                    </span>
                    {flag.name === detailFor ? (
                      <Link
                        aria-label={`Open ${flag.name} in the Visualiser`}
                        className={buttonVariants({
                          size: "icon-sm",
                          variant: "ghost",
                        })}
                        href={`/instructor/visualiser?step=${flag.step}`}
                      >
                        <Icon name="right" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center">
          Nothing here. Every flag in this view has a decision.
        </p>
      ) : null}
    </div>
  );
};
