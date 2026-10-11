import { strict as assert } from "node:assert";
import { test } from "node:test";

import { cn } from "./utils";

test("themed font sizes and colours merge independently", () => {
  assert.equal(cn("text-body text-meta"), "text-body text-meta");
  assert.equal(
    cn("text-body text-meta", "text-ai-ink text-ui"),
    "text-ai-ink text-ui"
  );
  assert.equal(
    cn("hover:text-body hover:text-meta", "hover:text-ai-ink"),
    "hover:text-meta hover:text-ai-ink"
  );
});

test("themed shape, weight and motion utilities respect overrides", () => {
  assert.equal(cn("rounded-xl", "rounded-full"), "rounded-full");
  assert.equal(cn("shadow-hairline", "shadow-lg"), "shadow-lg");
  assert.equal(cn("font-heading", "font-bold"), "font-bold");
  assert.equal(cn("tracking-snug", "tracking-normal"), "tracking-normal");
  assert.equal(cn("animate-rise", "animate-none"), "animate-none");
});

test("standard utilities retain conditional and responsive merging", () => {
  assert.equal(cn("px-2 py-1", false, { "px-4": true }), "py-1 px-4");
  assert.equal(cn("p-4 max-md:p-2", "max-md:p-6"), "p-4 max-md:p-6");
});

test("compound typography keeps its line-height when overridden", () => {
  assert.equal(
    cn("text-body text-label/relaxed", "text-ui/relaxed"),
    "text-body text-ui/relaxed"
  );
  assert.equal(cn("text-xs", "text-sm/snug"), "text-sm/snug");
});
