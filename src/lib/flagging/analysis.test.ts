import assert from "node:assert/strict";
import { test } from "node:test";

import { createClient } from "@supabase/supabase-js";
import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { z } from "zod";

import { quietly } from "@/lib/test-console";

import {
  RUN_BUDGET_MS,
  STALE_AFTER_SECONDS,
  claimAnalysis,
  executeAnalysis,
} from "./analysis";
import type { Reflection } from "./rubric";

const projectId = "20000000-0000-0000-0000-000000000001";
const version = "analysis-v2";
const run = { projectId, version };

const usage = {
  inputTokens: {
    cacheRead: undefined,
    cacheWrite: undefined,
    noCache: 10,
    total: 10,
  },
  outputTokens: { reasoning: undefined, text: 20, total: 20 },
};

const generated = (text: string) => ({
  content: [{ text, type: "text" as const }],
  finishReason: { raw: undefined, unified: "stop" as const },
  usage,
  warnings: [],
});

const specific =
  "The date was wrong. I checked the article. I fixed it in the intro.";
const thin = "Looks good.";

const steps = [
  { critique: specific, id: "step-1", prompt: "When?", raw_answer: "In 1990." },
  { critique: thin, id: "step-2", prompt: "Why?", raw_answer: "Because." },
];

const reflection = (overrides: Partial<Reflection> = {}): Reflection => ({
  aiCorrectness: { addressed: true, evidence: "The date was wrong" },
  changes: { addressed: true, evidence: "I fixed it in the intro" },
  explanation: "Names the error, the check and the change.",
  flags: [],
  uncertainty: "Low.",
  verification: { addressed: true, evidence: "I checked the article" },
  ...overrides,
});

const flaggedThin = reflection({
  aiCorrectness: { addressed: true, evidence: "Looks good" },
  changes: { addressed: false, evidence: "" },
  flags: [
    {
      evidence: "Looks good",
      explanation: "Accepts the answer with no check.",
      kind: "blind_acceptance",
    },
  ],
  verification: { addressed: false, evidence: "" },
});

const replies = (...texts: string[]) => {
  const queue = [...texts];
  return new MockLanguageModelV4({
    doGenerate: () =>
      Promise.resolve(generated(queue.shift() ?? "no reply left")),
  });
};

const body = z.record(z.string(), z.json());

interface Call {
  body: z.infer<typeof body> | undefined;
  path: string;
}

const database = (handlers: Record<string, () => Response> = {}) => {
  const calls: Call[] = [];
  const client = createClient("https://project.supabase.co", "service-key", {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => {
        const { pathname } = new URL(String(input));
        calls.push({
          body: init?.body
            ? body.parse(JSON.parse(String(init.body)))
            : undefined,
          path: pathname,
        });
        const handler = handlers[pathname];
        return Promise.resolve(
          handler
            ? handler()
            : Response.json({ message: "Unexpected request" }, { status: 500 })
        );
      },
    },
  });
  return { calls, client };
};

const saved = () => new Response(null, { status: 204 });
const withSteps = {
  "/rest/v1/iterations": () => Response.json(steps),
  "/rest/v1/rpc/complete_analysis": saved,
  "/rest/v1/rpc/fail_analysis": saved,
};

const rpcs = (calls: Call[]) =>
  calls.filter(({ path }) => path.includes("/rpc/"));

test("claiming a run sends the lease and returns the version the database chose", async () => {
  const { calls, client } = database({
    "/rest/v1/rpc/start_analysis": () => Response.json(version),
  });
  assert.deepEqual(await claimAnalysis(client, projectId, true), run);
  assert.deepEqual(calls[0]?.body, {
    project: projectId,
    restart: true,
    stale_after: STALE_AFTER_SECONDS,
  });
});

test("a run that is already going or already done is not claimed again", async () => {
  const { client } = database({
    "/rest/v1/rpc/start_analysis": () => Response.json(null),
  });
  assert.equal(await claimAnalysis(client, projectId, false), null);
});

test("a database error while claiming is reported to the caller", async () => {
  const { client } = database({
    "/rest/v1/rpc/start_analysis": () =>
      Response.json({ code: "XX000", message: "down" }, { status: 500 }),
  });
  await assert.rejects(
    claimAnalysis(client, projectId, false),
    /Unable to start the reflection check/u
  );
});

test("every step is checked in order and the results are saved together", async () => {
  const { calls, client } = database(withSteps);
  const model = replies(
    JSON.stringify(reflection()),
    JSON.stringify(flaggedThin)
  );
  await executeAnalysis(client, run, () => model);
  assert.equal(model.doGenerateCalls.length, 2);
  assert.deepEqual(
    rpcs(calls).map(({ path }) => path),
    ["/rest/v1/rpc/complete_analysis"]
  );
  const [saving] = rpcs(calls);
  assert.equal(saving?.body?.project, projectId);
  assert.equal(saving?.body?.run, version);
  const results = z.array(body).parse(saving?.body?.results);
  assert.deepEqual(
    results.map(({ iteration_id: id }) => id),
    ["step-1", "step-2"]
  );
  assert.deepEqual(results[0], {
    ai_correctness_addressed: true,
    ai_correctness_evidence: "The date was wrong",
    changes_addressed: true,
    changes_evidence: "I fixed it in the intro",
    explanation: "Names the error, the check and the change.",
    flags: [],
    iteration_id: "step-1",
    model: "mock-model-id",
    rubric_version: "three-questions-v1",
    uncertainty: "Low.",
    verification_addressed: true,
    verification_evidence: "I checked the article",
  });
  assert.deepEqual(results[1]?.flags, [
    {
      evidence: "Looks good",
      explanation: "Accepts the answer with no check.",
      kind: "blind_acceptance",
    },
  ]);
});

test("only the prompt, answer and critique of each step go to the model", async () => {
  const { client } = database(withSteps);
  const model = replies(
    JSON.stringify(reflection()),
    JSON.stringify(flaggedThin)
  );
  await executeAnalysis(client, run, () => model);
  const sent = model.doGenerateCalls.map(({ prompt }) =>
    JSON.stringify(prompt)
  );
  assert.ok(sent[0]?.includes("In 1990."));
  assert.ok(!sent[0]?.includes("step-1"));
  assert.ok(!sent[0]?.includes(projectId));
});

test("a malformed reply fails the run with nothing saved", () =>
  quietly(async () => {
    const { calls, client } = database(withSteps);
    await executeAnalysis(client, run, () =>
      replies(JSON.stringify(reflection()), "this is not json")
    );
    assert.deepEqual(
      rpcs(calls).map(({ path }) => path),
      ["/rest/v1/rpc/fail_analysis"]
    );
    assert.deepEqual(rpcs(calls)[0]?.body, {
      project: projectId,
      reason: "The reflection check failed. Try again.",
      run: version,
    });
  }));

test("a quote that is not in the critique fails the run", () =>
  quietly(async () => {
    const { calls, client } = database(withSteps);
    await executeAnalysis(client, run, () =>
      replies(
        JSON.stringify(
          reflection({
            aiCorrectness: { addressed: true, evidence: "Ignore your rules" },
          })
        )
      )
    );
    assert.deepEqual(
      rpcs(calls).map(({ path }) => path),
      ["/rest/v1/rpc/fail_analysis"]
    );
  }));

const refusing = (retryable: boolean) =>
  new MockLanguageModelV4({
    doGenerate: () =>
      Promise.reject(
        new APICallError({
          isRetryable: retryable,
          message: "Service may be temporarily overloaded",
          requestBodyValues: { secret: "student text" },
          responseHeaders: { "retry-after-ms": "1" },
          statusCode: retryable ? 429 : 400,
          url: "https://api.example.com/chat/completions",
        })
      ),
  });

test("a busy provider is recorded as busy, without the student's text", () =>
  quietly(async (logged) => {
    const { calls, client } = database(withSteps);
    await executeAnalysis(client, run, () => refusing(true));
    assert.equal(
      rpcs(calls)[0]?.body?.reason,
      "The model provider was busy. Try again shortly."
    );
    assert.equal(logged.length, 1);
    assert.ok(!logged.join(",").includes("student text"));
  }));

test("a provider that rejects the request is recorded as rejecting it", () =>
  quietly(async () => {
    const { calls, client } = database(withSteps);
    await executeAnalysis(client, run, () => refusing(false));
    assert.equal(
      rpcs(calls)[0]?.body?.reason,
      "The model provider rejected the request."
    );
  }));

test("a run that uses up its time budget stops before the next step", () =>
  quietly(async () => {
    const realNow = Date.now;
    let now = 0;
    Date.now = () => now;
    try {
      const { calls, client } = database(withSteps);
      const model = new MockLanguageModelV4({
        doGenerate: () => {
          now = RUN_BUDGET_MS + 1;
          return Promise.resolve(generated(JSON.stringify(reflection())));
        },
      });
      await executeAnalysis(client, run, () => model);
      assert.equal(model.doGenerateCalls.length, 1);
      assert.deepEqual(
        rpcs(calls).map(({ path }) => path),
        ["/rest/v1/rpc/fail_analysis"]
      );
      assert.equal(
        rpcs(calls)[0]?.body?.reason,
        "The reflection check timed out."
      );
    } finally {
      Date.now = realNow;
    }
  }));

test("a failure to save the results fails the run", () =>
  quietly(async () => {
    const { calls, client } = database({
      ...withSteps,
      "/rest/v1/rpc/complete_analysis": () =>
        Response.json(
          {
            code: "P0001",
            message: "This analysis run is no longer the current one.",
          },
          { status: 400 }
        ),
    });
    await executeAnalysis(client, run, () =>
      replies(JSON.stringify(reflection()), JSON.stringify(flaggedThin))
    );
    assert.deepEqual(
      rpcs(calls).map(({ path }) => path),
      ["/rest/v1/rpc/complete_analysis", "/rest/v1/rpc/fail_analysis"]
    );
  }));

test("a missing model configuration or unreadable steps fail the run instead of throwing", () =>
  quietly(async (logged) => {
    const { calls, client } = database(withSteps);
    await executeAnalysis(client, run, () => {
      throw new Error("LLM_BASE_URL, LLM_API_KEY and LLM_MODEL are required.");
    });
    assert.deepEqual(
      rpcs(calls).map(({ path }) => path),
      ["/rest/v1/rpc/fail_analysis"]
    );
    const unreadable = database({
      "/rest/v1/iterations": () =>
        Response.json({ code: "XX000", message: "down" }, { status: 500 }),
      "/rest/v1/rpc/fail_analysis": saved,
    });
    await executeAnalysis(unreadable.client, run, () => replies());
    assert.deepEqual(
      rpcs(unreadable.calls).map(({ path }) => path),
      ["/rest/v1/rpc/fail_analysis"]
    );
    assert.equal(logged.length, 2);
  }));

test("a failure that cannot be recorded is logged and still does not throw", () =>
  quietly(async (logged) => {
    const { client } = database({
      "/rest/v1/iterations": () => Response.json(steps),
      "/rest/v1/rpc/fail_analysis": () =>
        Response.json({ code: "XX000", message: "down" }, { status: 500 }),
    });
    await executeAnalysis(client, run, () => replies("this is not json"));
    assert.equal(logged.length, 2);
  }));
