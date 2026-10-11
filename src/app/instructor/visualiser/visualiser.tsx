"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/components/icon";
import { Answer } from "@/components/process/answer";
import { CompositionBar, Stat } from "@/components/process/metrics";
import { ProcessChart } from "@/components/process/process-chart";
import { ReportBuilder } from "@/components/report/report-builder";
import { Avatar } from "@/components/shell/avatar";
import { PageBar } from "@/components/shell/page-bar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Switch } from "@/components/ui/switch";
import {
  essay,
  assignmentName,
  steps,
  student,
  summary,
} from "@/lib/example-data";
import { critiqueOrder, critiqueQuestions, formatPercent } from "@/lib/process";
import { cn } from "@/lib/utils";

type Decision = "kept" | "dismissed";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const Field = ({
  label,
  meta,
  children,
}: {
  label: string;
  meta?: ReactNode;
  children: ReactNode;
}) => (
  <section>
    <div className="mb-1.25 flex items-center gap-2">
      <h3 className="text-label text-muted-foreground font-emphasis">
        {label}
      </h3>
      <span className="text-muted-foreground text-label ml-auto">{meta}</span>
    </div>
    {children}
  </section>
);

export const Visualiser = () => {
  const [selected, setSelected] = useState(5);
  const [hovered, setHovered] = useState<number | null>(null);
  const [animate, setAnimate] = useState(false);
  const [traced, setTraced] = useState(true);
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});
  const [reviewed, setReviewed] = useState(false);
  const focus = hovered ?? selected;
  const step = steps[selected];

  const select = (index: number, animated: boolean) => {
    setAnimate(animated);
    setSelected((index + steps.length) % steps.length);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        setAnimate(false);
        setSelected(
          (current) =>
            (current + (event.key === "ArrowRight" ? 1 : -1) + steps.length) %
            steps.length
        );
      }
      if (event.key === "r") {
        setReviewed((current) => !current);
      }
    };
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, []);

  if (!step) {
    return null;
  }
  const decision = decisions[selected];

  return (
    <>
      <PageBar
        crumbs={[
          { href: "/instructor", label: assignmentName },
          { href: "/instructor", label: "Submissions" },
          { label: student.name },
        ]}
        example
      >
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            <Icon name="export" />
            Export PDF
          </DialogTrigger>
          <DialogContent size="workspace">
            <DialogTitle className="sr-only">Export process report</DialogTitle>
            <ReportBuilder
              cancel={
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
              }
            />
          </DialogContent>
        </Dialog>
        <Button
          aria-pressed={reviewed}
          onClick={() => setReviewed((current) => !current)}
          variant={reviewed ? "outline" : "default"}
        >
          <Icon
            className={reviewed ? "text-success" : undefined}
            name="check"
          />
          {reviewed ? "Reviewed" : "Mark reviewed"}
          <Kbd>R</Kbd>
        </Button>
      </PageBar>

      <div className="flex-1 overflow-y-auto">
        <section className="flex flex-wrap items-start gap-x-3.5 gap-y-4 px-6 pt-4.5 pb-4 max-md:px-4">
          <Avatar className="animate-rise" name={student.name} size="lg" />
          <div className="animate-rise stagger min-w-0 flex-1 [--i:1]">
            <h1 className="text-title font-semibold">{student.name}</h1>
            <p className="text-muted-foreground mt-0.75 flex flex-wrap items-center gap-1.5">
              <span className="text-label font-mono">{student.id}</span>·
              <span>Submitted {student.submitted}</span>·
              <span>
                {steps.length} steps over{" "}
                {new Set(steps.map((item) => item.day)).size} days
              </span>
            </p>
            <p className="text-body mt-2 max-w-160 text-pretty">
              Caught an invented source, a wrong date and a misquoted statistic.
              Two late steps were accepted with little or no critique, and one
              of them reached the conclusion word for word.
            </p>
          </div>
          <div className="flex flex-wrap gap-y-3 pt-0.5">
            <Stat index={2} label="Not traced to logged AI">
              {formatPercent(summary.untraced)}
              <CompositionBar
                className="mt-2.25 w-42"
                traced={1 - summary.untraced}
              />
            </Stat>
            <Stat index={3} label="AI errors caught">
              {summary.caught}
            </Stat>
            <Stat index={4} label="Critique depth">
              {summary.depth.toFixed(1)}
              <small className="text-faint text-control font-book ml-0.5 tracking-normal">
                / 3
              </small>
            </Stat>
            <Stat className="text-flag" index={5} label="Flags">
              {summary.flags}
            </Stat>
          </div>
        </section>

        <Card className="mx-6 max-md:mx-4" entrance="fade" style={{ "--i": 3 }}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-3.5">
            <h2 className="text-ui font-heading">Process</h2>
            <ul className="text-muted-foreground flex flex-wrap gap-x-3.5 gap-y-1 text-xs">
              {[
                ["bg-ai-soft rounded-xs", "AI answer"],
                ["bg-ai rounded-xs", "Reached the essay"],
                ["bg-human rounded-xs", "Student critique"],
                ["bg-success rounded-full", "AI error caught"],
                ["bg-flag rounded-full", "Flagged"],
              ].map(([swatch, label]) => (
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
          <div className="overflow-x-auto px-4 pt-3 pb-2.5">
            <div className="min-w-180">
              <ProcessChart
                animate={animate}
                onHover={setHovered}
                onSelect={(index) => select(index, true)}
                selected={selected}
                steps={steps}
              />
            </div>
          </div>
        </Card>

        <div className="grid gap-3.5 px-6 pt-3.5 pb-6 max-md:px-4 lg:grid-cols-[minmax(0,1fr)_440px]">
          <Card entrance="fade" style={{ "--i": 5 }}>
            <CardHeader>
              <Icon name="essay" />
              <CardTitle>Final essay</CardTitle>
              <span className="text-faint text-label font-mono max-sm:hidden">
                {student.file} · {student.finalWords.toLocaleString("en")} words
              </span>
              <CardAction>
                {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- Base UI Switch renders the control inside the label */}
                <label className="flex cursor-pointer items-center gap-2.25">
                  Show AI-traced text
                  <Switch checked={traced} onCheckedChange={setTraced} />
                </label>
              </CardAction>
            </CardHeader>
            <div
              className="px-10 pt-4.5 pb-3 pl-18 max-sm:px-4 max-sm:pl-12"
              data-traced={traced || undefined}
            >
              {essay.map((paragraph, number) => (
                <p
                  className="text-read text-reading relative mb-3.5 font-serif text-pretty"
                  key={paragraph[0]?.text}
                >
                  <span className="text-border-strong text-micro absolute top-1 -left-13 font-mono max-sm:-left-9">
                    ¶{number + 1}
                  </span>
                  {paragraph.map((run) => {
                    if (run.step === undefined) {
                      return run.text;
                    }
                    const runStep = run.step;
                    const flagged = Boolean(steps[runStep]?.flag);
                    const hot = runStep === focus;
                    return (
                      <mark
                        className={cn(
                          "rounded-xs bg-transparent box-decoration-clone py-px text-inherit transition duration-160",
                          traced &&
                            (flagged
                              ? "bg-flag-soft/60 shadow-flagged"
                              : "bg-ai-wash shadow-traced"),
                          traced &&
                            hot &&
                            (flagged
                              ? "bg-flag-soft shadow-flagged-hot"
                              : "bg-ai-soft shadow-traced-hot")
                        )}
                        key={run.text}
                      >
                        <button
                          aria-label={`Open step ${runStep + 1}, ${steps[runStep]?.title ?? ""}`}
                          className={cn(
                            "text-micro absolute -left-7.5 mt-1 cursor-pointer rounded px-1 font-mono leading-4",
                            flagged
                              ? "bg-flag-soft text-flag-ink"
                              : "bg-ai-soft text-ai-ink",
                            !traced && "invisible"
                          )}
                          onClick={() => select(runStep, true)}
                          type="button"
                        >
                          S{runStep + 1}
                        </button>
                        {run.text}
                      </mark>
                    );
                  })}
                </p>
              ))}
            </div>
          </Card>

          <Card entrance="fade" style={{ "--i": 6 }}>
            <CardHeader>
              <span className="bg-muted shadow-hairline text-label rounded-sm px-1.5 font-mono leading-5">
                S{selected + 1}
              </span>
              <CardTitle>{step.title}</CardTitle>
              <CardAction>
                <Button
                  aria-label="Previous step"
                  onClick={() => select(selected - 1, true)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Icon name="left" />
                </Button>
                <Button
                  aria-label="Next step"
                  onClick={() => select(selected + 1, true)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Icon name="right" />
                </Button>
              </CardAction>
            </CardHeader>
            <div
              aria-live="polite"
              className={cn(
                "flex flex-col gap-3.5 px-4.5 py-3.5",
                animate && "animate-swap"
              )}
              key={selected}
            >
              {step.flag ? (
                <div
                  className={cn(
                    "rounded-lg px-3 py-2.75",
                    decision === "dismissed"
                      ? "bg-muted shadow-hairline"
                      : "bg-flag-soft shadow-flag-ring"
                  )}
                >
                  <div
                    className={cn(
                      "font-heading flex items-center gap-1.75",
                      decision === "dismissed"
                        ? "text-muted-foreground"
                        : "text-flag-ink"
                    )}
                  >
                    <Icon name="flag" />
                    {step.flag.title}
                    {decision ? (
                      <span className="text-label font-emphasis ml-auto">
                        {decision === "kept"
                          ? "Kept for feedback"
                          : "Dismissed"}
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "mt-0.75 mb-2.25 ml-5.75",
                      decision === "dismissed"
                        ? "text-muted-foreground"
                        : "text-flag-ink"
                    )}
                  >
                    {step.flag.body}
                  </p>
                  <div className="ml-5.75 flex items-center gap-1.5">
                    {decision ? (
                      <Button
                        onClick={() =>
                          setDecisions((current) =>
                            Object.fromEntries(
                              Object.entries(current).filter(
                                ([key]) => Number(key) !== selected
                              )
                            )
                          )
                        }
                        size="sm"
                        variant="outline"
                      >
                        Undo
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() =>
                            setDecisions((current) => ({
                              ...current,
                              [selected]: "dismissed",
                            }))
                          }
                          size="sm"
                          variant="outline"
                        >
                          Dismiss
                        </Button>
                        <Button
                          onClick={() =>
                            setDecisions((current) => ({
                              ...current,
                              [selected]: "kept",
                            }))
                          }
                          size="sm"
                        >
                          Keep flag
                        </Button>
                      </>
                    )}
                    <span className="text-flag-ink/60 text-label ml-auto">
                      Reflection check · suggested
                    </span>
                  </div>
                </div>
              ) : null}
              {step.caught ? (
                <div className="bg-success-soft text-success font-emphasis flex items-center gap-2 rounded-lg px-3 py-2.25">
                  <Icon name="caught" />
                  Student caught an AI error: {step.caught.toLowerCase()}
                </div>
              ) : null}
              <Field
                label="Asked"
                meta={<span className="font-mono">{step.time}</span>}
              >
                <p className="text-body">{step.asked}</p>
              </Field>
              <Field
                label="AI answered"
                meta={
                  <>
                    {step.words} words
                    {step.carried > 0 ? (
                      <span className="text-ai-ink">
                        {" "}
                        · {step.carried} reached the essay
                      </span>
                    ) : null}
                  </>
                }
              >
                <p className="text-body line-clamp-3">
                  <Answer segments={step.answer} />
                </p>
              </Field>
              <Field label="Critique" meta={`${step.critiqueWords} words`}>
                <blockquote
                  className={cn(
                    "text-reading text-lead border-l-2 pl-3 font-serif",
                    step.flag ? "border-flag" : "border-border-strong"
                  )}
                >
                  {step.critique}
                </blockquote>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {critiqueOrder.map((question) => {
                    const done = step.answered[question];
                    return (
                      <li
                        className={cn(
                          "flex h-6 items-center gap-1.5 rounded-full pr-2 pl-1.25 text-xs",
                          done
                            ? "bg-success-soft text-success"
                            : "text-muted-foreground shadow-hairline"
                        )}
                        key={question}
                      >
                        <span
                          className={cn(
                            "grid size-3.75 place-items-center rounded-full",
                            done ? "bg-card" : "bg-muted text-faint"
                          )}
                        >
                          <Icon
                            className="size-2.5"
                            name={done ? "check" : "x"}
                          />
                        </span>
                        {critiqueQuestions[question]}
                        <span className="sr-only">
                          {done ? "answered" : "not answered"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Field>
            </div>
            <div className="mt-auto flex items-center gap-2.5 border-t px-4.5 py-3">
              <Icon className="text-muted-foreground" name="note" />
              <Input
                aria-label={`Note for ${student.name} on this step`}
                className="h-8"
                placeholder={`Note for ${student.name.split(" ")[0]} on this step…`}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};
