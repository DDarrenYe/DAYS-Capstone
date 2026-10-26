"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useEffectEvent, useState } from "react";

import { CHECK_STATE } from "@/app/instructor/check-state";
import { CheckStatus } from "@/app/instructor/visualiser/check-status";
import { EssayCard } from "@/app/instructor/visualiser/essay-card";
import { StepCard } from "@/app/instructor/visualiser/step-card";
import { StepNote } from "@/app/instructor/visualiser/step-note";
import type { SubmissionDetail } from "@/app/instructor/visualiser/submission-detail";
import { useStepNotes } from "@/app/instructor/visualiser/use-step-notes";
import { Icon } from "@/components/icon";
import { CompositionBar, Stat } from "@/components/process/metrics";
import { ProcessChart } from "@/components/process/process-chart";
import { ReportBuilder } from "@/components/report/report-builder";
import { Avatar } from "@/components/shell/avatar";
import { PageBar } from "@/components/shell/page-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { critiqueOrder } from "@/lib/process";
import { hasCheckResults } from "@/lib/submission-rows";
import { cn } from "@/lib/utils";

const LEGEND = [
  ["bg-ai-soft rounded-xs", "AI answer"],
  ["bg-ai rounded-xs", "Reached the essay"],
  ["bg-human rounded-xs", "Student critique"],
  ["bg-success rounded-full", "Student marked an AI error"],
  ["bg-flag rounded-full", "Open flag"],
];

const Summary = ({ detail }: { detail: SubmissionDetail }) => {
  const { match } = detail;
  const noResults = !hasCheckResults(detail);
  return (
    <section className="flex flex-wrap items-start gap-x-3.5 gap-y-4 px-6 pt-4.5 pb-4 max-md:px-4">
      <Avatar name={detail.name} size="lg" />
      <div className="min-w-64 flex-1">
        <h1 className="text-title font-semibold">{detail.name}</h1>
        <p className="text-muted-foreground mt-0.75 flex flex-wrap items-center gap-1.5">
          <span className="text-label font-mono">{detail.email}</span>·
          <span>Submitted {detail.submitted}</span>·
          <span>
            {detail.steps.length} {detail.steps.length === 1 ? "step" : "steps"}{" "}
            over {detail.days} {detail.days === 1 ? "day" : "days"}
          </span>
        </p>
      </div>
      <div className="flex flex-wrap gap-y-3 pt-0.5">
        <Stat
          className={detail.openFlags > 0 ? "text-flag" : undefined}
          label="Open flags"
        >
          {noResults ? (
            <span className="text-body text-muted-foreground font-book tracking-normal">
              {CHECK_STATE[detail.check].label}
            </span>
          ) : (
            detail.openFlags
          )}
        </Stat>
        <Stat label="Not from logged AI">
          {match.unmatchedPercent === null ? "—" : `${match.unmatchedPercent}%`}
          {match.unmatchedPercent === null ? null : (
            <CompositionBar
              className="mt-2.25 w-42"
              traced={1 - match.unmatchedPercent / 100}
            />
          )}
        </Stat>
        <Stat label="Critique score">
          {detail.critiqueAverage.toFixed(1)}
          <small className="text-faint text-control font-book ml-0.5 tracking-normal">
            / {critiqueOrder.length}
          </small>
        </Stat>
      </div>
    </section>
  );
};

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
    target.closest("[role='dialog']") !== null);

const stepParser = parseAsInteger.withOptions({ history: "replace" });

export const Visualiser = ({ detail }: { detail: SubmissionDetail }) => {
  const { steps } = detail;
  const firstFlagged = steps.findIndex((item) => item.flag) + 1 || 1;
  const [stepParam, setStepParam] = useQueryState("step", stepParser);
  const [hovered, setHovered] = useState<number | null>(null);
  const [animate, setAnimate] = useState(false);
  const [traced, setTraced] = useState(true);
  const { noteOf, save, write } = useStepNotes(detail);
  const selected =
    Math.min(Math.max(stepParam ?? firstFlagged, 1), steps.length) - 1;
  const step = steps[selected];

  const select = (index: number, animated = true) => {
    setAnimate(animated);
    setStepParam(((index + steps.length) % steps.length) + 1);
  };

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (isTyping(event.target) || event.metaKey || event.ctrlKey) {
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      select(selected + (event.key === "ArrowRight" ? 1 : -1), false);
    }
  });

  useEffect(() => {
    const handle = (event: KeyboardEvent) => onKey(event);
    globalThis.addEventListener("keydown", handle);
    return () => globalThis.removeEventListener("keydown", handle);
  }, []);

  if (!step) {
    return null;
  }

  return (
    <>
      <PageBar
        crumbs={[
          { href: "/instructor", label: "Overview" },
          {
            href: `/instructor?assignment=${detail.assignment.id}`,
            label: detail.assignment.title,
          },
          { label: detail.name },
        ]}
      >
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            <Icon name="export" />
            Export
          </DialogTrigger>
          <DialogContent size="workspace">
            <ReportBuilder
              cancel={
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
              }
              detail={detail}
              inDialog
            />
          </DialogContent>
        </Dialog>
      </PageBar>

      <div className="flex-1 overflow-y-auto">
        <Summary detail={detail} />

        <CheckStatus detail={detail} />

        <div className="grid gap-3.5 px-6 pb-3.5 max-md:px-4 lg:grid-cols-[minmax(0,1fr)_440px]">
          <EssayCard
            detail={detail}
            focus={hovered ?? selected}
            onSelect={select}
            onTracedChange={setTraced}
            traced={traced}
          />
          {/* On narrow screens the step card, which carries the open flag, comes before the essay. */}
          <div className="max-lg:order-first">
            <StepCard
              animate={animate}
              index={selected}
              onSelect={select}
              step={step}
            >
              <StepNote
                name={detail.name}
                note={noteOf(step.id)}
                number={selected + 1}
                onSave={() => save(step.id)}
                onWrite={(draft) => write(step.id, draft)}
              />
            </StepCard>
          </div>
        </div>
        <details className="group mx-6 mb-6 max-md:mx-4">
          <summary className="text-ui font-heading cursor-pointer py-2 select-none">
            Process timeline ({steps.length}{" "}
            {steps.length === 1 ? "step" : "steps"})
          </summary>
          <Card className="mt-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-3.5">
              <ul className="text-muted-foreground flex flex-wrap gap-x-3.5 gap-y-1 text-xs">
                {LEGEND.map(([swatch, label]) => (
                  <li className="flex items-center gap-1.5" key={label}>
                    <i className={cn("block size-2.25", swatch)} />
                    {label}
                  </li>
                ))}
              </ul>
              <span className="text-faint ml-auto flex items-center gap-1.5 text-xs max-md:hidden">
                <Kbd>←</Kbd>
                <Kbd>→</Kbd>
                step
              </span>
            </div>
            <div className="px-4 pt-3 pb-2.5">
              <ProcessChart
                animate={animate}
                onHover={setHovered}
                onSelect={select}
                selected={selected}
                steps={steps}
              />
            </div>
          </Card>
        </details>
      </div>
    </>
  );
};
