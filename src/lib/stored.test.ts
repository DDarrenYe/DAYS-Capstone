import { strict as assert } from "node:assert";
import { test } from "node:test";

import { z } from "zod";

import { parseStored, withEntry } from "./stored";

const schema = z.record(z.string(), z.enum(["kept", "dismissed"]));
const fallback = {};

test("parseStored returns stored values that match the schema", () => {
  assert.deepEqual(parseStored('{"John Doe-6":"kept"}', schema, fallback), {
    "John Doe-6": "kept",
  });
});

test("parseStored falls back for missing, malformed or hand-edited values", () => {
  assert.equal(parseStored(null, schema, fallback), fallback);
  assert.equal(parseStored("{not json", schema, fallback), fallback);
  assert.equal(
    parseStored('{"John Doe-6":"deleted"}', schema, fallback),
    fallback
  );
  assert.equal(parseStored("42", schema, fallback), fallback);
});

test("withEntry sets, replaces and removes one key without touching the rest", () => {
  const start = { "John Doe-6": "kept", "Hana Kim-2": "dismissed" };
  assert.deepEqual(withEntry(start, "John Doe-6", "dismissed"), {
    "Hana Kim-2": "dismissed",
    "John Doe-6": "dismissed",
  });
  assert.deepEqual(withEntry(start, "John Doe-6"), {
    "Hana Kim-2": "dismissed",
  });
  assert.deepEqual(start, { "Hana Kim-2": "dismissed", "John Doe-6": "kept" });
});
