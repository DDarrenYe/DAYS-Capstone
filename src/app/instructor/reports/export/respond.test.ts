import assert from "node:assert/strict";
import { test } from "node:test";

import { detail, project } from "./export.fixture";
import { exportResponse, fileBase } from "./respond";

const PROJECT = "40000000-0000-0000-0000-000000000002";

const instructor = { id: "instructor-1", role: "instructor" } as const;
const student = { id: "student-1", role: "student" } as const;

const answer = async (
  account: Parameters<typeof exportResponse>[0]["account"],
  query: Record<string, string> = {},
  found: ReturnType<typeof project> | null = project()
) => {
  const loaded: string[][] = [];
  const response = await exportResponse({
    account,
    load: (accountId, projectId) => {
      loaded.push([accountId, projectId]);
      return Promise.resolve(found);
    },
    params: new URLSearchParams({ project: PROJECT, ...query }),
  });
  return {
    body: await response.text(),
    headers: response.headers,
    loaded,
    status: response.status,
  };
};

test("a request with no session is refused before anything is read", async () => {
  const result = await answer(null);
  assert.equal(result.status, 401);
  assert.deepEqual(result.loaded, []);
});

test("a student is refused, even for their own submission", async () => {
  const result = await answer(student, { format: "csv" });
  assert.equal(result.status, 403);
  assert.equal(result.body.includes("student@example.com"), false);
  assert.deepEqual(result.loaded, []);
});

test("an option that is not a yes or a no is refused with the reason", async () => {
  const result = await answer(instructor, { notes: "maybe" });
  assert.equal(result.status, 400);
  assert.ok(result.body.includes("notes"));
  assert.deepEqual(result.loaded, []);
});

test("a project that is not a UUID is refused", async () => {
  const result = await answer(instructor, { project: "nope" });
  assert.equal(result.status, 400);
  assert.deepEqual(result.loaded, []);
});

test("an unknown format is refused", async () => {
  const result = await answer(instructor, { format: "docx" });
  assert.equal(result.status, 400);
});

test("a submission the instructor cannot see is a 404 that says nothing about it", async () => {
  const result = await answer(instructor, {}, null);
  assert.equal(result.status, 404);
  assert.equal(result.body.includes("Māia"), false);
});

test("the submission is read for the signed-in instructor", async () => {
  const result = await answer(instructor, { format: "csv" });
  assert.deepEqual(result.loaded, [["instructor-1", PROJECT]]);
});

test("every answer, including a refusal, is private and never cached", async () => {
  const results = await Promise.all([
    answer(null),
    answer(student),
    answer(instructor, { notes: "x" }),
    answer(instructor, {}, null),
    answer(instructor, { format: "csv" }),
  ]);
  for (const { headers } of results) {
    assert.equal(headers.get("cache-control"), "private, no-store");
    assert.equal(headers.get("x-content-type-options"), "nosniff");
  }
});

test("a CSV comes back as a download with the student and assignment in its name", async () => {
  const result = await answer(instructor, { format: "csv" });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("content-type"), "text/csv; charset=utf-8");
  assert.equal(
    result.headers.get("content-disposition"),
    'attachment; filename="maia-o-brien-essay-2.csv"'
  );
  assert.ok(result.body.startsWith("﻿student,email,"));
});

test("a CSV leaves out private notes unless they are asked for", async () => {
  const plain = await answer(instructor, { format: "csv" });
  assert.equal(plain.body.includes("Check the cited source."), false);
  const asked = await answer(instructor, { format: "csv", notes: "1" });
  assert.ok(asked.body.includes("Check the cited source."));
});

const named = (name: string) =>
  fileBase({
    ...detail(),
    assignment: { ...detail().assignment, title: "" },
    name,
  });

test("file names are plain ASCII whatever the student is called", () => {
  assert.equal(fileBase(detail()), "maia-o-brien-essay-2");
  assert.equal(named("Žofie Ñandú"), "zofie-nandu");
  assert.equal(named("日本 太郎"), "report");
  assert.equal(named('../../etc/passwd"; x'), "etc-passwd-x");
});
