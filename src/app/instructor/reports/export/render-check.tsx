import { DEFAULT_SECTIONS } from "@/lib/export-options";
import type { ExportSections } from "@/lib/export-options";

import { detail, project } from "./export.fixture";
import { renderReport } from "./report";
import { exportResponse } from "./respond";

const PROJECT = "40000000-0000-0000-0000-000000000002";

const generated = new Date("2026-10-15T10:00:00Z");

const pageCount = (pdf: Uint8Array) =>
  (
    Buffer.from(pdf)
      .toString("latin1")
      .match(/\/Type \/Page(?![a-z])/gu) ?? []
  ).length;

const none: ExportSections = {
  chart: false,
  essay: false,
  flags: false,
  notes: false,
  prompts: false,
  steps: false,
  summary: false,
};

const pages = async (
  sections: ExportSections,
  overrides: Parameters<typeof detail>[0] = {}
) => {
  const pdf = await renderReport({
    detail: detail(overrides),
    generated,
    sections,
  });
  return {
    count: pageCount(pdf),
    head: Buffer.from(pdf).toString("latin1", 0, 5),
  };
};

const [first] = project().iterations;

const short = await pages(none, {
  analysis_results: [],
  grader_notes: [],
  iterations: first ? [first] : [],
});
const minimal = await pages(none);
const standard = await pages(DEFAULT_SECTIONS);
const prompts = await pages({ ...DEFAULT_SECTIONS, prompts: true });
const everything = await pages({
  ...DEFAULT_SECTIONS,
  essay: true,
  notes: true,
  prompts: true,
});

const response = await exportResponse({
  account: { id: "instructor-1", role: "instructor" },
  generated,
  load: () => Promise.resolve(project()),
  params: new URLSearchParams({ format: "pdf", project: PROJECT }),
});
const body = new Uint8Array(await response.arrayBuffer());

process.stdout.write(
  JSON.stringify({
    everything: everything.count,
    head: everything.head,
    minimal: minimal.count,
    prompts: prompts.count,
    response: {
      bodyPages: pageCount(body),
      cache: response.headers.get("cache-control"),
      disposition: response.headers.get("content-disposition"),
      status: response.status,
      type: response.headers.get("content-type"),
    },
    short: short.count,
    standard: standard.count,
  })
);
