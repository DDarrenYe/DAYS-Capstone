import { z } from "zod";

export const FORMATS = ["pdf", "csv"] as const;

export const EXPORT_SECTIONS = [
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
    hint: "Critique, questions answered and marks",
    key: "steps",
    label: "Every step in full",
  },
  {
    hint: "Prompt and AI answer of every step",
    key: "prompts",
    label: "Full prompt history",
  },
  {
    hint: "Evidence and decisions, including dismissed",
    key: "flags",
    label: "Flags",
  },
  {
    hint: "Your private notes and decision notes",
    key: "notes",
    label: "Grader notes",
  },
  {
    hint: "With AI-traced text highlighted",
    key: "essay",
    label: "Final essay",
  },
] as const;

export type ExportSection = (typeof EXPORT_SECTIONS)[number]["key"];

export type ExportSections = Record<ExportSection, boolean>;

export const DEFAULT_SECTIONS: ExportSections = {
  chart: true,
  essay: false,
  flags: true,
  notes: false,
  prompts: false,
  steps: true,
  summary: true,
};

const toggle = (key: ExportSection) =>
  z.stringbool().default(DEFAULT_SECTIONS[key]);

export const exportQuerySchema = z.object({
  chart: toggle("chart"),
  essay: toggle("essay"),
  flags: toggle("flags"),
  format: z.enum(FORMATS).default("pdf"),
  notes: toggle("notes"),
  project: z.guid(),
  prompts: toggle("prompts"),
  steps: toggle("steps"),
  summary: toggle("summary"),
});

const EXPORT_PATH = "/instructor/reports/export";

export const exportHref = (
  projectId: string,
  format: (typeof FORMATS)[number],
  sections: ExportSections
) =>
  `${EXPORT_PATH}?${new URLSearchParams({
    format,
    project: projectId,
    ...Object.fromEntries(
      Object.entries(sections).map(([key, on]) => [key, on ? "1" : "0"])
    ),
  })}`;
