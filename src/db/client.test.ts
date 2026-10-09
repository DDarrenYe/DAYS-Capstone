import assert from "node:assert/strict";
import { test } from "node:test";

import { getDb } from "./client";
import { projects } from "./schema";

test("database access requires configuration and reuses the typed server client", () => {
  const originalUrl = process.env.DATABASE_URL;
  try {
    delete process.env.DATABASE_URL;
    assert.throws(getDb, /DATABASE_URL is required/u);

    process.env.DATABASE_URL =
      "postgresql://postgres:postgres@127.0.0.1:1/postgres";
    const database = getDb();
    assert.equal(getDb(), database);
    const query = database
      .select({ id: projects.id })
      .from(projects)
      .limit(1)
      .toSQL();
    assert.match(query.sql, /select "id" from "projects"/u);
    assert.deepEqual(query.params, [1]);
  } finally {
    if (originalUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalUrl;
    }
  }
});
