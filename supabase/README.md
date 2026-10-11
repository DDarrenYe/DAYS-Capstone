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
- `iterations` belong to a project, with immutable UUIDs and positive, unique step numbers. Reordering preserves IDs; defer `iterations_project_id_step_number_key` inside the reorder transaction to swap positions. Imported steps can have a null critique while waiting for student input; a saved critique cannot be blank. Student-marked AI errors require evidence. Public-link imports require a source URL and import timestamp. Tool/conversation/step identifiers prevent duplicate source steps when supplied; manual entries have no source identifiers.
- `final_versions` hold immutable extracted text, optional original filename and a positive version number unique within the project. A partial unique index permits at most one current version. Save an edit by clearing the old `is_current` and inserting the new version in one transaction. Empty final text is allowed in drafts. `matching_version` and `match_results` are paired so matching outputs carry their algorithm version; the matcher will validate the result object's contents.
- `analysis_results` hold the three question outcomes and their evidence, explanation, uncertainty, model and rubric version. Each result identifies a final version, stable step and analysis run version. Composite foreign keys keep them in the same project. New analysis versions preserve previous results and their reviews. No flags on a completed run means a completed check without flags, rather than pending or failed analysis.
- `flags` belong to an analysis result and carry evidence, explanation and the current review state: `open`, `dismissed` or `added_to_feedback`. Decisions require a reviewer and timestamp. Reopening also keeps reviewer attribution. The review trigger appends each decision to `flag_reviews`, including earlier decisions when the flag is reopened.
- `grader_notes` belong to a project and author; optional step/final references must belong to that project.

Project states are `draft` and `submitted`; only submitted projects have a submission timestamp. Analysis states are `pending`, `running`, `completed` and `failed`. Running/finished analysis requires a submitted project, version and start time. Finished analysis requires an end time; only failed analysis has an error. `final_versions.submitted_at` identifies the submitted snapshot. Client policies lock submitted projects, steps and final versions against student writes. Full submission validation and choosing the submitted final snapshot remain the submission task.

## Deletion and access

Auth users, profiles, courses, assignments and enrolments with dependent records are protected by restrictive foreign keys. Removing a course requires explicit deletion of its assignments and enrolments first. Deleting a project cascades to its steps, final versions, analysis, flags, review history and notes. Deleting a step or final version referenced by analysis or notes is rejected; deleting an analysis result removes its flags and reviews. Account deletion must explicitly handle retained submissions rather than silently removing them.

All application tables have RLS enabled. Anonymous clients have no table grants. Authenticated access uses the database profile role, never user-editable Auth metadata. The Auth insert trigger creates a student profile, with a nonblank display name or `Student`; the migration also backfills missing profiles without changing existing roles. Only a trusted administrator/server may promote an instructor, manage courses/assignments, or create/link enrolments.

Students read their own profile, enrolments, enrolled courses/assignments, and their own projects, steps and final text. They can create Lane 2 drafts, edit/delete draft content, and submit their own project. Ownership and analysis columns are not client-writable. After submission, students retain read access but cannot reopen, delete or modify the submission. Content writes lock the parent project row so submission and draft edits serialize.

Instructors read submissions, analysis results, flags and private notes only for courses they own; student drafts are hidden. They can update only flag review columns and their own grader notes. Reviewers/authors must match the authenticated user. The review trigger appends history with narrowly scoped definer access; clients cannot insert, edit or delete history, change flag evidence, or write analysis. Authenticated final-version reads must select the granted content columns explicitly; matching outputs remain server-only.

Analysis workers use a trusted, server-only `service_role` connection (or the database owner), which can write analysis state, matching outputs, results and generated flags. That credential is the authorization for this privileged path: only trusted jobs should receive it, and jobs must resolve the intended submitted project before writing. No client-callable analysis RPC is exposed. Boolean authorization helpers live in the unexposed `private` schema; trigger functions have no client execution grants and every definer function fixes its search path. Future public views must use `security_invoker = true` and appropriate grants; SQL tests check the view/function inventory and probe invoker views under client roles.

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

The match totals come from a reference count in the seed test, not from application code, because matching is a separate task: lowercase the text, split it into letters and digits, treat any run of at least six consecutive words that appears in a logged answer as a match, count each final word once, and credit it to the earliest matching step. The seed leaves `match_results` empty. When the matcher exists, its totals for these essays should agree with the table, or the table and the test should change together. The percentages are illustrative fixtures, not production expectations.

## Reading and writing from the app

The app talks to Supabase through three typed clients. Types come from `src/lib/supabase/database.types.ts`; run `bun run db:types` after a migration to regenerate it.

- `server.ts` is the cookie-based client for Server Components and Server Actions. It acts as the signed-in user, so RLS decides what it sees.
- `browser.ts` is the same thing in the browser, used by TanStack Query.
- `analysis.ts` uses `SUPABASE_SERVICE_ROLE_KEY`, bypasses RLS and imports `server-only`. Only trusted jobs should call it.

`src/lib/data/queries.ts` has the shared reads (assignments, project log, submissions, reviews) as `{ queryKey, queryFn }` objects. Every key starts with `["users", userId]`, and every read first checks that the client's session belongs to that `userId`, so a tab holding one user's cache can't fill it with another user's rows. Nothing per-user is cached on the server. `getAccount` in `src/lib/auth.ts` and the assignments read in `src/app/student/page.tsx` use `"use cache: private"` with `stale: 300`, so the browser keeps them for five minutes. That puts the signed-in user and their assignments in the prefetched App Shell, and a client navigation to `/student` shows them with no wait. The page passes the cached rows to the client as `initialData` with the time they were fetched, so a newer TanStack cache entry (for example after a save) wins over an older cached page. Server Actions and full page loads always read fresh, and signing out clears the browser's cache.

Writes live in `src/lib/data/writes.ts` (`server-only`). Each one validates its input with Zod, writes as the signed-in user so RLS still applies, and returns `{ error? }` with a safe message. `actions.ts` wraps them as Server Actions after checking the role, and `use-mutations.ts` has the hooks that call them and then invalidate the affected reads (`invalidateAfterSave`, `invalidateAfterSubmit`, `invalidateAfterReview`). Submitting here only flips the draft to submitted; picking the final snapshot is still the submission task.

`bun run test:integration` runs `src/lib/data/data.integration.ts` and `src/lib/supabase/secrets.integration.ts`. The first creates its own users, courses and projects in the local database, checks the reads and writes (including other users being rejected and the cache refreshing after a mutation), then deletes them. The second scans the production client bundle for the service role key. It needs the local stack running and `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. CI doesn't run it.
