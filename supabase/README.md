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
