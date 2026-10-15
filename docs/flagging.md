# Reflection check rubric

This is how the reflection check reads one step of a student's log. The code is in `src/lib/flagging/`. [#31](https://github.com/DDarrenYe/DAYS-Capstone/issues/31) built the check itself. Running it on submission and saving the results is [#32](https://github.com/DDarrenYe/DAYS-Capstone/issues/32).

The check looks for evidence. It doesn't grade, and it can't tell who wrote a critique. A grader reads the result and decides what to do.

## What goes to the model

For each step we send three things: the student's prompt, the AI's answer and the student's critique. We don't send names, emails, grader notes, review decisions or the final essay. The rubric is in `rubric.ts` (`SYSTEM_PROMPT`, version `three-questions-v1`). Change the wording and you bump the version, so old results still say which rubric made them.

The three questions are the same ones the student answers:

| Key | Question | Counts as addressed when |
| --- | --- | --- |
| `aiCorrectness` | Was the AI right or wrong? | The critique gives a verdict about the AI's answer. |
| `verification` | How did you check? | The critique says what the student read, compared or ran. |
| `changes` | What did you change? | The critique says what they kept, fixed or dropped. |

Length doesn't decide this. A short critique that names a specific error, how it was checked and the fix addresses all three. "I found no error" is a good verdict, but it only addresses `verification` if the student also says how they checked. "Looks good" doesn't.

## Flags

A flag is a possibility with a quote, not a finding. The model can raise each kind at most once per step.

| Kind | When | Shown as |
| --- | --- | --- |
| `low_effort_reflection` | The critique is so short or generic it could be about any answer. | Thin critique |
| `blind_acceptance` | The critique accepts the answer as right and says nothing about a check or a change. | Blind acceptance |
| `reads_like_ai` | The critique reads like polished generic text. Only ever a possibility. | Critique may read as AI-written |

"No error found, and here is how I checked" is not `blind_acceptance`. The flag is for accepting without checking.

## The result

`checkReflection` returns this, which maps straight onto one `analysis_results` row and its `flags`:

| Field | Goes to |
| --- | --- |
| `aiCorrectness`, `verification`, `changes` (`addressed`, `evidence`) | `ai_correctness_*`, `verification_*`, `changes_*` columns |
| `explanation`, `uncertainty` | `explanation`, `uncertainty` |
| `flags` (`kind`, `evidence`, `explanation`) | one `flags` row each |
| `model`, `rubricVersion` | `model`, `rubric_version` |

`evidence` is a quote from the critique. It's empty when the question isn't addressed.

## What gets rejected

The model's reply is checked twice. The schema (zod) catches the wrong shape, unknown flag kinds and blank text. After that we check the quotes:

- A question has evidence exactly when it's addressed.
- Every quote has to appear in the critique, ignoring case and spacing. A quote from the prompt or the AI answer, or one the model made up, fails.
- A flag kind appears at most once.

Anything that fails throws, so a bad reply can't turn into a flag. #32 decides what a failed step looks like.

## Pasted text is data

The prompt, answer and critique are untrusted. A student or an AI can write "ignore your rules" into any of them. We send them as the fields of one JSON message, never joined into the instructions, and the instructions tell the model to treat them only as data. The quote check is the second guard. If the model obeys an injected instruction and quotes text the student didn't write, the result is rejected.

This doesn't make injection impossible. A reply that follows an injected instruction but only quotes the real critique would pass, which is why flags are for a person to judge.

## Configuration

The model is set on the server, not in code. `createReflectionModel` reads these and throws if one is missing:

| Variable       | Example                                          |
| -------------- | ------------------------------------------------ |
| `LLM_BASE_URL` | `https://api.z.ai/api/paas/v4`                   |
| `LLM_API_KEY`  | a normal Z.ai API key, not a GLM Coding Plan key |
| `LLM_MODEL`    | `glm-4.7-flash` (free)                           |

It uses the Vercel AI SDK's OpenAI-compatible provider, so any provider with that API works. We ask for JSON mode and put the JSON shape in the prompt. `supportsStructuredOutputs` is off because we haven't checked that GLM accepts `json_schema`. Turn it on in `model.ts` once we have, and keep the prompt shape anyway. Until then the SDK logs a warning on every call that the schema isn't sent. That's expected, because the prompt carries the shape. We checked the request against a local fake server: it goes to `<base URL>/chat/completions` with a `Bearer` key, `response_format` `json_object`, temperature 0, and a system and a user message.

## Tests

`bun test` covers the schema, short specific critiques, no-error-with-a-check, thin agreement, malformed output, made-up quotes and pasted instructions, all with a mocked model in `check.test.ts`. Nothing in `bun test` calls a real model.

## Live samples

These are separate from the unit tests. `bun run test:live` sends five labelled steps to the model in `.env.local` and prints whether the flags matched what we expected. It uses real tokens (free on `glm-4.7-flash`), so it isn't part of CI. The script reads `.env.local`. To use another file for one run, call `bun --env-file=<path> --conditions=react-server ./src/lib/flagging/flagging.live.ts`. #35 builds the 30-example evaluation.

The samples run one at a time, because the free model rejects five requests at once.

### Results

Run on 15 Oct 2026 with `glm-4.7-flash` on Z.ai (free). Three full runs, plus two direct calls each for the first and fourth samples.

| Sample | Expected flags | What came back |
| --- | --- | --- |
| Short specific critique | none | `none` in 2 of 5 calls. The other 3 failed with Z.ai's overloaded error. |
| No error found, specific check | none | `none` in 3 of 3, all three questions addressed. |
| Thin agreement ("Looks good.") | `blind_acceptance`, `low_effort_reflection` | Both flags in 2 of 3. The other run was overloaded. In one of the two, it said "How did you check?" was addressed, which the rubric says it isn't. |
| Accepted with no check and no change | `blind_acceptance` | Overloaded in all 3 full runs. The 2 direct calls gave `low_effort_reflection` once and no flags once. Neither is right. |
| Instructions pasted into the AI answer, thin critique | `blind_acceptance`, `low_effort_reflection` | `blind_acceptance` only, 3 of 3. It never followed the pasted instruction to return no flags. |

What we learned:

- The whole path works against a real API. Every reply that came back parsed and passed the quote check, and none was rejected.
- Z.ai often answers HTTP 429 with code 1305 ("service may be temporarily overloaded"). It hit about 40% of calls, at random, even with the SDK's retries. #32 has to treat that as a retryable failure, not a bad result.
- Calls took 7 to 24 seconds each.
- `glm-4.7-flash` isn't consistent enough on blind acceptance. The same step got different flags on two calls at temperature 0. Try `glm-5.3-flash` (paid, about $0.15 in and $0.50 out per 1M tokens) or an OpenRouter model before relying on it. #35 should compare them on the 30 labelled critiques.
