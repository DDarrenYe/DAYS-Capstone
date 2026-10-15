import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { APICallError, RetryError } from "ai";
import type { LanguageModel } from "ai";
import { after } from "next/server";

import { checkReflection } from "@/lib/flagging/check";
import { createReflectionModel } from "@/lib/flagging/model";
import { createAnalysisClient } from "@/lib/supabase/analysis";
import type { Database, Json } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export const RUN_BUDGET_MS = 200_000;
export const STALE_AFTER_SECONDS = 600;

export interface AnalysisRun {
  projectId: string;
  version: string;
}

type Checked = Awaited<ReturnType<typeof checkReflection>>;

export const claimAnalysis = async (
  client: Client,
  projectId: string,
  restart: boolean
): Promise<AnalysisRun | null> => {
  const { data, error } = await client.rpc("start_analysis", {
    project: projectId,
    restart,
    stale_after: STALE_AFTER_SECONDS,
  });
  if (error) {
    throw new Error("Unable to start the reflection check.", { cause: error });
  }
  return data ? { projectId, version: data } : null;
};

const resultRow = (iterationId: string, checked: Checked): Json => ({
  ai_correctness_addressed: checked.aiCorrectness.addressed,
  ai_correctness_evidence: checked.aiCorrectness.evidence,
  changes_addressed: checked.changes.addressed,
  changes_evidence: checked.changes.evidence,
  explanation: checked.explanation,
  flags: checked.flags,
  iteration_id: iterationId,
  model: checked.model,
  rubric_version: checked.rubricVersion,
  uncertainty: checked.uncertainty,
  verification_addressed: checked.verification.addressed,
  verification_evidence: checked.verification.evidence,
});

const reasonFor = (failure: Error) => {
  if (failure.name === "TimeoutError" || failure.name === "AbortError") {
    return "The reflection check timed out.";
  }
  if (APICallError.isInstance(failure)) {
    return failure.isRetryable
      ? "The model provider was busy. Try again shortly."
      : "The model provider rejected the request.";
  }
  return "The reflection check failed. Try again.";
};

const checkSteps = async (
  client: Client,
  projectId: string,
  model: LanguageModel
) => {
  const { data: steps, error } = await client
    .from("iterations")
    .select("id, prompt, raw_answer, critique")
    .eq("project_id", projectId)
    .order("step_number");
  if (error) {
    throw new Error("Unable to read the steps.", { cause: error });
  }
  const deadline = Date.now() + RUN_BUDGET_MS;
  const check = async (index: number, done: Json[]): Promise<Json[]> => {
    const step = steps[index];
    if (!step) {
      return done;
    }
    if (Date.now() > deadline) {
      throw new DOMException(
        "The reflection check ran out of time.",
        "TimeoutError"
      );
    }
    const checked = await checkReflection(model, {
      aiAnswer: step.raw_answer,
      critique: step.critique ?? "",
      prompt: step.prompt,
    });
    return check(index + 1, [...done, resultRow(step.id, checked)]);
  };
  return check(0, []);
};

export const executeAnalysis = async (
  client: Client,
  { projectId, version }: AnalysisRun,
  loadModel: () => LanguageModel = createReflectionModel
): Promise<void> => {
  try {
    const results = await checkSteps(client, projectId, loadModel());
    const { error } = await client.rpc("complete_analysis", {
      project: projectId,
      results,
      run: version,
    });
    if (error) {
      throw new Error("Unable to save the results.", { cause: error });
    }
  } catch (error) {
    const cause = RetryError.isInstance(error) ? error.lastError : error;
    const failure =
      cause instanceof Error
        ? cause
        : new Error("The check threw a non-error.");
    console.error(
      `Reflection check failed for ${projectId} (${version}): ${failure.message}`
    );
    const { error: recordError } = await client.rpc("fail_analysis", {
      project: projectId,
      reason: reasonFor(failure),
      run: version,
    });
    if (recordError) {
      console.error("Unable to record the failed check", recordError);
    }
  }
};

export const startAnalysis = async (projectId: string, restart: boolean) => {
  const client = createAnalysisClient();
  const run = await claimAnalysis(client, projectId, restart);
  if (run) {
    after(() => executeAnalysis(client, run));
  }
};
