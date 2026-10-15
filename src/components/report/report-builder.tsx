"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";

import { stepsRows } from "@/app/instructor/reports/export/csv";
import type { SubmissionDetail } from "@/app/instructor/visualiser/submission-detail";
import { Icon } from "@/components/icon";
import { ProcessBars } from "@/components/process/process-bars";
import { Logo } from "@/components/shell/brand";
import { buttonVariants } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_SECTIONS,
  EXPORT_SECTIONS,
  FORMATS,
  exportHref,
} from "@/lib/export-options";
import type { ExportSection, ExportSections } from "@/lib/export-options";
import { matchTotalsText } from "@/lib/match-copy";
import { critiqueOrder } from "@/lib/process";
import { hasCheckResults } from "@/lib/submission-rows";
import { cn } from "@/lib/utils";

const FORMAT_OPTIONS = [
  { hint: "Readable pages for moderation", label: "PDF report", value: "pdf" },
  {
    hint: "One row per step, for a spreadsheet",
    label: "CSV of every step",
    value: "csv",
  },
] as const;

type Format = (typeof FORMAT_OPTIONS)[number]["value"];

const CSV_SECTIONS: ReadonlySet<ExportSection> = new Set(["prompts", "notes"]);

const PREVIEW_ROWS = 4;

const PREVIEW_STEPS = 8;

const Figure = ({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) => (
  <div className="border-l py-3 pl-4 first:border-l-0 first:pl-0">
    <span className="text-muted-foreground block">{label}</span>
    <b className="text-foreground font-heading tracking-title mt-0.5 block text-2xl">
      {children}
    </b>
  </div>
);

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="text-muted-foreground mt-7 mb-3 text-xs font-semibold tracking-wider uppercase">
    {children}
  </h3>
);

const ReportPage = ({
  detail,
  sections,
}: {
  detail: SubmissionDetail;
  sections: ExportSections;
}) => {
  const results = hasCheckResults(detail);
  const later = EXPORT_SECTIONS.filter(
    ({ key }) => sections[key] && !["chart", "summary"].includes(key)
  ).map(({ label }) => label);
  return (
    <div className="mx-auto h-168.5 w-119 shrink-0">
      <article
        aria-label="Preview of page 1"
        className="shadow-page text-body relative h-280.75 w-198.5 origin-top-left scale-60 overflow-hidden rounded-xs bg-white px-16 pt-14 text-sm"
      >
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Logo className="size-5" />
          <span>Pentimento · Process report</span>
          <span className="ml-auto font-mono">
            {detail.assignment.course.code} · {detail.assignment.title}
          </span>
        </div>
        <h1 className="text-foreground tracking-snug mt-9 font-serif text-4xl leading-tight font-medium">
          {detail.name}
        </h1>
        <p className="text-muted-foreground mt-1.5">
          {detail.email} · Submitted {detail.submitted}
        </p>
        {sections.summary ? (
          <>
            <div className="mt-6 grid grid-cols-5 border-y">
              <Figure label="Not from logged AI">
                {detail.match.unmatchedPercent === null
                  ? "—"
                  : `${detail.match.unmatchedPercent}%`}
              </Figure>
              <Figure label="AI errors marked">{detail.markedErrors}</Figure>
              <Figure label="Critique questions">
                {detail.critiqueAverage.toFixed(1)} / {critiqueOrder.length}
              </Figure>
              <Figure label="Open flags">
                <span
                  className={detail.openFlags > 0 ? "text-flag" : undefined}
                >
                  {results ? detail.openFlags : "—"}
                </span>
              </Figure>
              <Figure label="Added to feedback">
                {results ? detail.feedbackFlags : "—"}
              </Figure>
            </div>
            {detail.match.totalWords === 0 ? null : (
              <p className="text-reading mt-4 font-serif text-base leading-relaxed">
                {matchTotalsText(detail.match)}
              </p>
            )}
          </>
        ) : null}
        {sections.chart ? (
          <>
            <SectionTitle>Process</SectionTitle>
            <ProcessBars
              base={84}
              height={124}
              labels
              steps={detail.steps}
              width={666}
            />
          </>
        ) : null}
        <SectionTitle>Steps</SectionTitle>
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-8" />
            <col />
            <col className="w-20" />
            <col className="w-40" />
          </colgroup>
          <tbody>
            {detail.steps.slice(0, PREVIEW_STEPS).map((step, index) => (
              <tr className="border-b *:truncate *:py-2" key={step.id}>
                <td className="text-faint font-mono">{index + 1}</td>
                <td className="text-foreground pr-2">{step.title}</td>
                <td className="text-muted-foreground">
                  {step.words.toLocaleString("en")} words
                </td>
                <td
                  className={cn(
                    "font-heading",
                    step.flag ? "text-flag" : "text-muted-foreground"
                  )}
                >
                  {step.flag ?? (step.markedError ? "AI error marked" : "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {detail.steps.length > PREVIEW_STEPS ? (
          <p className="text-faint mt-2 font-mono text-xs">
            + {detail.steps.length - PREVIEW_STEPS} more steps
          </p>
        ) : null}
        {later.length > 0 ? (
          <p className="text-muted-foreground mt-6 text-xs">
            Continues with: {later.join(", ")}.
          </p>
        ) : null}
        <p className="text-faint text-label absolute inset-x-16 bottom-9 font-mono">
          First page of the PDF
        </p>
      </article>
    </div>
  );
};

const CsvPreview = ({
  detail,
  sections,
}: {
  detail: SubmissionDetail;
  sections: ExportSections;
}) => {
  const [header, ...rows] = stepsRows(detail, sections);
  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-muted-foreground mb-3">
        {rows.length} {rows.length === 1 ? "row" : "rows"}, one per step, with{" "}
        {header?.length} columns. Text that a spreadsheet could run as a formula
        starts with an apostrophe.
      </p>
      <div className="bg-card shadow-hairline overflow-x-auto rounded-lg">
        <table className="text-meta w-max border-collapse font-mono">
          <thead>
            <tr>
              {header?.map((cell) => (
                <th
                  className="text-muted-foreground border-b px-2.5 py-2 text-left font-medium"
                  key={cell}
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, PREVIEW_ROWS).map((row) => (
              <tr key={row[5]}>
                {row.map((cell, column) => (
                  <td
                    className="max-w-48 truncate border-b px-2.5 py-1.5"
                    // oxlint-disable-next-line react/no-array-index-key -- columns are positional and never reorder
                    key={column}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > PREVIEW_ROWS ? (
        <p className="text-faint mt-2 font-mono text-xs">
          + {rows.length - PREVIEW_ROWS} more rows
        </p>
      ) : null}
    </div>
  );
};

export const ReportBuilder = ({
  cancel,
  detail,
  inDialog = false,
}: {
  cancel?: ReactNode;
  detail: SubmissionDetail;
  inDialog?: boolean;
}) => {
  const [sections, setSections] = useState<ExportSections>(DEFAULT_SECTIONS);
  const [format, setFormat] = useState<Format>("pdf");
  const formatLabel = useId();
  const Title = inDialog ? DialogTitle : "h2";
  return (
    <div className="grid min-h-0 flex-1 md:grid-cols-[340px_minmax(0,1fr)]">
      <div className="flex flex-col overflow-y-auto p-5.5 md:border-r">
        <Title className="tracking-snug text-base font-semibold">
          Export process report
        </Title>
        <p className="text-muted-foreground mt-0.75">
          {detail.name} · {detail.assignment.title} · {detail.steps.length}{" "}
          {detail.steps.length === 1 ? "step" : "steps"}
        </p>
        <div className="mt-5.5">
          <span
            className="text-label text-muted-foreground font-emphasis mb-2 block"
            id={formatLabel}
          >
            Format
          </span>
          <RadioGroup
            aria-labelledby={formatLabel}
            onValueChange={(value) =>
              setFormat(FORMATS.find((item) => item === value) ?? "pdf")
            }
            value={format}
          >
            {FORMAT_OPTIONS.map((option) => (
              // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- Base UI Radio renders the control inside the label
              <label
                className={cn(
                  "shadow-hairline flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5",
                  format === option.value && "shadow-chosen"
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
        <fieldset className="mt-5.5">
          <legend className="text-label text-muted-foreground font-emphasis mb-2">
            Include
          </legend>
          {EXPORT_SECTIONS.map((section) => {
            const unused = format === "csv" && !CSV_SECTIONS.has(section.key);
            return (
              // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- Base UI Switch renders the control inside the label
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 border-t py-2.25 first-of-type:border-t-0",
                  unused && "cursor-not-allowed opacity-50"
                )}
                key={section.key}
              >
                <span className="flex-1">
                  <b className="block font-medium">{section.label}</b>
                  <span className="text-muted-foreground block text-xs">
                    {section.hint}
                  </span>
                </span>
                <Switch
                  checked={sections[section.key]}
                  disabled={unused}
                  onCheckedChange={(checked) =>
                    setSections((current) => ({
                      ...current,
                      [section.key]: checked,
                    }))
                  }
                />
              </label>
            );
          })}
        </fieldset>
        <div className="mt-auto flex justify-end gap-2 pt-4">
          {cancel}
          <a
            className={buttonVariants()}
            download
            href={exportHref(detail.id, format, sections)}
          >
            <Icon name="export" />
            Download {format === "pdf" ? "PDF" : "CSV"}
          </a>
        </div>
      </div>
      <div className="bg-well flex min-w-0 items-start overflow-auto px-6 py-7 max-md:hidden">
        <div className="min-w-0 flex-1">
          {format === "pdf" ? (
            <ReportPage detail={detail} sections={sections} />
          ) : (
            <CsvPreview detail={detail} sections={sections} />
          )}
        </div>
      </div>
    </div>
  );
};
