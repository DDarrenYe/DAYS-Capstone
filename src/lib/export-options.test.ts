import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_SECTIONS,
  EXPORT_SECTIONS,
  exportHref,
  exportQuerySchema,
} from "./export-options";

const PROJECT = "40000000-0000-0000-0000-000000000002";

const parse = (query: Record<string, string>) =>
  exportQuerySchema.safeParse({ project: PROJECT, ...query });

test("a bare request is a PDF with the default sections", () => {
  const result = parse({});
  assert.ok(result.success);
  assert.equal(result.data.format, "pdf");
  const { format: _format, project: _project, ...sections } = result.data;
  assert.deepEqual(sections, DEFAULT_SECTIONS);
});

test("prompt history, grader notes and the essay are off unless asked for", () => {
  assert.equal(DEFAULT_SECTIONS.prompts, false);
  assert.equal(DEFAULT_SECTIONS.notes, false);
  assert.equal(DEFAULT_SECTIONS.essay, false);
});

test("a toggle takes a yes or a no and anything else is refused", () => {
  for (const yes of ["1", "true", "on", "yes"]) {
    assert.equal(parse({ notes: yes }).data?.notes, true, yes);
  }
  for (const no of ["0", "false", "off", "no"]) {
    assert.equal(parse({ summary: no }).data?.summary, false, no);
  }
  for (const wrong of ["maybe", "2", "", "null"]) {
    assert.equal(parse({ notes: wrong }).success, false, wrong);
  }
});

test("the format is pdf or csv", () => {
  assert.equal(parse({ format: "csv" }).data?.format, "csv");
  assert.equal(parse({ format: "docx" }).success, false);
  assert.equal(parse({ format: "PDF" }).success, false);
});

test("the project has to be a UUID", () => {
  assert.equal(exportQuerySchema.safeParse({}).success, false);
  assert.equal(exportQuerySchema.safeParse({ project: "nope" }).success, false);
  assert.equal(
    exportQuerySchema.safeParse({ project: `${PROJECT}'; drop table` }).success,
    false
  );
});

test("the link the builder makes is read back as the same options", () => {
  const sections = { ...DEFAULT_SECTIONS, notes: true, summary: false };
  const url = new URL(exportHref(PROJECT, "csv", sections), "https://x.test");
  assert.equal(url.pathname, "/instructor/reports/export");
  const result = exportQuerySchema.safeParse(
    Object.fromEntries(url.searchParams)
  );
  assert.ok(result.success);
  assert.equal(result.data.format, "csv");
  assert.equal(result.data.project, PROJECT);
  assert.equal(result.data.notes, true);
  assert.equal(result.data.summary, false);
  assert.equal(result.data.flags, true);
});

test("every section the builder lists is an option the server knows", () => {
  const known = Object.keys(exportQuerySchema.shape);
  for (const { key } of EXPORT_SECTIONS) {
    assert.ok(known.includes(key), key);
  }
  assert.deepEqual(
    Object.keys(DEFAULT_SECTIONS).toSorted(),
    EXPORT_SECTIONS.map(({ key }) => key).toSorted()
  );
});
