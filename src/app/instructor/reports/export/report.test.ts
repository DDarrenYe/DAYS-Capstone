import assert from "node:assert/strict";
import { test } from "node:test";

import { isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

import { DEFAULT_SECTIONS } from "@/lib/export-options";
import type { ExportSections } from "@/lib/export-options";
import { matchCaveat, matchTotalsText } from "@/lib/match-copy";

import { detail } from "./export.fixture";
import { loadFonts, printable } from "./fonts";
import { Report } from "./report";

// oxlint-disable-next-line anti-slop/no-runtime-typeof -- an element type is either a host name or a component, and only a runtime check tells them apart
interface Props {
  children?: ReactNode;
}

type Component = (props: Props) => ReactNode;

const isComponent = (type: ReactElement["type"]): type is Component =>
  typeof type === "function";

const textOf = (node: ReactNode): string => {
  if (Array.isArray(node)) {
    return node.map(textOf).join("");
  }
  if (isValidElement<Props>(node)) {
    const { props, type } = node;
    return textOf(isComponent(type) ? type(props) : props.children);
  }
  return node === null || node === undefined || node === true || node === false
    ? ""
    : String(node);
};

const report = (sections: Partial<ExportSections> = {}, unshowable = false) =>
  textOf(
    Report({
      detail: detail(),
      generated: new Date("2026-10-15T10:00:00Z"),
      sections: { ...DEFAULT_SECTIONS, ...sections },
      unshowable,
    })
  );

const none: ExportSections = {
  chart: false,
  essay: false,
  flags: false,
  notes: false,
  prompts: false,
  steps: false,
  summary: false,
};

test("the report names the student, the course and the assignment", () => {
  const text = report(none);
  for (const expected of [
    "Māia O’Brien",
    "student@example.com",
    "INFOMGMT 399",
    "Capstone",
    "Essay 2",
  ]) {
    assert.ok(text.includes(expected), expected);
  }
});

test("the step overview is always there and lists every step", () => {
  const text = report(none);
  assert.ok(text.includes("Steps"));
  for (const prompt of [
    "Prompt 1",
    "Explain respiration",
    "+1 and -2 and @cmd",
  ]) {
    assert.ok(text.includes(prompt), prompt);
  }
});

test("the summary carries the share of matched text, the totals and the caveat", () => {
  const { match } = detail();
  const text = report({ summary: true });
  assert.ok(text.includes("Not from logged AI"));
  assert.ok(text.includes(`${match.unmatchedPercent}%`));
  assert.ok(text.includes(matchTotalsText(match)));
  assert.ok(text.includes(matchCaveat(match.minWords)));
  assert.ok(text.includes("AI errors the student marked (1)"));
  assert.ok(text.includes("They have not been checked."));
  assert.ok(text.includes("“mitochondria” — it is in the cytoplasm"));
});

test("each toggle adds its own section and nothing else", () => {
  const headings = {
    chart: "Reached the essay",
    essay: "Final essay",
    flags: "Flags and decisions",
    notes: "Grader notes",
    prompts: "Full prompt history",
    steps: "Every step in full",
    summary: "Not from logged AI",
  } as const;
  for (const [section] of Object.entries(headings)) {
    const text = report({ ...none, [section]: true });
    for (const [other, heading] of Object.entries(headings)) {
      assert.equal(
        text.includes(heading),
        other === section,
        `${section} on, looking for ${other}`
      );
    }
  }
});

test("flag evidence and every decision appear with the flags", () => {
  const text = report({ flags: true });
  for (const expected of [
    "Thin critique",
    "“Done.”",
    "The critique says too little.",
    "Open",
    "Dismissed",
    "Added to feedback",
    "Reflection check · suggested",
  ]) {
    assert.ok(text.includes(expected), expected);
  }
});

test("private notes stay out of the report unless the grader picks them", () => {
  for (const text of [report(), report({ flags: true, prompts: true })]) {
    assert.equal(text.includes("Check the cited source."), false);
    assert.equal(text.includes("@SUM(A1:A2) is how they cite."), false);
    assert.equal(text.includes("Decision note"), false);
    assert.equal(text.includes("Raise in feedback."), false);
  }
  const withNotes = report({ notes: true });
  assert.ok(withNotes.includes("Check the cited source."));
  assert.ok(withNotes.includes("@SUM(A1:A2) is how they cite."));
  assert.ok(withNotes.includes("Decision note: Raise in feedback."));
});

test("prompts and full AI answers only come with the prompt history", () => {
  const without = report();
  assert.equal(without.includes("AI answered"), false);
  assert.equal(without.includes("Sentence 90 explains"), false);
  const prompts = report({ prompts: true });
  assert.ok(prompts.includes("AI answered"));
  assert.ok(prompts.includes("Sentence 90 explains"));
  assert.ok(prompts.includes("Kia ora — explain “mana whenua” & whakapapa"));
});

test("the final essay is highlighted with the step each match came from", () => {
  const text = report({ essay: true });
  assert.ok(text.includes("Photosynthesis converts light energy"));
  assert.ok(text.includes("S1 "));
  assert.ok(text.includes("My own closing thought here."));
});

test("the critique is quoted with the questions it answered", () => {
  const text = report({ steps: true });
  assert.ok(text.includes("Was the AI right or wrong? Partly right"));
  assert.ok(text.includes("Right or wrong: answered"));
});

test("the notice about unshowable text only appears when it applies", () => {
  assert.equal(report({}, false).includes("can’t show"), false);
  assert.ok(report({}, true).includes("can’t show"));
});

test("text the font cannot draw becomes a question mark and the rest is kept", async () => {
  await loadFonts();
  assert.equal(
    printable("Māori Ελληνικά Русский Tiếng Việt"),
    "Māori Ελληνικά Русский Tiếng Việt"
  );
  assert.equal(printable("Aroha 日本語"), "Aroha ???");
  assert.equal(printable("ok 😀"), "ok ?");
  assert.equal(printable("a\u200Bb"), "ab");
});
