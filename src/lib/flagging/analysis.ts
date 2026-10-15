import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { APICallError, RetryError } from "ai";
import type { LanguageModel } from "ai";
import { after } from "next/server";
import { z } from "zod";

import {
  InvalidReplyError,
  MAX_OUTPUT_TOKENS,
  checkReflection,
  isTimeout,
} from "@/lib/flagging/check";
import { createReflectionModel } from "@/lib/flagging/model";
import { SYSTEM_PROMPT } from "@/lib/flagging/rubric";
import { createAnalysisClient } from "@/lib/supabase/analysis";
import type { Database, Json } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export const RUN_BUDGET_MS = 200_000;
export const STALE_AFTER_SECONDS = 600;

export const LIMITS = {
  daily_tokens:
    Math.trunc(Number(process.env.ANALYSIS_DAILY_TOKENS ?? "")) || 3_000_000,
  max_attempts: 5,
  max_running: 3,
  max_step_chars: 30_000,
  max_steps: 20,
  stale_after: STALE_AFTER_SECONDS,
  step_overhead: Math.ceil(SYSTEM_PROMPT.length / 3) + MAX_OUTPUT_TOKENS,
};

export interface AnalysisRun {
  projectId: string;
  version: string;
}

export interface Refusal {
  refused: string;
}

const claimSchema = z
  .union([z.object({ version: z.string() }), z.object({ refused: z.string() })])
  .nullable();

type Checked = Awaited<ReturnType<typeof checkReflection>>;

export const claimAnalysis = async (
  client: Client,
  projectId: string,
  restart: boolean
): Promise<AnalysisRun | Refusal | null> => {
  const { data, error } = await client.rpc("start_analysis", {
    project: projectId,
    restart,
    ...LIMITS,
  });
  if (error) {
    throw new Error("Unable to start the reflection check.", { cause: error });
  }
  const claim = claimSchema.parse(data);
  return claim && "version" in claim
    ? { projectId, version: claim.version }
    : claim;
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
  if (isTimeout(failure)) {
    return "The reflection check timed out.";
  }
  if (APICallError.isInstance(failure)) {
    return failure.isRetryable
      ? "The model provider was busy. Try again shortly."
      : "The model provider rejected the request.";
  }
  if (failure instanceof InvalidReplyError) {
    return "The model's reply could not be used. Try again.";
  }
  return "The reflection check failed. Try again.";
};

const checkSteps = async (
  client: Client,
  projectId: string,
  model: LanguageModel,
  onUsage: (tokens?: number) => void
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
    const checked = await checkReflection(
      model,
      {
        aiAnswer: step.raw_answer,
        critique: step.critique ?? "",
        prompt: step.prompt,
      },
      onUsage
    );
    return check(index + 1, [...done, resultRow(step.id, checked)]);
  };
  return check(0, []);
};

export const executeAnalysis = async (
  client: Client,
  { projectId, version }: AnalysisRun,
  loadModel: () => LanguageModel = createReflectionModel
): Promise<void> => {
  let tokens: number | undefined = 0;
  const onUsage = (used?: number) => {
    tokens =
      tokens === undefined || used === undefined ? undefined : tokens + used;
  };
  try {
    const results = await checkSteps(client, projectId, loadModel(), onUsage);
    const { error } = await client.rpc("complete_analysis", {
      project: projectId,
      results,
      run: version,
      tokens,
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
      tokens,
    });
    if (recordError) {
      console.error("Unable to record the failed check", recordError);
    }
  }
};

export const startAnalysis = async (
  projectId: string,
  restart: boolean
): Promise<string | null> => {
  const client = createAnalysisClient();
  const claim = await claimAnalysis(client, projectId, restart);
  if (claim && "refused" in claim) {
    return claim.refused;
  }
  if (claim) {
    after(() => executeAnalysis(client, claim));
  }
  return null;
};
