# Reflection check rubric

This is how the reflection check reads one step of a student's log. The code is in `src/lib/flagging/`. [#31](https://github.com/DDarrenYe/DAYS-Capstone/issues/31) built the check itself. [#32](https://github.com/DDarrenYe/DAYS-Capstone/issues/32) runs it when a student submits and saves the results. [#34](https://github.com/DDarrenYe/DAYS-Capstone/issues/34) bounds what a run can cost and retries transient provider errors.

The check looks for evidence. It doesn't grade, and it can't tell who wrote a critique. A grader reads the result and decides what to do.

## What goes to the model

For each step we send three things: the student's prompt, the AI's answer and the student's critique. We don't send names, emails, grader notes, review decisions or the final essay. The rubric is in `rubric.ts` (`SYSTEM_PROMPT`, version `three-questions-v2`). Change the wording and you bump the version, so old results still say which rubric made them. Then run the evaluation again (see "Evaluation").

The three questions are the same ones the student answers:

| Key | Question | Counts as addressed when |
| --- | --- | --- |
| `aiCorrectness` | Was the AI right or wrong? | The critique gives a verdict about the AI's answer. |
| `verification` | How did you check? | The critique says what the student read, compared, calculated or ran. |
| `changes` | What did you change? | The critique names what they kept, fixed or dropped. |

Length doesn't decide this. A short critique that names a specific error, how it was checked and the fix addresses all three. "I found no error" is a good verdict, but it only addresses `verification` if the student also says how they checked. "Looks good", "it made sense", "I remember it from the lecture" and "we agreed in the group chat" don't. "Nothing", "none" and "fixed it" on their own don't address `changes`.

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

Anything that fails throws, so a bad reply can't turn into a flag. A failed step fails the whole run (see "Running it on a submission").

## Running it on a submission

The job is in `src/lib/flagging/analysis.ts`. It starts the moment a student submits and never decides whether the submission worked.

1. `submitProject` calls `submit_project`. Only if that succeeds does `writeSubmission` ask `startAnalysis` for a run. A failure to claim or run the check is logged and the student still sees their submission.
2. `claimAnalysis` calls the `start_analysis` function. It locks the project row, refuses a draft, checks the limits (see "Limits") and hands out the next version (`analysis-v1`, `analysis-v2`, ...) to exactly one caller. Everyone else gets nothing back. When a limit stops the run, the caller gets the reason instead of a version.
3. The check runs inside Next's `after()`, so the response doesn't wait for it. `executeAnalysis` reads the submitted steps, checks them one at a time and saves every result with `complete_analysis`. If anything goes wrong it calls `fail_analysis` instead. It never throws.

`start_analysis`, `complete_analysis` and `fail_analysis` can only be called with the service role. The Next.js side needs `SUPABASE_SERVICE_ROLE_KEY` and the three `LLM_*` variables. `ANALYSIS_DAILY_TOKENS` is optional.

### State

The state lives on the project row, so the pages that already read `analysis_status` show it:

| `analysis_status` | Means |
| --- | --- |
| `pending` | Submitted, no run claimed yet. |
| `running` | A run holds the claim. `analysis_version` and `analysis_started_at` say which and since when. |
| `completed` | Every step's result and flags were saved. `analysis_finished_at` says when. |
| `failed` | The run saved nothing. `analysis_error` says why in one plain sentence. |

Each result row also carries the `model` and `rubric_version` that produced it. A student can read none of this. On the Visualiser an instructor sees the state, the reason, the model and the time, and can run the check again.

### Time limits

- One model call stops after 60 seconds (`check.ts`).
- No new step starts once a run has used 200 seconds (`RUN_BUDGET_MS`). The last call can still take its 60 seconds, so a run ends within about 260 seconds.
- `/student/log` and `/instructor/visualiser` set `maxDuration = 300`, which is the limit for the server action and for the `after()` work. Keep the run budget plus one call under it if you change either.
- A run still marked `running` after 600 seconds (`STALE_AFTER_SECONDS`) is treated as dead, for example because the function was killed. The next request to start a check replaces it.

At the 7 to 24 seconds a step took in the live samples, about 8 to 28 steps finish inside the budget. That's why a log is capped at 20 steps (see "Limits"). A slow provider can still use up the budget on fewer steps, and the run fails with "The reflection check timed out."

### Limits

The values are `LIMITS` in `analysis.ts`. `claimAnalysis` sends them to `start_analysis`, which checks them in the same transaction that claims the run. It holds a lock across all projects while it does, so two requests can't both take the last slot or the last of the budget.

| Limit | Value | When it's over |
| --- | --- | --- |
| Steps in a submission | 20 | The run doesn't start. The project is marked failed with "This log has N steps, over the limit of 20 for the check. A grader needs to read it." |
| Size of one step | 30,000 characters across the prompt, answer and critique | The same, with "A step is longer than the limit of 30,000 characters for the check. A grader needs to read it." Nothing is cut down to fit, so no step is left out silently. |
| Runs at the same time | 3, across all projects | The project is marked failed with "Too many checks are running. Try again in a few minutes." |
| Tokens in the last 24 hours | 3,000,000. Set `ANALYSIS_DAILY_TOKENS` to change it. | The project is marked failed with "The daily limit for checks is used up. Try again tomorrow." |
| Runs per submission | 5 in 24 hours | The caller gets "This submission was checked 5 times in the last 24 hours, which is the limit. Try again tomorrow." The project isn't touched, so a finished check stays finished. |
| Reply length | 4,096 tokens a call | A reply that is cut off isn't valid JSON, so it fails as "The model's reply could not be used." |

A project a limit marked failed keeps whatever results it had. An instructor runs the check again from the Visualiser once the cause has passed. The first four rows mark the project failed. None of them starts a run, so none counts toward the five.

The daily budget is reserved when the run is claimed. Each step adds its text (one token per three characters, rounded up) plus the rubric and the longest reply we allow. The reservation is a row in `analysis_attempts`. `complete_analysis` and `fail_analysis` then replace it with the tokens the provider reported, summed over every call the run made, including a reply we rejected. If a call timed out, or the provider didn't report usage, the whole reservation stays charged, since we can't know what was spent. A run that was killed stays charged at its reservation until the next claim replaces it or 24 hours pass. The counts are a rolling 24 hours, not a calendar day.

### Retries

Each model call is tried up to four times: the first, then three retries for rate limits (429, including Z.ai's 1305), 5xx and the other errors the SDK marks as retryable. The pauses are 2, 4 and 8 seconds, or the provider's `retry-after` when it sends one under 60 seconds. The retries sit inside the call's 60 seconds and the run's 200 seconds, so they can't run on. If the last try fails, the run fails as "The model provider was busy." and the log stays submitted.

A timeout, a request the provider rejects and a reply that fails the checks aren't retried. An instructor can run the check again from the Visualiser.

### All or nothing

The results are saved in one database call, so a run either has a result for every step and its flags, or nothing at all. `complete_analysis` refuses a run that isn't the current claim, that skips a step or that repeats one. A failed run leaves the project submitted and locked. Nothing about a failed run touches the steps, the final text or any earlier result.

A failed run records one of these, never the model's reply or the student's text:

| Reason | When |
| --- | --- |
| The reflection check timed out. | A call or the run budget timed out. |
| The model provider was busy. Try again shortly. | A retryable provider error, such as Z.ai's 429 with code 1305, that was still there after the retries. |
| The model provider rejected the request. | A provider error that isn't retryable. |
| The model's reply could not be used. Try again. | The reply wasn't JSON in the expected shape, or it failed the checks above. |
| The reflection check failed. Try again. | Anything else, including missing configuration. The server log has the detail. |

The limits in the previous section add four more, all worded there: too many steps, a step that is too long, too many checks running and the daily limit.

### Duplicates and re-analysis

- A second submit, a retry or two requests at once don't start a second run. Only a `pending` project can be claimed by a submit. A finished or failed one stays as it is.
- An instructor of the course can run the check again from the Visualiser. `reanalyseProject` first reads the project with their own session, so only a submitted project in their course qualifies. A run that is already going isn't started twice. A run that has stopped responding is replaced. A limit that stops the run comes back to them as the error under the button, and the Visualiser shows it as the project's failure reason (the attempt limit changes nothing but the message).
- A re-run gets a new version and saves a new set of results next to the old ones. Nothing is overwritten.
- Until the new set is saved, readers keep using the newest saved set. While a re-run is going, or after it fails, the instructor still sees the last results and their decisions, together with the state of the latest run.
- A flag in the new set that has the same step and kind as an earlier flag starts with that flag's decision, reviewer, time and note. Reopening is a decision too: a flag whose latest earlier version was reopened starts open.
- A flag that the new run doesn't raise isn't copied. It stays on the earlier result with its decision and review history, but it isn't part of the current set any more.

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

`bun test` covers the schema, short specific critiques, no-error-with-a-check, thin agreement, malformed output, made-up quotes and pasted instructions, all with a mocked model in `check.test.ts`. It also covers the scoring code and the shape of the evaluation dataset (`evaluation.test.ts`) and the final-text matcher on labelled examples (`final-match.evaluation.test.ts`). Nothing in `bun test` calls a real model.

## Live samples

These are separate from the unit tests. `bun run test:live` sends five labelled steps to the model in `.env.local` and prints whether the flags matched what we expected. It uses real tokens (free on `glm-4.7-flash`), so it isn't part of CI. The script reads `.env.local`. To use another file for one run, call `bun --env-file=<path> --conditions=react-server ./src/lib/flagging/flagging.live.ts`. The 36-step evaluation is separate (see "Evaluation").

The samples run one at a time, because the free model rejects five requests at once.

### Results

Run on 15 Oct 2026 with `glm-4.7-flash` on Z.ai (free), with rubric `three-questions-v1`. Three full runs, plus two direct calls each for the first and fourth samples.

| Sample | Expected flags | What came back |
| --- | --- | --- |
| Short specific critique | none | `none` in 2 of 5 calls. The other 3 failed with Z.ai's overloaded error. |
| No error found, specific check | none | `none` in 3 of 3, all three questions addressed. |
| Thin agreement ("Looks good.") | `blind_acceptance`, `low_effort_reflection` | Both flags in 2 of 3. The other run was overloaded. In one of the two, it said "How did you check?" was addressed, which the rubric says it isn't. |
| Accepted with no check and no change | `blind_acceptance` | Overloaded in all 3 full runs. The 2 direct calls gave `low_effort_reflection` once and no flags once. Neither is right. |
| Instructions pasted into the AI answer, thin critique | `blind_acceptance`, `low_effort_reflection` | `blind_acceptance` only, 3 of 3. It never followed the pasted instruction to return no flags. |

What we learned:

- The whole path works against a real API. Every reply that came back parsed and passed the quote check, and none was rejected.
- Z.ai often answers HTTP 429 with code 1305 ("service may be temporarily overloaded"). It hit about 40% of calls, at random, even with the SDK's default of two retries. #32 records it as "The model provider was busy" and lets an instructor run the check again. [#34](https://github.com/DDarrenYe/DAYS-Capstone/issues/34) raises that to three retries a call. We haven't measured how many of these it recovers against the live API, only against a mock.
- Calls took 7 to 24 seconds each.
- `glm-4.7-flash` isn't consistent enough on blind acceptance. The same step got different flags on two calls at temperature 0. The evaluation below measures how often. Another model, such as `glm-5.3-flash` (paid, about $0.15 in and $0.50 out per 1M tokens) or an OpenRouter one, hasn't been run on it yet.

## Evaluation

[#35](https://github.com/DDarrenYe/DAYS-Capstone/issues/35) asks how far the reflection check can be trusted, and how far the final-text match can. The two are measured separately. The first needs a live model. The second is plain code and runs in `bun test`.

### Reflection check on labelled critiques

The dataset is `src/lib/flagging/evaluation.dataset.ts`: 36 steps, each with a prompt, an AI answer and a critique written the way the app saves it (`composeCritique`). The critiques were written to cover the rubric's cases, not collected from students. Each step is labelled by hand with whether each question is addressed and which flags apply. The labels were fixed before the first run and haven't been changed since.

| Category | Steps | What it covers |
| --- | --- | --- |
| `specific` | 12 | Short critiques that name the error, the check and the fix, including casual wording and formal wording. Nothing should be flagged. |
| `verified` | 6 | The AI was right and the student says how they checked. Not blind acceptance. |
| `thin` | 7 | "Looks good", "Fine", trusting the answer, a bare "it was wrong". |
| `ambiguous` | 8 | Borderline cases, each with a `note` saying why the label is arguable. |
| `polished` | 3 | Formal, impersonal text that may read as AI-written. |

Labelling rules:

- `aiCorrectness` is addressed when the verdict is set, or the text says right, partly or wrong.
- `verification` is addressed when the student names something they read, compared, calculated or ran. Memory, "it made sense" and a chat with friends don't count.
- `changes` is addressed when the critique names what was kept, fixed or dropped ("Kept the sentence unchanged", "Changed to Canberra"). "Nothing", "None", "Kept." and "Fixed it." don't. This is the most arguable rule, because "Nothing, I used it as it was" is also a true answer. Read the `changes` numbers with that in mind.
- `blind_acceptance` is labelled when the critique accepts the answer and addresses neither verification nor changes. `low_effort_reflection` is labelled when the critique could be about any answer. `reads_like_ai` is labelled for impersonal, formal text with no first-person account of what the student did.

Run it with `bun run test:evaluation`. It reads `.env.local`, uses the model from there, calls the model one step at a time and tries each step up to four times. It prints the tables below plus every step where the model and the label differ. Use `bun --env-file=<path> --conditions=react-server ./src/lib/flagging/evaluation.live.ts` for another env file. It spends real tokens, so it isn't part of CI.

### Results

Run on 15 Oct 2026 with `glm-4.7-flash` on Z.ai (free), one run per rubric. Precision is the share of raised flags that were labelled. Recall is the share of labelled flags that were raised.

Agreement with the labels on each question:

| Question | `three-questions-v1` (33 steps) | `three-questions-v2` (36 steps) |
| --- | --- | --- |
| `aiCorrectness` | 32 of 33 (0.97) | 35 of 36 (0.97) |
| `verification` | 20 of 33 (0.61) | 32 of 36 (0.89) |
| `changes` | 24 of 33 (0.73) | 34 of 36 (0.94) |

Flags:

| Flag | Rubric | Labelled | Raised right | Raised wrong | Missed | Precision | Recall |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `low_effort_reflection` | v1 | 7 | 2 | 0 | 5 | 1.00 | 0.29 |
| `low_effort_reflection` | v2 | 7 | 5 | 2 | 2 | 0.71 | 0.71 |
| `blind_acceptance` | v1 | 9 | 2 | 0 | 7 | 1.00 | 0.22 |
| `blind_acceptance` | v2 | 9 | 5 | 0 | 4 | 1.00 | 0.56 |
| `reads_like_ai` | v1 | 3 | 0 | 0 | 3 | n/a | 0.00 |
| `reads_like_ai` | v2 | 3 | 1 | 1 | 2 | 0.50 | 0.33 |

The v1 run was on the first 33 steps. The three formal, specific critiques (`specific-formal-*`) were added afterwards, as the only negatives for `reads_like_ai` that weren't plainly worded, and v2 was the first run to include them. A second v1 run on all 36 was cancelled by a server restart. v2 flagged none of those three.

The old target was 0.8 precision for blind acceptance. v2 gets 1.00 on 5 raised flags, with no false positives. That is five cases, not a measured rate.

False positives with v2:

- `thin-high-school` ("Same as what I learned in high school.", labelled `blind_acceptance` only): also raised `low_effort_reflection`. Arguable, because the sentence is generic.
- `ambiguous-group-chat` ("We talked about it in our group chat and agreed."): raised `low_effort_reflection` and `reads_like_ai`, and missed `blind_acceptance`. The `reads_like_ai` flag is the clearest wrong one, because the text is short and casual.

Missed with v2:

- `blind_acceptance`: `thin-trusted-it`, `thin-seems-okay`, `ambiguous-group-chat`, `polished-versailles`.
- `low_effort_reflection`: `ambiguous-long-generic`, `polished-overview`. Both are long critiques with generic wording.
- `reads_like_ai`: `polished-overview`, `polished-photosynthesis`.

What changed between v1 and v2 (`rubric.ts`): `verification` is addressed only when the critique names something the student did, and a verdict, "looks good", memory or agreement with others don't count. `changes` has to name what was kept, fixed or dropped. `blind_acceptance` is decided from the model's own addressed values. A bare verdict is low effort. `reads_like_ai` looks for impersonal text with no first-person account. Some of the v2 wording echoes dataset cases ("fixed it", "made some changes", "nothing"), which is another reason to check v2 on new steps.

Cost and time: v1 used 26,154 input and 47,774 output tokens over 34 replies. One step needed a second reply because the first failed the quote check, and 9 attempts failed before any reply and were retried. v2 used 35,354 input and 56,837 output tokens over 36 replies, one per step, and 10 attempts failed before a reply and were retried. Each run took 14 to 19 minutes, which is mostly Z.ai's slowness and 429s. It costs nothing on `glm-4.7-flash`. At `glm-5.3-flash`'s prices the same run would be about $0.03, but that model hasn't been run.

### What these numbers can't tell you

- 36 steps is small. One step moves a flag's precision or recall by 10 to 20 points, and `reads_like_ai` has three labelled positives.
- Each rubric was run once. The model isn't consistent at temperature 0 (see "Live samples"), so rerunning will move the numbers a little.
- The same steps showed what v1 got wrong and then checked v2. The v2 numbers are therefore better than a fresh set would give. Treat v2 as better than v1, not as 0.89 or 1.00 on new critiques. Write new steps before the next rubric change and keep them out of the revision.
- One person wrote and labelled the steps. There is no second labeller, so agreement between people isn't measured. The `ambiguous` category is where the labels are arguable.
- The steps are short, with one AI answer each. Long critiques, other subjects and other languages haven't been tried.
- Formal writing by a student is the main false-positive risk for `reads_like_ai`. Only three steps cover it.

### What this means for the interface

The check is careful when it flags and misses a fair share. So a step with no flag isn't a good critique, and a flag is a prompt to read the critique, not a finding. The wording says so:

- The Visualiser's check status says it can miss thin critiques (`submission-detail.ts`).
- The Flags page says the check misses some and sometimes flags a fine critique.
- `reads_like_ai` stays "Critique may read as AI-written". It's the weakest flag, so it must never be worded as a finding.

### Final-text matching

`final-match.evaluation.test.ts` runs `matchFinal` (`words-6.v1`, a match is an unbroken run of 6 or more words) on 12 labelled cases. The label is how many words of the final were reused from a logged answer, counting a copy with at most about one word in five changed, and not counting a paraphrase. This needs no model and runs in `bun test`. The test also fails if the cases where the matcher and the label differ change.

| Kind | Case | Words in final | Reused (label) | Matched |
| --- | --- | --- | --- | --- |
| exact | A logged sentence inside new writing | 22 | 10 | 10 |
| exact | Same sentence, different case, quotes, hyphen and line break | 10 | 10 | 10 |
| exact | The whole answer pasted alone | 10 | 10 | 10 |
| edited | Last word changed | 10 | 9 | 9 |
| edited | One word changed in the middle of a ten-word sentence | 10 | 9 | **0** |
| edited | One word inserted after the fourth word | 11 | 10 | **6** |
| edited | Every fifth word of a twenty-word sentence swapped | 20 | 16 | **0** |
| edited | A five-word fragment kept | 10 | 5 | **0** |
| overlap | A sentence two logged answers share | 10 | 10 | 10 (counted once) |
| overlap | Sentences from two different answers | 20 | 20 | 20 |
| not copied | A paraphrase with none of the wording | 9 | 0 | 0 |
| not copied | A six-word stock phrase the student wrote on their own | 10 | 0 | **6** |

It agrees on 7 of 12. Exact copies, formatting changes and overlaps are right: shared text is counted once and the totals add up. The five differences are the limits:

- A change inside a short run drops the whole run. One word changed in a ten-word sentence leaves nothing, because no six words in a row are left. Light editing hides a copy.
- Runs shorter than six words never match, however much was reused.
- An inserted word costs the words next to it on the side with fewer than six.
- A paraphrase doesn't match at all, by design. The matcher finds reused wording, not reused ideas.
- A common six-word phrase matches even when the student wrote it on their own.

So the unmatched share is an upper bound on text the student wrote and the match share is a lower bound on text taken from the AI, with some noise from stock phrases. The wording says that: a match is an unbroken run, an edited or reworded passage doesn't match, and a common phrase can (`essay-card.tsx`, `final-sidebar.tsx`). The 12 cases are made up, so they show what the matcher does with each pattern, not how often each pattern happens in real essays.
