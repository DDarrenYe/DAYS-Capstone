import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

import { createReflectionModel } from "./model";

const NAMES = ["LLM_BASE_URL", "LLM_API_KEY", "LLM_MODEL"] as const;

const withEnvironment = (
  values: Partial<Record<(typeof NAMES)[number], string>>,
  run: () => void
) => {
  const previous = NAMES.map((name) => [name, process.env[name]] as const);
  for (const name of NAMES) {
    Reflect.deleteProperty(process.env, name);
  }
  Object.assign(process.env, values);
  try {
    run();
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) {
        Reflect.deleteProperty(process.env, name);
      } else {
        process.env[name] = value;
      }
    }
  }
};

test("the reflection model needs the base URL, key and model", () => {
  withEnvironment({ LLM_API_KEY: "key", LLM_MODEL: "glm-4.7-flash" }, () => {
    assert.throws(createReflectionModel, /LLM_BASE_URL/u);
  });
  withEnvironment(
    {
      LLM_BASE_URL: "https://api.z.ai/api/paas/v4",
      LLM_MODEL: "glm-4.7-flash",
    },
    () => {
      assert.throws(createReflectionModel, /LLM_API_KEY/u);
    }
  );
});

test("the reflection model uses the configured model id", () => {
  withEnvironment(
    {
      LLM_API_KEY: "key",
      LLM_BASE_URL: "https://api.z.ai/api/paas/v4",
      LLM_MODEL: "glm-4.7-flash",
    },
    () => {
      assert.equal(createReflectionModel().modelId, "glm-4.7-flash");
    }
  );
});

test("client code cannot import the reflection model", () => {
  const result = spawnSync(
    process.execPath,
    ["-e", 'await import("./src/lib/flagging/model.ts")'],
    { cwd: process.cwd(), encoding: "utf-8" }
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Server Component/u);
});
