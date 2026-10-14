import "server-only";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const createReflectionModel = () => {
  const baseURL = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!(baseURL && apiKey && model)) {
    throw new Error(
      "LLM_BASE_URL, LLM_API_KEY and LLM_MODEL are required for the reflection check."
    );
  }
  return createOpenAICompatible({
    apiKey,
    baseURL,
    name: "reflection",
  }).chatModel(model);
};
