import assert from "node:assert/strict";
import { test } from "node:test";

import { csvCell, stepsCsv, stepsRows } from "./csv";
import { LONG_URL, detail } from "./export.fixture";

const parse = (csv: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let at = 0; at < csv.length; at += 1) {
    const char = csv.charAt(at);
    if (quoted) {
      if (char === '"' && csv.charAt(at + 1) === '"') {
        cell += '"';
        at += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\r" && csv.charAt(at + 1) === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      at += 1;
    } else {
      cell += char;
    }
  }
  return rows;
};

const none = { notes: false, prompts: false };

test("a cell that a spreadsheet would run as a formula starts with an apostrophe", () => {
  for (const start of ["=", "+", "-", "@", "\t", "\r", " =", "\n+"]) {
    const cell = csvCell(`${start}SUM(A1)`);
    assert.ok(cell.replace(/^"/u, "").startsWith(`'${start}`), start);
  }
});

test("a cell that is only text is left alone", () => {
  assert.equal(csvCell("Photosynthesis"), "Photosynthesis");
  assert.equal(csvCell("a = b"), "a = b");
  assert.equal(csvCell("2 - 1"), "2 - 1");
  assert.equal(csvCell(""), "");
});

test("a comma, a quote or a line break puts the cell in quotes and doubles its quotes", () => {
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("one\ntwo"), '"one\ntwo"');
  assert.equal(csvCell("=A1,2"), `"'=A1,2"`);
});

test("the file starts with a byte order mark and ends every line with CRLF", () => {
  const csv = stepsCsv(detail(), none);
  assert.ok(csv.startsWith("\uFEFFstudent,"));
  assert.ok(csv.endsWith("\r\n"));
  assert.equal(csv.split("\r\n").length, 6);
});

test("the step fields come in a fixed order with one row per step", () => {
  const [header, ...rows] = stepsRows(detail(), none);
  assert.deepEqual(header, [
    "student",
    "email",
    "course",
    "assignment",
    "check",
    "step",
    "logged_at",
    "title",
    "ai_words",
    "words_in_essay",
    "critique_words",
    "questions_answered",
    "ai_error_marked",
    "ai_error_evidence",
    "flags",
    "critique",
  ]);
  assert.deepEqual(
    rows.map((row) => row[5]),
    ["1", "2", "3", "4"]
  );
  for (const row of rows) {
    assert.equal(row.length, header?.length);
  }
});

test("prompt history and grader notes are columns only when asked for", () => {
  const [withPrompts] = stepsRows(detail(), { notes: false, prompts: true });
  assert.deepEqual(withPrompts?.slice(-3), ["critique", "prompt", "ai_answer"]);
  const [withNotes] = stepsRows(detail(), { notes: true, prompts: false });
  assert.ok(withNotes?.includes("flag_notes"));
  assert.ok(withNotes?.includes("grader_note"));
  const plain = stepsCsv(detail(), none);
  assert.equal(plain.includes("Check the cited source."), false);
  assert.equal(plain.includes("Raise in feedback."), false);
  assert.equal(plain.includes("grader_note"), false);
});

test("grader notes and decision notes appear when asked for", () => {
  const csv = stepsCsv(detail(), { notes: true, prompts: false });
  assert.ok(csv.includes("Check the cited source."));
  assert.ok(csv.includes("Raise in feedback."));
});

test("the file reads back to the same number of rows and cells, and no cell starts like a formula", () => {
  const options = { notes: true, prompts: true };
  const rows = stepsRows(detail(), options);
  const parsed = parse(stepsCsv(detail(), options));
  assert.equal(parsed.length, rows.length);
  for (const [index, row] of parsed.entries()) {
    assert.equal(row.length, rows[index]?.length);
  }
  for (const cell of parsed.flat()) {
    assert.equal(
      /^(?:\s*[=+\-@]|[\t\r])/u.test(cell.replace("\uFEFF", "")),
      false,
      cell
    );
  }
});

test("a long unbroken URL in a critique is kept whole", () => {
  const rows = parse(stepsCsv(detail(), none));
  const critique = rows[0]?.indexOf("critique") ?? -1;
  assert.equal(rows[3]?.[critique]?.includes(LONG_URL), true);
});

test("a prompt that starts with a plus sign is kept as text", () => {
  const rows = parse(stepsCsv(detail(), { notes: false, prompts: true }));
  const prompt = rows[0]?.indexOf("prompt") ?? -1;
  assert.equal(rows[4]?.[prompt], "'+1 and -2 and @cmd");
});

test("accents, macrons, other scripts and emoji survive", () => {
  const csv = stepsCsv(detail(), { notes: false, prompts: true });
  for (const text of [
    "Māia O’Brien",
    "Tāmaki Makaurau",
    "Ελληνικά",
    "Русский",
    "日本語のテキスト",
    "😀",
  ]) {
    assert.ok(csv.includes(text), text);
  }
});

test("a multi-line critique stays in one cell", () => {
  const rows = parse(stepsCsv(detail(), none));
  const critique = rows[0]?.indexOf("critique") ?? -1;
  assert.ok(rows[3]?.[critique]?.includes("Second line of the check."));
  assert.equal(rows.length, 5);
});
