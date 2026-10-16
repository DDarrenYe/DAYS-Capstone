import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";

const probe = JSON.parse(
  execFileSync(
    process.execPath,
    [path.join(import.meta.dirname, "render-check.tsx")],
    { cwd: process.cwd(), encoding: "utf-8", timeout: 120_000 }
  )
);

test("the renderer writes a PDF", () => {
  assert.equal(probe.head, "%PDF-");
});

test("a short submission fits one page", () => {
  assert.equal(probe.short, 1);
});

test("long text flows onto more pages instead of running off the page", () => {
  assert.ok(probe.standard >= 2, `standard ${probe.standard}`);
  assert.ok(probe.prompts > probe.standard, `prompts ${probe.prompts}`);
  assert.ok(
    probe.everything >= probe.prompts,
    `everything ${probe.everything}`
  );
  assert.ok(probe.everything >= 4, `everything ${probe.everything}`);
});

test("turning sections off makes a shorter report", () => {
  assert.ok(probe.minimal < probe.standard, `minimal ${probe.minimal}`);
});

test("the download carries a PDF with the right headers", () => {
  assert.equal(probe.response.status, 200);
  assert.equal(probe.response.type, "application/pdf");
  assert.equal(
    probe.response.disposition,
    'attachment; filename="maia-o-brien-essay-2.pdf"'
  );
  assert.equal(probe.response.cache, "private, no-store");
  assert.ok(probe.response.bodyPages >= 1);
});
