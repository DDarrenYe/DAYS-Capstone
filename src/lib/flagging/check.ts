import { generateText, Output } from "ai";
import type { LanguageModel } from "ai";

import { RUBRIC_VERSION, SYSTEM_PROMPT, reflectionSchema } from "./rubric";

export interface ReflectionStep {
  prompt: string;
  aiAnswer: string;
  critique: string;
}

const TIMEOUT_MS = 60_000;

const QUESTIONS = ["aiCorrectness", "verification", "changes"] as const;

const squash = (text: string) =>
  text.toLowerCase().replaceAll(/\s+/gu, " ").trim();

export const checkReflection = async (
  model: LanguageModel,
  step: ReflectionStep
) => {
  const critique = squash(step.critique);
  if (critique === "") {
    throw new Error("There is no critique to check.");
  }

  const { output, finalStep } = await generateText({
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    model,
    output: Output.object({ schema: reflectionSchema }),
    prompt: JSON.stringify(step),
    system: SYSTEM_PROMPT,
    temperature: 0,
  });

  const quoted = (evidence: string) => critique.includes(squash(evidence));

  for (const name of QUESTIONS) {
    const { addressed, evidence } = output[name];
    if (addressed !== (evidence.trim() !== "")) {
      throw new Error(
        `${name} must have evidence exactly when it is addressed.`
      );
    }
    if (addressed && !quoted(evidence)) {
      throw new Error(`${name} evidence is not in the critique.`);
    }
  }

  const kinds = new Set<string>();
  for (const { evidence, kind } of output.flags) {
    if (kinds.has(kind)) {
      throw new Error(`The ${kind} flag appears more than once.`);
    }
    kinds.add(kind);
    if (!quoted(evidence)) {
      throw new Error(`The ${kind} flag evidence is not in the critique.`);
    }
  }

  return {
    ...output,
    model: finalStep.response.modelId,
    rubricVersion: RUBRIC_VERSION,
  };
};
