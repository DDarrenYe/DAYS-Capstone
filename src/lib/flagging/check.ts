import { generateText, NoObjectGeneratedError, Output } from "ai";
import type { LanguageModel } from "ai";

import { RUBRIC_VERSION, SYSTEM_PROMPT, reflectionSchema } from "./rubric";

export interface ReflectionStep {
  prompt: string;
  aiAnswer: string;
  critique: string;
}

export class InvalidReplyError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "InvalidReplyError";
  }
}

export const isTimeout = (error: Error) =>
  error.name === "TimeoutError" || error.name === "AbortError";

const TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;
export const MAX_OUTPUT_TOKENS = 4096;

const QUESTIONS = ["aiCorrectness", "verification", "changes"] as const;

const squash = (text: string) =>
  text.toLowerCase().replaceAll(/\s+/gu, " ").trim();

export const checkReflection = async (
  model: LanguageModel,
  step: ReflectionStep,
  onUsage?: (tokens?: number) => void
) => {
  const critique = squash(step.critique);
  if (critique === "") {
    throw new Error("There is no critique to check.");
  }

  const { output, finalStep, usage } = await generateText({
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    maxRetries: MAX_RETRIES,
    model,
    output: Output.object({ schema: reflectionSchema }),
    prompt: JSON.stringify(step),
    system: SYSTEM_PROMPT,
    temperature: 0,
  }).catch((error: Error) => {
    if (NoObjectGeneratedError.isInstance(error)) {
      onUsage?.(error.usage?.totalTokens);
      throw new InvalidReplyError("The reply is not the expected JSON.", {
        cause: error,
      });
    }
    if (isTimeout(error)) {
      onUsage?.();
    }
    throw error;
  });
  onUsage?.(usage.totalTokens);

  const quoted = (evidence: string) => critique.includes(squash(evidence));

  for (const name of QUESTIONS) {
    const { addressed, evidence } = output[name];
    if (addressed !== (evidence.trim() !== "")) {
      throw new InvalidReplyError(
        `${name} must have evidence exactly when it is addressed.`
      );
    }
    if (addressed && !quoted(evidence)) {
      throw new InvalidReplyError(`${name} evidence is not in the critique.`);
    }
  }

  const kinds = new Set<string>();
  for (const { evidence, kind } of output.flags) {
    if (kinds.has(kind)) {
      throw new InvalidReplyError(`The ${kind} flag appears more than once.`);
    }
    kinds.add(kind);
    if (!quoted(evidence)) {
      throw new InvalidReplyError(
        `The ${kind} flag evidence is not in the critique.`
      );
    }
  }

  return {
    ...output,
    model: finalStep.response.modelId,
    rubricVersion: RUBRIC_VERSION,
  };
};
