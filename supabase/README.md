# Database schema

Start this checkout's stack with `bun run db:start`. To apply all migrations from scratch, run `bun run db:reset`, then `bun run db:test`. Reset deletes this checkout/branch's local database contents; use it only for disposable development data. Stopping the stack preserves data. The SQL tests run in a transaction and roll back their fixtures.

Tables, enums, foreign keys, checks, indexes and RLS declarations live in `src/db/schema.ts`. Types are inferred directly from those definitions:

```typescript
import { projects } from "@/db/schema";

type Project = typeof projects.$inferSelect;
type NewProject = typeof projects.$inferInsert;
```

The server-only client is `getDb()` in `src/db/client.ts`. Set `DATABASE_URL` in `.env.local` to this checkout's database URL from Supabase status. The client connects lazily, so builds do not need a running database or credentials. Application fields use camelCase; PostgreSQL columns keep their snake_case names. Supabase still handles Auth.

## Migrations

After editing `src/db/schema.ts`, run `bun run db:generate -- --name describe_change`. Drizzle Kit writes SQL and snapshots to `supabase/migrations`, using Supabase timestamp prefixes. Run `bun run fix` to format generated snapshots, then commit both the SQL and `meta/` files. Apply pending changes with `bun run db:migrate`; this preserves existing data unless the migration itself deletes it. Supabase is the only migration runner: do not also run `drizzle-kit migrate` or use `drizzle-kit push`.

For triggers or other SQL that Drizzle Kit cannot describe, run `bun run db:generate -- --custom --name describe_change`, then fill in that migration. The single initial migration includes the generated tables plus the Lane 2 guard, stable step IDs, immutable final text and flag-review history. Its step-order unique constraint is deferrable; Drizzle's snapshot records its columns, while the custom SQL supplies the deferrability. Preserve that custom behavior if a later migration replaces the constraint.

`bun run db:check` validates migration snapshots. `bun run test` runs the unit tests and snapshot checks in parallel through Turbo, without connecting to a database. The client tests cover missing configuration, reuse and typed SQL generation. `bun run db:test` runs the SQL constraint and role-access tests against the migrated local database without task caching.

## Ownership and relationships

- `profiles.id` is the Auth user ID. Roles are `student` (default) or `instructor`.
- `courses.instructor_id` owns a course. Course codes are unique per instructor.
- `enrolments` belong to a course. A null `student_id` represents a pending email invitation. Email addresses must be trimmed and lowercase; each course/email and course/student pair is unique. An invitation must be linked to an account before it can own a project.
- `assignments` belong to a course and use `lane_1` or `lane_2`. Only Lane 2 can have AI projects. An assignment with projects cannot change to Lane 1.
- `projects` belong to one enrolled student and assignment. Composite foreign keys require the assignment and enrolment to belong to the same course. One student has at most one project per assignment.
- `iterations` belong to a project, with immutable UUIDs and positive, unique step numbers. Reordering preserves IDs; defer `iterations_project_id_step_number_key` inside the reorder transaction to swap positions. Imported steps can have a null critique while waiting for student input; a saved critique cannot be blank. Student-marked AI errors require evidence. Public-link imports require a source URL and import timestamp. Tool/conversation/step identifiers prevent duplicate source steps when supplied; manual entries have no source identifiers. `marks` is a JSON list of the passages the student marked in the AI answer (`start`, `end`, `kind`, and a `note` for wrong passages). They are student-reported, not checked by the app.
- `final_versions` hold immutable extracted text, optional original filename and a positive version number unique within the project. A partial unique index permits at most one current version. Students save an edit through `public.save_final_version(project, base, body, filename)`, which locks the project, clears the old `is_current` and inserts the new version in one transaction. `base` is the version number the edit started from (0 when none is saved); if the project has moved on since, the call fails with `40001` so a second tab can't silently overwrite the first. Empty final text is allowed in drafts. `matching_version` and `match_results` are paired so matching outputs carry their algorithm version. The matcher doesn't write them: it works the result out when it's read (see Final-text matching).
- `analysis_results` hold the three question outcomes and their evidence, explanation, uncertainty, model and rubric version. Each result identifies a final version, stable step and analysis run version. Composite foreign keys keep them in the same project. New analysis versions preserve previous results and their reviews. No flags on a completed run means a completed check without flags, rather than pending or failed analysis.
- `flags` belong to an analysis result and carry evidence, explanation and the current review state: `open`, `dismissed` or `added_to_feedback`. Decisions require a reviewer and timestamp. Reopening also keeps reviewer attribution. The review trigger appends each decision to `flag_reviews`, including earlier decisions when the flag is reopened.
- `grader_notes` belong to a project and author; optional step/final references must belong to that project.

Project states are `draft` and `submitted`; only submitted projects have a submission timestamp. Analysis states are `pending`, `running`, `completed` and `failed`. Running/finished analysis requires a submitted project, version and start time. Finished analysis requires an end time; only failed analysis has an error. `final_versions.submitted_at` identifies the submitted snapshot. Client policies lock submitted projects, steps and final versions against student writes. Students submit through `public.submit_project(project)` and can't write `projects.status`, `projects.submitted_at` or `final_versions.submitted_at` themselves (the update policy only accepts a row that is still a draft).

## Deletion and access

Auth users, profiles, courses, assignments and enrolments with dependent records are protected by restrictive foreign keys. Removing a course requires explicit deletion of its assignments and enrolments first. Deleting a project cascades to its steps, final versions, analysis, flags, review history and notes. Deleting a step or final version referenced by analysis or notes is rejected; deleting an analysis result removes its flags and reviews. Account deletion must explicitly handle retained submissions rather than silently removing them.

All application tables have RLS enabled. Anonymous clients have no table grants. Authenticated access uses the database profile role, never user-editable Auth metadata. The Auth insert trigger creates a student profile, with a nonblank display name or `Student`; the migration also backfills missing profiles without changing existing roles. Only a trusted administrator/server may promote an instructor. Instructors create their own courses and add assignments to them through RLS insert policies (`private.is_instructor()` and `private.teaches()`). They enrol students only through `public.enrol_students(course, emails)`, a definer function that checks course ownership, lowercases the addresses and returns one outcome per address: `enrolled`, `invited`, `duplicate`, `not_a_student` or `invalid`. A confirmed student account is linked straight away. Anything else becomes a pending invitation (`student_id` null), and the `auth_user_profile_claims` trigger links it when that email is confirmed. Instructors can remove an enrolment from a course they teach (a delete policy using `private.teaches()`), which is how a mistaken invitation is undone. A student who already has a project can't be removed, because of the restrictive foreign key. Instructors can't read draft projects, so the roster gets a `has_work` flag from `public.has_work(enrolment)`, a definer function that is only true for the course's instructor when the student has any project. The Courses page uses it to disable the remove button. Instructor accounts are never enrolled, and no path changes a profile role.

Students read their own profile, enrolments, enrolled courses/assignments, and their own projects, steps and final text. They can create Lane 2 drafts, edit/delete draft content, and submit their own complete project. Ownership and analysis columns are not client-writable. After submission, students retain read access but cannot reopen, delete or modify the submission. Content writes lock the parent project row so submission and draft edits serialize.

Instructors read submissions, analysis results, flags and private notes only for courses they own; student drafts are hidden. They also read the profile of a student enrolled in one of those courses (`profiles_instructor_students`, through `private.teaches_student`), which is how the submissions table gets names. Nobody else's profile is readable. They can update only flag review columns and their own grader notes. Reviewers/authors must match the authenticated user. The review trigger appends history with narrowly scoped definer access; clients cannot insert, edit or delete history, change flag evidence, or write analysis. Authenticated final-version reads must select the granted content columns explicitly; matching outputs remain server-only.

Analysis workers use a trusted, server-only `service_role` connection (or the database owner), which can write analysis state, matching outputs, results and generated flags. That credential is the authorization for this privileged path: only trusted jobs should receive it, and jobs must resolve the intended submitted project before writing. Three functions run an analysis (`public.start_analysis`, `public.complete_analysis`, `public.fail_analysis`). They are granted to `service_role` only, so no client session can call them. Boolean authorization helpers live in the unexposed `private` schema; trigger functions have no client execution grants and every definer function fixes its search path. Future public views must use `security_invoker = true` and appropriate grants; SQL tests check the view/function inventory and probe invoker views under client roles.

Analysis runs go through those three functions, never through direct table writes:

- `start_analysis(project, restart, stale_after)` locks the project row and returns the next version (`analysis-v1`, `analysis-v2`, ...), or null when it didn't start a run. It only starts a submitted project. A `pending` project is claimed by a plain call. A `completed` or `failed` one needs `restart`. A `running` one is left alone until it has been running longer than `stale_after` seconds, then it is replaced. It sets `running`, the version and the start time, and clears the error and finish time.
- `complete_analysis(project, run, results)` saves the results and their flags in one transaction, then sets `completed` and the finish time. It refuses a run that isn't the project's current `running` claim, a list that doesn't cover every step exactly once, and a project without a submitted final version. It resolves the final version itself, so a caller can't point results at another one. A flag whose step and kind match an earlier flag starts with that flag's state, reviewer and time, unless the earlier flag was open. The review trigger records that as the new flag's first history row.
- `fail_analysis(project, run, reason)` sets `failed`, the reason and the finish time, but only for the run that still holds the claim. A late report from a replaced run changes nothing.

Because a run saves everything or nothing, every `analysis_version` in `analysis_results` is a complete set, and a failed run leaves earlier sets untouched.

A direct Drizzle connection using the local `postgres` role bypasses RLS. It does not automatically inherit the Supabase Auth user or their JWT claims. Before adding user-facing queries, validate the session and enforce course/student access, or configure a restricted connection with verified user claims and the appropriate database role. Never expose `DATABASE_URL` to browser code or treat `getDb()` as an authorization check.

## Seed data

`supabase/seed.sql` runs after migrations on `bun run db:reset` and builds one course, INFOMGMT 399, with three assignments and eight accounts. Every account uses the password `Capstone-demo-399!`. The seed is for disposable local databases only. It uses fixed IDs and `on conflict` clauses, so applying it again to a seeded database changes nothing. `bun run db:test` checks the scenarios below, including the expected match totals and review counts, in `supabase/tests/seed_scenarios.sql`.

Fixed IDs encode what they refer to, with `P` the project number and `S` the step or version number:

| Record | ID |
| --- | --- |
| User | `10000000-0000-0000-0000-00000000000N` (N from the accounts table) |
| Course | `20000000-0000-0000-0000-000000000001` |
| Assignment | `30000000-0000-0000-0000-00000000000N` (1 Essay 2, 2 Lab 4, 3 Reflection 1) |
| Project | `40000000-0000-0000-0000-00000000000P` |
| Step | `50000000-0000-0000-000P-00000000000S` (zero-padded to four and twelve digits) |
| Final version | `60000000-0000-0000-000P-000000000001` |
| Analysis result | `70000000-0000-0000-000P-00000000000S` |
| Flag | `80000000-0000-0000-000P-00000000000S` (same ID tail as its step's analysis result) |
| Grader note | `90000000-0000-0000-000P-000000000001` |

| N   | Email                    | Name            | Role       |
| --- | ------------------------ | --------------- | ---------- |
| 1   | `student@example.com`    | Demo Student    | student    |
| 2   | `instructor@example.com` | Demo Instructor | instructor |
| 3   | `john.doe@example.com`   | John Doe        | student    |
| 4   | `alex.kim@example.com`   | Alex Kim        | student    |
| 5   | `jane.roe@example.com`   | Jane Roe        | student    |
| 6   | `sam.lee@example.com`    | Sam Lee         | student    |
| 7   | `priya.shah@example.com` | Priya Shah      | student    |
| 8   | `tom.ng@example.com`     | Tom Ng          | student    |

Lab 4 is Lane 1, so it has no projects. Essay 2 and Reflection 1 are Lane 2.

| P | Student, assignment | Scenario | Match totals from the final text | Flags |
| --- | --- | --- | --- | --- |
| 1 | Demo Student, Essay 2 | In-progress draft: three critiqued steps, then two steps imported from a public chat link and waiting for critiques (step 4 has a student-marked error). No final text yet. | none yet | none |
| 2 | John Doe, Essay 2 | Submitted nine-step example. Steps 2, 4 and 7 have student-marked errors; step 6 has the thin critique "Looks good."; step 8's critique reads like AI. Steps 8 and 9 share a sentence. Analysis completed. | 242 words, 110 matched, 132 unmatched (54.5%); matched words by step: 3 has 13, 5 has 49, 8 has 39, 9 has 9 | step 6 added to feedback, step 8 open |
| 3 | Alex Kim, Essay 2 | Submitted. Step 3 combines the answers of steps 1 and 2, so its words are credited to the earlier steps. Analysis completed. | 68 words, 28 matched, 40 unmatched (58.8%); step 1 has 14, step 2 has 14 | step 3 open |
| 4 | Jane Roe, Essay 2 | Submitted with short, specific critiques and one student-marked error. Analysis completed. | 58 words, 15 matched, 43 unmatched (74.1%); step 1 has 15 | step 3 dismissed |
| 5 | Sam Lee, Essay 2 | Submitted. Two identical answers; the essay repeats one with different case and punctuation. Analysis failed. | 31 words, 31 matched, 0 unmatched (0%); step 1 has 31 | none |
| 6 | Priya Shah, Essay 2 | Submitted, and nothing in the essay matches a logged answer. Analysis pending. | 46 words, 0 matched, 46 unmatched (100%) | none |
| 7 | Tom Ng, Essay 2 | Untouched draft: the project exists with no steps and no final text. | none | none |
| 8 | Demo Student, Reflection 1 | Submitted with three steps (step 3 has a student-marked error) and a quoted AI phrase in the reflection. Analysis running. | 62 words, 7 matched, 55 unmatched (88.7%); step 3 has 7 | none |

Review counts across the cohort are two open flags, one dismissed and one added to feedback; `flag_reviews` holds the two decisions. Average questions answered per analysed step are 2.00 for John, 1.75 for Alex and 2.67 for Jane. Analysis results have no evidence text for a question the critique did not answer.

The match totals come from a reference count in the seed test: lowercase the text, split it into letters and digits, treat any run of at least six consecutive words that appears in a logged answer as a match, count each final word once, and credit it to the earliest matching step. `matchFinal` follows the same rule and gives these totals for all six essays, so if one changes the other and the table should change with it. The seed leaves `match_results` empty. The percentages are illustrative fixtures, not production expectations.

## Reading and writing from the app

The app talks to Supabase through three typed clients. Types come from `src/lib/supabase/database.types.ts`; run `bun run db:types` after a migration to regenerate it.

- `server.ts` is the cookie-based client for Server Components and Server Actions. It acts as the signed-in user, so RLS decides what it sees.
- `browser.ts` is the same thing in the browser, used by TanStack Query.
- `analysis.ts` uses `SUPABASE_SERVICE_ROLE_KEY`, bypasses RLS and imports `server-only`. Only trusted jobs should call it.

`src/lib/data/queries.ts` has the shared reads (assignments, project log, submissions, reviews) as `{ queryKey, queryFn }` objects. Every key starts with `["users", userId]`, and every read first checks that the client's session belongs to that `userId`, so a tab holding one user's cache can't fill it with another user's rows. Nothing per-user is cached on the server. `getAccount` in `src/lib/auth.ts` and the assignments read in `src/app/student/page.tsx` use `"use cache: private"` with `stale: 300`, so the browser keeps them for five minutes. That puts the signed-in user and their assignments in the prefetched App Shell, and a client navigation to `/student` shows them with no wait. The page passes the cached rows to the client as `initialData` with the time they were fetched, so a newer TanStack cache entry (for example after a save) wins over an older cached page. Server Actions and full page loads always read fresh, and signing out clears the browser's cache.

Writes live in `src/lib/data/writes.ts` (`server-only`). Each one validates its input with Zod, writes as the signed-in user so RLS still applies, and returns `{ error? }` with a safe message. `actions.ts` wraps them as Server Actions after checking the role, and `use-mutations.ts` has the hooks that call them and then invalidate the affected reads (`invalidateAfterSave`, `invalidateAfterSubmit`, `invalidateAfterReview`). Submitting calls `public.submit_project`; its messages for an incomplete log come back as the error.

Steps are added through `public.add_steps(project, steps)`, never by inserting a number from the client. It runs as the signed-in student, locks the project row, numbers the new steps after the last one in the order given, and skips any step whose tool, conversation and step identifiers are already in the project. Concurrent saves and repeat imports therefore get distinct, gap-free numbers and no duplicates. `writeSteps` adds one pasted prompt and answer (`pasted_text`), and `writeImport` adds the steps of a ChatGPT share link (`public_link`, with the link, conversation ID, step ID and import time). Both leave the critique empty until the student writes it. `writeCritique` then saves the critique and marks on that step and derives `ai_error_evidence` from the wrong marks. The prompt and answer are never rewritten. A student can run `writeCritique` again to edit a saved critique while the project is a draft.

Steps are removed through `public.remove_step(project, step)`. It takes the same project lock, deletes the step and moves every later step up one number in the same transaction (the step-number constraint is deferred for that), so numbers stay in a row and the other steps keep their IDs, notes and provenance. It only works on the student's own draft; a submitted project keeps all its steps. Removing an imported step also frees its source identifiers, so the same chat can be imported again.

A log is submitted through `public.submit_project(project)`. It takes the same project lock, then requires the signed-in enrolled student, a Lane 2 draft, at least one step, a critique on every step and a current final version with text. It sets `projects.status`, `projects.submitted_at` and the current final version's `submitted_at` together. A second call returns the first submission time and changes nothing. A save or step change that runs at the same time waits for the lock; if it comes second, the trigger refuses it. Students have no column grant for the submit timestamps, and the project update policy only accepts a draft, so a direct write can't submit or reopen a log. The function checks completeness; what it can't check is whether a step's critique is any good.

`readImport` and `writeImport` fetch the share page on the server, so the stored text and provenance come from the page rather than from the browser. `src/lib/import/` holds the parts: `chatgpt.ts` accepts only `https://chatgpt.com/share/<id>` (or `chat.openai.com`) and reads the conversation out of the page's embedded React Router payload; `fetch-page.ts` does the request. Redirects are followed by hand, at most three, and each must be the same share on a ChatGPT host. Names must resolve to public addresses, checked when the connection is made, so loopback, private, link-local and similar ranges are refused. One 10 second deadline and a 5 MB limit (after decompression) cover the whole exchange. Every failure becomes a plain message and leaves manual paste available. The page format is ChatGPT's, not a documented API, so `chatgpt.test.ts` builds fixtures in that shape; if ChatGPT changes it, imports fail with "couldn't read that page" and students paste instead.

## Final-text matching

`matchFinal(finalText, sources)` in `src/lib/final-match.ts` compares a final essay with the logged AI answers. It's a pure function with no database or outside call, and `submissionMetrics` in `src/lib/submission-metrics.ts` builds the numbers on top of it. The student preview, the grader view and the cohort read all call that one function on the saved text, so they show the same totals. Its version is `words-6.v1` (`MATCHING_VERSION`), and every result carries it.

How it works:

- **Words.** A word is a run of letters, digits and combining marks. Spaces, punctuation, dashes, quotes, apostrophes and hyphens all separate words, so `light-energy` is two words and `don't` is `don` and `t`. Each word is normalised to NFC and lowercased before it's compared. The final text and the answers follow the same rule, and so does every word count.
- **Minimum span.** A match is six consecutive words (`MIN_MATCH_WORDS`). If six words in a row in the final also appear in a row in a logged answer, all six count as matched. The windows overlap, so a longer shared passage matches in full. A shared phrase of five words or fewer never matches.
- **Each word once.** A final word is matched or unmatched, never both, however many answers contain it or however often the final repeats a passage. Matched plus unmatched is the total.
- **Which step gets the credit.** A matched word goes to the earliest step (lowest step number) whose answer contains a matching window over that word. When two answers share text, the earlier step keeps it and the later one is credited only for what's new. The per-step retained words add up to the matched total.
- **Spans.** Each span has `start`, `end` (exclusive, in UTF-16 units of the saved text), `stepId` and `words`. Neighbouring matched words credited to the same step join into one span, including the punctuation between them. A span never covers an unmatched word, so the highlighted text is always taken from the student's original wording.
- **Percentage.** `unmatchedPercent` is unmatched words over total words, to one decimal place. It's `null` when the final has no words. It isn't a share of authored text: it only says how much of the essay matches none of the logged answers.

`submissionMetrics` adds the step count, student-marked error count, critique questions answered (up to three a step, using the same rule as the critique form: a verdict, and at least six words for the check and the change), and per-step answer and retained words. Flag counts (`open`, `added_to_feedback`, `dismissed`, and `active`, which is open plus added to feedback) stay `null` until a check has saved results for the current final version and the reader can see them. They come from the newest saved result set (`currentAnalyses`, by `created_at`), whatever the project's `analysis_status` says now. A first check that is pending, running or failed has no results, so the counts are `null`. A re-run that is going or has failed keeps showing the last saved set. `openKinds` lists the open flags by kind, sorted by kind. Students can't read analysis, so for them the counts are always `null`.

Limits: only exact words match. A paraphrase, a synonym or one edited word inside a six-word window breaks the match, and an AI answer that wasn't logged can't match at all. Scripts written without spaces, such as Chinese and Japanese, aren't split into words, so an unbroken run counts as one word and matches are rare. A short logged answer (under six words) never matches. The matcher indexes every six-word window once and looks each final window up, so the time grows with the length of the texts.

Results aren't stored. They're worked out from the saved final text and the logged steps each time they're read, so an edit can't leave an old result behind. `finalVersion` and `matchingVersion` say what was measured. A submitted project can't change, so its numbers stay put. `match_results` stays empty until submission needs to freeze a snapshot.

Two reads expose this through RLS: `projectMetricsQuery` (a student's own project, or a submitted project in the instructor's course) and `cohortMetricsQuery` (the submitted projects in the instructor's courses, newest first, with the assignment title, analysis status, and student email and display name; a student only gets their own). Both fetch the current final version and every step, and run the matcher in the caller. The cohort read goes in batches of 200 projects so a large course isn't cut off at the API's 1000-row limit. The submissions table on `/instructor` makes it on the server (`src/app/instructor/submissions.tsx`) and sends the browser only the figures it shows, not the essay text. `submissionRows` in `src/lib/submission-rows.ts` turns each project into a row and keeps a check that is pending, running, failed or without results apart from a finished check with no flags. The My log preview can also call `submissionMetrics` on the cached project log, which is already up to date after a save. Saving a final version invalidates the cached project metrics.

`bun run test:integration` runs `src/lib/data/data.integration.ts` and `src/lib/supabase/secrets.integration.ts`. The first creates its own users, courses and projects in the local database, checks the reads and writes (including other users being rejected and the cache refreshing after a mutation), then deletes them. The second scans the production client bundle for the service role key. It needs the local stack running and `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. CI doesn't run it.

## Instructor overview

The top of `/instructor` is worked out from the same `submissionRows` as the table under it, in `src/lib/cohort-summary.ts`. It shows one assignment at a time: the assignment of the first row, which is the one that needs a look first, or the one in `?assignment=`. The header, progress bar, bands of "not from logged AI", open flags by reason, totals and table all use that assignment's rows, so they can't disagree.

`submissionRows` gives each submission one check state, and the overview groups them like this:

| Group | States | When |
| --- | --- | --- |
| Open flags | `flagged` | The analysis completed for the current final version and at least one flag in the newest saved set is `open`. |
| Check not finished | `failed`, `pending`, `running`, `unavailable` | `analysis_status` isn't `completed`, or it is but there are no results for the current final version. |
| No open flags | `none`, `reviewed` | The analysis completed. Either there were no flags, or every flag was dismissed or added to feedback. |

While a re-run is going or after it fails, a row shows that state and still counts the open flags of the last saved set, so the reasons above can include flags from a row in "Check not finished".

The table lists open flags first (most flags first), then failed checks, then the other unfinished ones, then the rest. Within a group it keeps the order of the cohort read, newest first. The share not from logged AI is shown for context and never changes the order, because a high or low share doesn't say who wrote the essay.
