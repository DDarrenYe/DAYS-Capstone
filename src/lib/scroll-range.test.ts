import assert from "node:assert/strict";
import { test } from "node:test";

import { parseRange, rangeProgress, splitTop } from "./scroll-range";

const view = (height: number, top: number) => ({ height, top, viewport: 900 });

const scroll = (position: number) => ({ max: 1000, position });

test("a range splits on top-level separators and keeps calc() whole", () => {
  assert.deepEqual(
    splitTop("contain 8% contain 45%, contain 38% contain 78%", /,/u),
    ["contain 8% contain 45%", "contain 38% contain 78%"]
  );
  assert.deepEqual(
    splitTop("entry calc(30% + 2 * 12%) entry calc(60% + 2 * 12%)", /\s/u),
    ["entry", "calc(30% + 2 * 12%)", "entry", "calc(60% + 2 * 12%)"]
  );
});

test("named, unnamed and empty ranges fill in the defaults", () => {
  assert.deepEqual(parseRange("entry 20% cover 50%"), [
    { name: "entry", offset: "20%" },
    { name: "cover", offset: "50%" },
  ]);
  assert.deepEqual(parseRange("0 96px"), [
    { name: "cover", offset: "0" },
    { name: "cover", offset: "96px" },
  ]);
  assert.deepEqual(parseRange("contain"), [
    { name: "contain", offset: "0%" },
    { name: "contain", offset: "100%" },
  ]);
  assert.deepEqual(parseRange(""), [
    { name: "cover", offset: "0%" },
    { name: "cover", offset: "100%" },
  ]);
});

test("entry runs from the subject's top edge entering to fully inside", () => {
  const start = { name: "entry", percent: 0 } as const;
  const end = { name: "entry", percent: 100 } as const;
  assert.equal(rangeProgress(start, end, view(200, 950)), 0);
  assert.equal(rangeProgress(start, end, view(200, 800)), 0.5);
  assert.equal(rangeProgress(start, end, view(200, 600)), 1);
});

test("contain on a subject taller than the viewport runs while it covers it", () => {
  const start = { name: "contain", percent: 0 } as const;
  const end = { name: "contain", percent: 100 } as const;
  assert.equal(rangeProgress(start, end, view(2900, 0)), 0);
  assert.equal(rangeProgress(start, end, view(2900, -1000)), 0.5);
  assert.equal(rangeProgress(start, end, view(2900, -2000)), 1);
});

test("a scroll range mixes pixels and a share of the scrollable height", () => {
  const header = [
    { name: "cover", px: 0 },
    { name: "cover", px: 96 },
  ] as const;
  assert.equal(rangeProgress(...header, scroll(48)), 0.5);
  const page = [
    { name: "cover", percent: 0 },
    { name: "cover", percent: 100 },
  ] as const;
  assert.equal(rangeProgress(...page, scroll(250)), 0.25);
});
