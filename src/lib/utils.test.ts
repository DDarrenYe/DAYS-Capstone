import { strict as assert } from "node:assert";
import { test } from "node:test";

import { cn } from "./utils";

test("themed font sizes and colours merge independently", () => {
  assert.equal(cn("text-body text-caption"), "text-body text-caption");
  assert.equal(
    cn("text-body text-caption", "text-ai-ink text-ui"),
    "text-ai-ink text-ui"
  );
  assert.equal(
    cn("hover:text-body hover:text-caption", "hover:text-ai-ink"),
    "hover:text-caption hover:text-ai-ink"
  );
});

test("themed shape and motion utilities respect overrides", () => {
  assert.equal(cn("rounded-navigation", "rounded-full"), "rounded-full");
  assert.equal(cn("shadow-lift", "shadow-lg"), "shadow-lg");
  assert.equal(cn("leading-paper", "leading-normal"), "leading-normal");
  assert.equal(cn("tracking-kicker", "tracking-normal"), "tracking-normal");
  assert.equal(cn("animate-note-in", "animate-none"), "animate-none");
});

test("standard utilities retain conditional and responsive merging", () => {
  assert.equal(cn("px-2 py-1", false, { "px-4": true }), "py-1 px-4");
  assert.equal(cn("p-4 max-md:p-2", "max-md:p-6"), "p-4 max-md:p-6");
});

test("compound typography keeps its line-height when overridden", () => {
  assert.equal(
    cn("text-body text-caption/paper", "text-ui/paper"),
    "text-body text-ui/paper"
  );
  assert.equal(cn("text-xs", "text-sm/badge"), "text-sm/badge");
});
