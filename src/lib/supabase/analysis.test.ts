import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

import { createAnalysisClient } from "./analysis";

const setEnvironment = (name: string, value: string | undefined) => {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, name);
  } else {
    process.env[name] = value;
  }
};

const withEnvironment = (
  values: Record<string, string | undefined>,
  run: () => void
) => {
  const previous = Object.entries(values).map(
    ([name]) => [name, process.env[name]] as const
  );
  for (const [name, value] of Object.entries(values)) {
    setEnvironment(name, value);
  }
  try {
    run();
  } finally {
    for (const [name, value] of previous) {
      setEnvironment(name, value);
    }
  }
};

test("the analysis client requires the service role key", () => {
  withEnvironment(
    {
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anonymous-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    },
    () => {
      assert.throws(createAnalysisClient, /SUPABASE_SERVICE_ROLE_KEY/u);
    }
  );
});

test("the analysis client is created without a persisted user session", () => {
  withEnvironment(
    {
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anonymous-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    },
    () => {
      assert.ok(createAnalysisClient());
    }
  );
});

test("client code cannot import the analysis client", () => {
  const result = spawnSync(
    process.execPath,
    ["-e", 'await import("./src/lib/supabase/analysis.ts")'],
    { cwd: process.cwd(), encoding: "utf-8" }
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Server Component/u);
});
