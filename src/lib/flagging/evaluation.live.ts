import { setTimeout as sleep } from "node:timers/promises";

import { wrapLanguageModel } from "ai";

import { checkReflection } from "./check";
import type { ReflectionStep } from "./check";
import { QUESTIONS, score } from "./evaluation";
import type { LabelledStep, Verdict } from "./evaluation";
import { DATASET } from "./evaluation.dataset";
import { createReflectionModel } from "./model";
import { RUBRIC_VERSION } from "./rubric";

const ATTEMPTS = 4;
const RETRY_DELAY_MS = 5000;

const usage = { calls: 0, input: 0, output: 0 };

const model = wrapLanguageModel({
  middleware: {
    specificationVersion: "v4",
    wrapGenerate: async ({ doGenerate }) => {
      const result = await doGenerate();
      usage.calls += 1;
      usage.input += result.usage.inputTokens.total ?? 0;
      usage.output += result.usage.outputTokens.total ?? 0;
      return result;
    },
  },
  model: createReflectionModel(),
});

interface Outcome {
  attempts: number;
  error?: string;
  verdict?: Verdict;
}

const evaluate = async (
  step: ReflectionStep,
  attempt = 1
): Promise<Outcome> => {
  try {
    const result = await checkReflection(model, step);
    return {
      attempts: attempt,
      verdict: {
        addressed: {
          aiCorrectness: result.aiCorrectness.addressed,
          changes: result.changes.addressed,
          verification: result.verification.addressed,
        },
        flags: result.flags.map(({ kind }) => kind),
      },
    };
  } catch (error) {
    if (attempt >= ATTEMPTS) {
      return {
        attempts: attempt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    await sleep(RETRY_DELAY_MS * attempt);
    return evaluate(step, attempt + 1);
  }
};

const runInOrder = async ([first, ...rest]: readonly LabelledStep[]): Promise<
  Outcome[]
> => (first ? [await evaluate(first.step), ...(await runInOrder(rest))] : []);

const share = (value: number | null) =>
  value === null ? "n/a" : value.toFixed(2);

const list = (ids: readonly string[]) => ids.join(", ") || "none";

const run = async () => {
  const started = Date.now();
  const outcomes = await runInOrder(DATASET);
  const seconds = Math.round((Date.now() - started) / 1000);
  const predictions = new Map(
    DATASET.flatMap(({ id }, index) => {
      const verdict = outcomes[index]?.verdict;
      return verdict ? [[id, verdict] as const] : [];
    })
  );
  const result = score(DATASET, predictions);

  const summary = [
    `model ${process.env.LLM_MODEL}`,
    `rubric ${RUBRIC_VERSION}`,
    `examples ${DATASET.length}, scored ${result.scored}, failed ${DATASET.length - result.scored}`,
    `retried calls ${outcomes.reduce((total, { attempts }) => total + attempts - 1, 0)}`,
    `model calls ${usage.calls}, input tokens ${usage.input}, output tokens ${usage.output}, ${seconds} s`,
  ];

  const questions = result.agreement.map(
    ({ agreed, question }) =>
      `| ${question} | ${agreed} / ${result.scored} | ${share(agreed / result.scored)} |`
  );

  const flagRows = result.flags.map(
    (row) =>
      `| ${row.kind} | ${row.truePositives} | ${row.falsePositives.length} | ${row.falseNegatives.length} | ${share(row.precision)} | ${share(row.recall)} | ${list(row.falsePositives)} | ${list(row.falseNegatives)} |`
  );

  const failures = DATASET.flatMap(({ id }, index) => {
    const error = outcomes[index]?.error;
    return error ? [`${id}: ${error}`] : [];
  });

  const differences = DATASET.flatMap(({ addressed, flags, id }, index) => {
    const verdict = outcomes[index]?.verdict;
    if (!verdict) {
      return [];
    }
    const wrongQuestions = QUESTIONS.filter(
      (question) => addressed[question] !== verdict.addressed[question]
    );
    const wrongFlags =
      flags.toSorted().join(",") !== verdict.flags.toSorted().join(",");
    return wrongQuestions.length > 0 || wrongFlags
      ? [
          `${id}: labelled flags ${list(flags)}, got ${list(verdict.flags)}; questions differing ${list(wrongQuestions)}`,
        ]
      : [];
  });

  process.stdout.write(
    [
      ...summary,
      "",
      "| Question | Agreed | Share |",
      "| --- | --- | --- |",
      ...questions,
      "",
      "| Flag | TP | FP | FN | Precision | Recall | False positives | Missed |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
      ...flagRows,
      "",
      `failed: ${failures.join("; ") || "none"}`,
      "",
      "differences:",
      ...differences,
      "",
    ].join("\n")
  );
};

await run();
