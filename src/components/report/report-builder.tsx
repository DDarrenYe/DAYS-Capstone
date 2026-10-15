"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/components/icon";
import { ProcessBars } from "@/components/process/process-bars";
import { Logo } from "@/components/shell/brand";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  cohort,
  essay,
  assignmentName,
  steps,
  student,
  summary,
} from "@/lib/example-data";
import { formatPercent } from "@/lib/process";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    hint: "Traced share, errors caught, depth",
    key: "summary",
    label: "Summary and figures",
  },
  {
    hint: "AI words against critique, by step",
    key: "chart",
    label: "Process chart",
  },
  {
    hint: "Prompt, answer, critique and marks",
    key: "steps",
    label: "Every step in full",
  },
  {
    hint: "Including dismissed flags",
    key: "flags",
    label: "Flags and your notes",
  },
  {
    hint: "With AI-traced text highlighted",
    key: "essay",
    label: "Final essay",
  },
] as const;

type Section = (typeof SECTIONS)[number]["key"];

const pageCount = (on: Record<Section, boolean>) =>
  1 + Number(on.steps) + Number(on.flags) + Number(on.essay);

const Figure = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="border-l py-3 pl-4 first:border-l-0 first:pl-0">
    <span className="text-muted-foreground block">{label}</span>
    <b className="text-foreground font-heading tracking-title mt-0.5 block text-2xl">
      {children}
    </b>
  </div>
);

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-muted-foreground mt-7 mb-3 text-xs font-semibold tracking-wider uppercase">
    {children}
  </h2>
);

/* A real A4 page at 96 dpi. The preview shows it at 60%; printing uses it at full size. */
const ReportPage = ({ on }: { on: Record<Section, boolean> }) => (
  <div className="mx-auto h-168.5 w-119 shrink-0">
    <article
      aria-label={`Preview of page 1 of ${pageCount(on)}`}
      className="shadow-page text-body relative h-280.75 w-198.5 origin-top-left scale-60 overflow-hidden rounded-xs bg-white px-16 pt-14 text-sm"
      data-report-page
    >
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Logo className="size-5" />
        <span>Pentimento · Process report</span>
        <span className="ml-auto font-mono">INFOMGMT 399 · Essay 2</span>
      </div>
      <h1 className="text-foreground tracking-snug mt-9 font-serif text-4xl leading-tight font-medium">
        {student.name}
      </h1>
      <p className="text-muted-foreground mt-1.5">
        {student.id} · Submitted {student.submitted} 2026
      </p>
      {on.summary ? (
        <>
          <p className="text-reading mt-5 font-serif text-base leading-relaxed">
            Caught an invented source, a wrong date and a misquoted statistic.
            Two late steps were accepted with little or no critique, and one of
            them reached the conclusion word for word.
          </p>
          <div className="mt-6 grid grid-cols-4 border-y">
            <Figure label="Not traced to AI">
              {formatPercent(summary.untraced)}
            </Figure>
            <Figure label="Errors caught">{summary.caught}</Figure>
            <Figure label="Critique depth">
              {summary.depth.toFixed(1)} / 3
            </Figure>
            <Figure label="Flags">
              <span className="text-flag">{summary.flags}</span>
            </Figure>
          </div>
        </>
      ) : null}
      {on.chart ? (
        <>
          <SectionTitle>Process</SectionTitle>
          <ProcessBars
            base={84}
            height={124}
            labels
            steps={steps}
            width={666}
          />
        </>
      ) : null}
      <SectionTitle>Steps</SectionTitle>
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-6" />
          <col className="w-44" />
          <col />
          <col className="w-48" />
        </colgroup>
        <tbody>
          {steps.map((step, index) => (
            <tr className="border-b *:truncate *:py-2" key={step.title}>
              <td className="text-faint font-mono">{index + 1}</td>
              <td className="text-foreground">{step.title}</td>
              <td className="text-reading text-lead pr-2 font-serif">
                {step.critique}
              </td>
              <td
                className={cn(
                  "font-heading",
                  step.flag ? "text-flag" : "text-success"
                )}
              >
                {step.flag?.title ?? step.caught}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-faint text-label absolute inset-x-16 bottom-9 flex justify-between font-mono">
        <span>Generated Sun 12 Oct 2026</span>
        <span>1 / {pageCount(on)}</span>
      </div>
    </article>
  </div>
);

const Thumbnail = ({ index, on }: { index: number; on: boolean }) => (
  <li className="relative">
    <div
      className={cn(
        "flex h-34 w-24 flex-col gap-1 rounded-xs bg-white px-2.25 py-2.5 shadow-xs",
        on && "ring-foreground ring-2"
      )}
    >
      <i className="bg-border-strong mb-0.75 block h-1.5 w-7/10 rounded-sm" />
      {essay.slice(0, 4 + (index % 3)).map((paragraph, line) => (
        <i
          className={cn(
            "bg-border block h-0.75 rounded-sm",
            line === index + 1 && "bg-ai-soft",
            line === 4 - index && "bg-flag-soft"
          )}
          key={paragraph[0]?.text}
        />
      ))}
    </div>
    <span className="text-muted-foreground text-micro mt-1 block text-center font-mono">
      {index + 1}
    </span>
  </li>
);

export const ReportBuilder = ({ cancel }: { cancel?: ReactNode }) => {
  const [on, setOn] = useState<Record<Section, boolean>>({
    chart: true,
    essay: false,
    flags: true,
    steps: true,
    summary: true,
  });
  const [who, setWho] = useState("one");
  const whoLabel = useId();
  const pages = pageCount(on);
  return (
    <div className="grid min-h-0 flex-1 md:grid-cols-[340px_minmax(0,1fr)]">
      <div className="flex flex-col p-5.5 md:border-r">
        <h2 className="tracking-snug text-base font-semibold">
          Export process report
        </h2>
        <p className="text-muted-foreground mt-0.75">
          {student.name} · {assignmentName} · {steps.length} steps
        </p>
        <fieldset className="mt-5.5">
          <legend className="text-label text-muted-foreground font-emphasis mb-2">
            Include
          </legend>
          {SECTIONS.map((section) => (
            // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- Base UI Switch renders the control inside the label
            <label
              className="flex cursor-pointer items-center gap-2.5 border-t py-2.25 first-of-type:border-t-0"
              key={section.key}
            >
              <span className="flex-1">
                <b className="block font-medium">{section.label}</b>
                <span className="text-muted-foreground block text-xs">
                  {section.hint}
                </span>
              </span>
              <Switch
                checked={on[section.key]}
                onCheckedChange={(checked) =>
                  setOn((current) => ({ ...current, [section.key]: checked }))
                }
              />
            </label>
          ))}
        </fieldset>
        <div className="mt-5.5">
          <span
            className="text-label text-muted-foreground font-emphasis mb-2 block"
            id={whoLabel}
          >
            Who
          </span>
          <RadioGroup
            aria-labelledby={whoLabel}
            onValueChange={(value) => setWho(String(value))}
            value={who}
          >
            {[
              {
                hint: `One PDF · ${pages} ${pages === 1 ? "page" : "pages"}`,
                label: student.name,
                value: "one",
              },
              {
                hint: "A zip of PDFs plus a cohort summary",
                label: `All ${cohort.length} submissions`,
                value: "all",
              },
            ].map((option) => (
              // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- Base UI Radio renders the control inside the label
              <label
                className={cn(
                  "shadow-hairline flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5",
                  who === option.value && "shadow-chosen"
                )}
                key={option.value}
              >
                <RadioGroupItem className="mt-px" value={option.value} />
                <span>
                  <b className="block font-medium">{option.label}</b>
                  <span className="text-muted-foreground text-xs">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>
        <div className="mt-auto flex justify-end gap-2 pt-4">
          {cancel}
          <Button onClick={() => globalThis.print()}>
            <Icon name="export" />
            Print or save as PDF
          </Button>
        </div>
      </div>
      <div className="bg-well flex min-w-0 gap-5 overflow-auto px-6 py-7 max-md:hidden">
        <div className="flex-1">
          <ReportPage on={on} />
        </div>
        <ol aria-label="Pages" className="flex flex-col gap-3 pt-8">
          {Array.from({ length: pages }, (_, index) => (
            <Thumbnail
              index={index}
              key={`page-${index + 1}`}
              on={index === 0}
            />
          ))}
        </ol>
      </div>
    </div>
  );
};
