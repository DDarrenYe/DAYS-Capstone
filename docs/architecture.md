# Architecture

This is what the database and app really do today, and what we still haven't built. We checked the ERD against the migrations in `supabase/migrations`. The data flow marks each step as working, database-ready or planned.

| Label | Meaning |
| --- | --- |
| Working | In the repo, and the app uses it. |
| Database-ready | The schema, RLS and triggers already enforce it and have SQL tests, but no app code calls it yet. |
| Planned | Not built. The issue that owns it is linked. |
| Prototype | A screen from `design/` or `src/app` that shows fictional data. |

## Schema (ERD)

We only list the columns that matter, so `created_at` is left out. Composite foreign keys like `projects (assignment_id, course_id)` keep rows in the same course or project.

```mermaid
erDiagram
  auth_users ||--|| profiles : "id"
  profiles ||--o{ courses : "instructor_id"
  courses ||--o{ enrolments : "course_id"
  profiles |o--o{ enrolments : "student_id (null = pending invite)"
  courses ||--o{ assignments : "course_id"
  assignments ||--o{ projects : "assignment_id, course_id"
  enrolments ||--o{ projects : "course_id, student_id"
  projects ||--o{ iterations : "project_id"
  projects ||--o{ final_versions : "project_id"
  projects ||--o{ analysis_results : "project_id"
  projects ||--o{ analysis_attempts : "project_id"
  iterations ||--o{ analysis_results : "iteration_id, project_id"
  final_versions ||--o{ analysis_results : "final_version_id, project_id"
  analysis_results ||--o{ flags : "analysis_result_id"
  flags ||--o{ flag_reviews : "flag_id"
  profiles |o--o{ flags : "reviewed_by"
  profiles ||--o{ flag_reviews : "reviewer_id"
  projects ||--o{ grader_notes : "project_id"
  iterations |o--o{ grader_notes : "iteration_id, project_id"
  final_versions |o--o{ grader_notes : "final_version_id, project_id"
  profiles ||--o{ grader_notes : "author_id"

  profiles {
    uuid id PK
    text display_name
    profile_role role "student | instructor"
  }
  courses {
    uuid id PK
    uuid instructor_id FK
    text code
    text title
  }
  enrolments {
    uuid id PK
    uuid course_id FK
    uuid student_id FK "null until the account is linked"
    text email
  }
  assignments {
    uuid id PK
    uuid course_id FK
    text title
    text brief
    timestamptz due_at
    assignment_lane lane "lane_1 | lane_2"
  }
  projects {
    uuid id PK
    uuid assignment_id FK
    uuid course_id FK
    uuid student_id FK
    project_status status "draft | submitted"
    timestamptz submitted_at
    analysis_status analysis_status "pending | running | completed | failed"
    text analysis_version
    text analysis_error
    timestamptz analysis_started_at
    timestamptz analysis_finished_at
  }
  iterations {
    uuid id PK
    uuid project_id FK
    int step_number "unique per project, deferrable"
    text ai_tool
    text prompt
    text raw_answer
    text critique "null until the student writes it"
    import_source import_source "manual | public_link | pasted_text"
    text source_url
    text source_conversation_id
    text source_step_id
    timestamptz imported_at
    boolean student_marked_ai_error
    text ai_error_evidence
  }
  final_versions {
    uuid id PK
    uuid project_id FK
    int version_number "unique per project"
    text extracted_text "never edited, new version instead"
    text original_filename
    boolean is_current "at most one per project"
    timestamptz submitted_at "marks the submitted snapshot"
    text matching_version "server only"
    jsonb match_results "server only"
  }
  analysis_results {
    uuid id PK
    uuid project_id FK
    uuid final_version_id FK
    uuid iteration_id FK "one row per step per run"
    text analysis_version
    text model
    text rubric_version
    boolean ai_correctness_addressed
    text ai_correctness_evidence
    boolean verification_addressed
    text verification_evidence
    boolean changes_addressed
    text changes_evidence
    text explanation
    text uncertainty
  }
  analysis_attempts {
    uuid id PK
    uuid project_id FK
    integer reserved_tokens "reserved when the run starts"
    integer used_tokens "null while the run is in flight"
    timestamptz started_at
    timestamptz finished_at
  }
  flags {
    uuid id PK
    uuid analysis_result_id FK
    text kind
    text evidence
    text explanation
    flag_review_state review_state "open | dismissed | added_to_feedback"
    uuid reviewed_by FK
    timestamptz reviewed_at
  }
  flag_reviews {
    uuid id PK
    uuid flag_id FK
    flag_review_state review_state
    uuid reviewer_id FK
    timestamptz reviewed_at
  }
  grader_notes {
    uuid id PK
    uuid project_id FK
    uuid iteration_id FK "optional"
    uuid final_version_id FK "optional"
    uuid author_id FK
    text body
  }
```

Things the diagram can't show:

- **Lane 2 only.** A trigger blocks a project on a Lane 1 assignment. An assignment that already has projects can't move to Lane 1.
- **One project per student and assignment.** Opening an assignment again has to reuse the same row.
- **Steps keep their ID.** Reordering only changes `step_number`. The unique constraint is deferrable, so two steps can swap inside one transaction.
- **Final text is never edited.** A trigger rejects changes to the text. An edit saves a new version and moves `is_current`.
- **Review history is automatic.** Changing a flag's decision appends a `flag_reviews` row, and that includes reopening a flag.
- **Deletes are restricted.** Deleting a project also deletes its steps, finals, analysis, flags, history and notes. Courses, assignments, enrolments and profiles that still have records can't be deleted.
- **Matching isn't a character count.** The old prompt and critique character model is gone. The matcher works its result out from the saved final text and the logged steps whenever it's read, and each result carries the matcher version. `match_results` stays empty until submission needs a frozen snapshot.

## Data flow

Solid arrows exist today. Dotted arrows are planned. Red boxes are outside the app. The numbers match the table below.

```mermaid
flowchart LR
  classDef live fill:#d9f2e3,stroke:#2f8f5b,color:#10311f
  classDef ready fill:#fff3c4,stroke:#b8860b,color:#3a2f00
  classDef planned fill:#f3f4f6,stroke:#6b7280,stroke-dasharray:4 3,color:#1f2937
  classDef outside fill:#fde2e2,stroke:#c0392b,color:#4a1010

  subgraph student["Student"]
    direction TB
    s1["1 Sign in"]:::live
    s2["2 Open a Lane 2 assignment"]:::planned
    s3["3 Import a link or paste text"]:::planned
    s4["4 Critique each step"]:::planned
    s5["5 Type or upload the final essay"]:::planned
    s6["6 Submit"]:::live
    s1 -.-> s2 -.-> s3 -.-> s4 -.-> s5 -.-> s6
  end

  subgraph app["Next.js server (trusted)"]
    direction TB
    a1["proxy + requireRole"]:::live
    a2["Fetch the share link"]:::planned
    a3["Extract .docx text"]:::planned
    a4["7 Match final text to AI answers"]:::planned
    a5["8 Reflection check job"]:::live
    a6["10 PDF and CSV export"]:::planned
  end

  subgraph db["Supabase Postgres with RLS"]
    direction TB
    d1[("profiles")]:::live
    d2[("draft: projects, iterations, final_versions")]:::ready
    d3[("submitted and locked")]:::ready
    d4[("match_results, analysis_results, flags")]:::ready
    d6[("flag decisions, flag_reviews, grader_notes")]:::ready
    d2 -->|"submit locks the rows"| d3
  end

  subgraph ext["Outside the app"]
    direction TB
    e1["Chat provider share page"]:::outside
    e2["LLM API (GLM on Z.ai)"]:::outside
  end

  subgraph inst["Instructor"]
    direction TB
    i1["Queue, submissions, visualiser"]:::planned
    i2["9 Dismiss, add to feedback, note"]:::planned
    i3["Download report"]:::planned
  end

  s1 --> a1 --> d1
  s3 -.-> a2
  a2 <-.->|"URL out, chat text in"| e1
  a2 -.-> d2
  s2 -.->|"project row"| d2
  s3 -.->|"manual paste"| d2
  s4 -.->|"critique"| d2
  s5 -.->|"typed text"| d2
  s5 -.-> a3 -.-> d2
  s6 -.->|"status, submitted_at"| d2
  d3 -.-> a4 -.-> d4
  d3 --> a5
  a5 <-->|"step text out, structured result in"| e2
  a5 --> d4
  d3 -.-> i1
  d4 -.-> i1
  i2 -.-> d6
  i1 -.-> a6 -.-> i3
```

| # | Stage | Status | What happens |
| --- | --- | --- | --- |
| 1 | Sign in and role routing | Working | Password sign-in through Supabase Auth. `proxy.ts` only checks that a session cookie is there. `requireRole` checks the user with `auth.getUser()` and reads the role from `profiles`, never from user metadata. The plan said magic links, but we built passwords. |
| 2 | Open a Lane 2 assignment | Database-ready, [#19](https://github.com/DDarrenYe/DAYS-Capstone/issues/19) | A student can only insert a draft `projects` row for their own enrolment and a Lane 2 assignment. The unique key stops duplicates, so the app has to select before it inserts. |
| 3 | Import or manual entry | Database-ready, [#20](https://github.com/DDarrenYe/DAYS-Capstone/issues/20) | `iterations` stores the prompt, raw answer, tool and where it came from (`import_source`, source URL and IDs). A unique key on tool, conversation and step ID stops the same imported step being saved twice. Fetching a public link isn't built. |
| 4 | Critique | Database-ready, [#20](https://github.com/DDarrenYe/DAYS-Capstone/issues/20) | The three questions are only guidance in the UI. The answer is one `critique` text. It's null while an imported step waits, and can't be blank once saved. Marking an AI error needs evidence, and it only records what the student said. |
| 5 | Final essay | Database-ready, [#22](https://github.com/DDarrenYe/DAYS-Capstone/issues/22) | Every save is a new `final_versions` row. `.docx` extraction and the size and type checks will run on the server. |
| 6 | Atomic submission | Working, [#23](https://github.com/DDarrenYe/DAYS-Capstone/issues/23) | The Submit button on the final-version panel calls `public.submit_project`. It locks the project row, then checks that the student is enrolled, the project is a Lane 2 draft, there's at least one step, every step has a critique and the saved final version isn't blank. If so, it sets `status`, `submitted_at` and the final version's `submitted_at` in one transaction. Submitting twice returns the first time. Students can no longer write `status` or `submitted_at` themselves, and a save that runs at the same time waits for the submit and is refused if it comes second. Once it succeeds, the server starts the reflection check (row 8) without waiting for it, and a failure there never undoes the submission. |
| 7 | Text matching | Working, [#26](https://github.com/DDarrenYe/DAYS-Capstone/issues/26) | A deterministic matcher compares the saved final text with the logged AI answers and makes no outside call. Students and instructors read the same numbers through RLS. It doesn't write `match_results`. See "Final-text matching" in `supabase/README.md`. |
| 8 | Reflection check | Working, [#31](https://github.com/DDarrenYe/DAYS-Capstone/issues/31) [#32](https://github.com/DDarrenYe/DAYS-Capstone/issues/32); limits and retries, [#34](https://github.com/DDarrenYe/DAYS-Capstone/issues/34) | After a submit, the server claims a run with `start_analysis` (one claimant per project) and checks the steps one at a time in `after()`. It calls the LLM API through the AI SDK, validates each answer and saves one `analysis_results` row per step plus any `flags` in one call (`complete_analysis`), or records a plain failure reason (`fail_analysis`). `projects.analysis_status` goes `pending`, `running`, then `completed` or `failed`. A finished run with no flags is different from pending or failed. An instructor can run it again from the Visualiser. A re-run adds a new set, keeps the old results and their reviews, and carries a decision over to a flag with the same step and kind. Each run is bounded: steps, step size, runs at once, a daily token budget reserved in `analysis_attempts` and settled with the tokens used, five runs per submission a day, and three retries a model call. A run a limit stops shows its reason as a failed check. See "Running it on a submission" and "Limits" in `docs/flagging.md`. |
| 9 | Grader decisions | Database-ready, [#33](https://github.com/DDarrenYe/DAYS-Capstone/issues/33) | An instructor of that course changes a flag's decision, reviewer and time, and a trigger appends it to `flag_reviews`. They can only add, edit and delete their own `grader_notes`. The Visualiser keeps one note per step, enforced by a unique index on author and step. Saving an empty note deletes it. |
| 10 | Export | Planned, [#36](https://github.com/DDarrenYe/DAYS-Capstone/issues/36) | The server builds the PDF and CSV from the same submitted snapshot, matches and decisions the instructor sees. Notes only go in when the grader picks that. |

## Who can do what

The database enforces this for any client using the anon key and a user session. `service_role` is for trusted server code only. It skips RLS, so any route using it has to check `requireRole` and course ownership itself. Only the reflection-check job uses `service_role` (`src/lib/flagging/analysis.ts`), and it only starts after the submit or re-run action has checked who is asking. Nothing in the app uses `getDb()` yet.

| Table | Student (own enrolled courses) | Instructor (own courses) | `service_role` |
| --- | --- | --- | --- |
| `profiles` | Read own row | Read own row, and the display name of students enrolled in their courses | Read and write |
| `courses`, `assignments` | Read | Read, create their own course, add assignments to it | Read and write |
| `enrolments` | Read own row | Read the course, add students through `enrol_students`, remove students who have no project | Read and write |
| `projects` | Read own, create a Lane 2 draft, submit it through `submit_project`, delete while draft | Read submitted projects | Read and write |
| `iterations` | Read own, write while draft | Read submitted projects | Read and write |
| `final_versions` (text columns) | Read own, write while draft | Read submitted projects | Read and write |
| `matching_version`, `match_results` | No access | No access | Read and write |
| `analysis_results` | No access | Read | Read and write |
| `analysis_attempts` | No access | No access | Read and write |
| `flags` | No access | Read, change review columns only | Read and write |
| `flag_reviews` | No access | Read | Read and write |
| `grader_notes` | No access | Read, add, edit and delete own notes | Read and write |

Anonymous clients can't touch any table. Instructors can't change student text. Students can't read flags, analysis or notes.

## Text that leaves the app

Two calls leave the app. Both run on the server, never in the browser. Sign-in sends the email and password to Supabase, which runs locally in dev.

| Call | What goes out | What comes back | Issue |
| --- | --- | --- | --- |
| Share-link import (step 3) | The URL the student pasted, sent to an allowlisted host | The public chat page | [#20](https://github.com/DDarrenYe/DAYS-Capstone/issues/20) |
| Reflection check (step 8, after submission and when an instructor runs it again) | The prompt, AI answer and critique of each submitted step, sent to the LLM provider (GLM on Z.ai) | A validated, structured result | [#31](https://github.com/DDarrenYe/DAYS-Capstone/issues/31), [#32](https://github.com/DDarrenYe/DAYS-Capstone/issues/32) |

Matching and export stay inside the app. The reflection check sends each submitted step as three fields (prompt, AI answer and critique) from a server job. It sends no names, emails, grader notes, review decisions or final essay. The provider processes that text under its own retention rules, which we can't control, so the privacy page says so and doesn't claim that no text leaves the app.

## Prototype versus working

| Area | Today |
| --- | --- |
| Sign-in, sign-out, role routing | Working. Unit tests cover the proxy, account and credential helpers. |
| Schema, constraints, triggers, RLS and grants | Working and covered by `supabase/tests`. The app only reads `profiles` so far. |
| Seed data | Working, local only. `supabase/seed.sql` builds one course, eight accounts and eight example projects, listed in `supabase/README.md`. The instructor overview shows the submitted projects, and `match_results` stays empty because the matcher works its result out on read. |
| Student assignments page | Prototype. Three hard-coded cards, and "Add steps" opens a placeholder. |
| Progress | Prototype. Example data. |
| Privacy | Working. `/privacy` describes the flow above, linked from sign-in, the account menu and Add steps. It says what the reflection check sends and that the provider's retention isn't ours to set. Update it when [#39](https://github.com/DDarrenYe/DAYS-Capstone/issues/39) settles our own retention period. |
| Instructor overview | Working, [#27](https://github.com/DDarrenYe/DAYS-Capstone/issues/27). The header, review progress, the bands of "not from logged AI", the open flags by reason and the totals on `/instructor` come from the same rows as the submissions table, one assignment at a time (`?assignment=` in the URL). The flags and reports pages are still placeholders. |
| Submissions table | Working. The table on `/instructor` reads submitted projects from Supabase on the server and shows the shared match and critique figures, the reflection-check state, search, a filter and 50-row pages in the URL. |
| Visualiser | Working, [#29](https://github.com/DDarrenYe/DAYS-Capstone/issues/29), [#30](https://github.com/DDarrenYe/DAYS-Capstone/issues/30). `/instructor/visualiser?project=` reads one submitted project on the server and shows the matcher's spans in the final essay, the words kept from each AI answer, critique questions answered per step, the errors the student marked and the open flags. The totals come from `submissionMetrics`, so they equal the submissions table. The note box under each step saves to `grader_notes` for the signed-in instructor. It saves when the field loses focus or on ⌘↵ (Ctrl+Enter), and a failed save keeps what was typed. Each flag on a step links to the Flags page. Flag decisions and the PDF export on that page aren't connected yet ([#33](https://github.com/DDarrenYe/DAYS-Capstone/issues/33), [#36](https://github.com/DDarrenYe/DAYS-Capstone/issues/36)). |
| Import, critique, final essay, submit | Working in My log. |
| Matching | Working as code and reads (`src/lib/final-match.ts`, `src/lib/submission-metrics.ts`). The final-version panel in My log shows the preview from the saved text. The submissions table and the Visualiser both show it per student. |
| Reflection check | Working, [#32](https://github.com/DDarrenYe/DAYS-Capstone/issues/32). A submit starts it, the Visualiser shows its state and lets an instructor run it again. |
| Grader decisions, export | Not built. The tables, versions and review history are ready. |

## What's still missing

- **Flag decisions have no note column.** [#33](https://github.com/DDarrenYe/DAYS-Capstone/issues/33) mentions an optional note, but the review columns and `flag_reviews` don't store one.
- **Roles can't be changed from the app.** Instructors are promoted by a trusted administrator. Enrolling by email never changes a role, and an invitation is only linked to a confirmed student account.
