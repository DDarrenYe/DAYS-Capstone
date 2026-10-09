# Project plan: AI-Interaction Analytics (Proposal 1)

Capstone build for INFOMGMT 399. A web app where students log every AI iteration of an assignment (prompt, raw AI output, mandatory critique), and graders get a Process Visualiser dashboard that charts the iteration timeline, colour-codes human vs AI text, flags low-effort critiques with an LLM, and exports a PDF report.

## 1. Scope

In scope (from the brief):

- Student interface: multi-step iteration log (prompt, AI output, critique), final consolidated version, submit.
- Relational schema: Project → Step iterations → prompt/output/critique blocks → final version, linked to students, assignments and courses.
- LLM script that flags low-effort, blindly-accepted, or AI-written critiques for the grader.
- Instructor dashboard: iteration timeline, human-vs-AI contribution, flag alerts, PDF export.
- Final Report. Reports 1 and 2 are already submitted.

Out of scope (deliberate):

- Auto-grading or any score that replaces the grader's mark. The tool only surfaces evidence.
- LMS (Canvas) integration. Students sign in with their university email via magic link.
- Capturing AI chats automatically from ChatGPT etc. Students paste the output; that is the "behavioural checkpoint" the brief asks for.
- Power BI / Tableau. Charts are built into the app with Recharts so the dashboard is one deploy.

## 2. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15 (App Router, TypeScript, Server Actions) | One codebase for both interfaces and the API. |
| UI | Tailwind CSS + shadcn/ui on Base UI primitives + Recharts | Fast to build, accessible defaults, charts without a BI tool. |
| Database + auth | Supabase (Postgres, Auth magic link, Row Level Security) | Relational schema is a graded objective. RLS gives per-role data access in the DB, not in app code. |
| LLM | Anthropic API, `claude-haiku-5-5` | Cheap, fast enough for batch flagging on submit. |
| PDF | `@react-pdf/renderer` in a Route Handler | Runs on Vercel serverless without a headless browser. |
| Hosting | Vercel (preview deploy per PR, production on `main`) | Zero-config Next.js hosting. |
| CI | GitHub Actions: lint, typecheck, build, Playwright smoke test | Keeps PRs mergeable with 4 people. |

## 3. Data model

```
profiles        id (= auth.users.id), full_name, email, role ('student' | 'instructor')
courses         id, code, name, instructor_id → profiles
enrolments      course_id → courses, student_id → profiles   (PK: course_id, student_id)
assignments     id, course_id → courses, title, brief, due_at
projects        id, assignment_id → assignments, student_id → profiles,
                status ('draft' | 'submitted'), submitted_at
iterations      id, project_id → projects, step_no, ai_tool,
                prompt_text, ai_output_text, critique_text, created_at
final_versions  id, project_id → projects, content, created_at
flags           id, iteration_id → iterations, kind ('low_effort' | 'blind_accept' | 'ai_written'),
                confidence (0–1), rationale, model, created_at
```

Derived, not stored: human-vs-AI character counts per project come from a SQL view over `iterations` and `final_versions` (`prompt_text` + `critique_text` + final = human, `ai_output_text` = AI).

RLS rules:

- Students read and write only their own `projects`, `iterations`, `final_versions`; writes blocked once `status = 'submitted'`.
- Instructors read everything under `courses` they own. They never write student text.
- `flags` are written only by the server (service role) and readable by the course instructor.

## 4. Data flow

1. Student signs in (magic link) → `profiles` row created by a trigger on `auth.users`.
2. Student opens an assignment → a `projects` row is created on first visit.
3. Each step is one `iterations` row, typed in or imported from a chat share link (one row per prompt and AI answer). Critique is required and is checked live against the three questions the flagging rubric uses: was the AI right or wrong, how did you check, what did you change.
4. Student writes the final version and clicks Submit → server action sets `status = 'submitted'` and calls the flagging job.
5. Flagging job sends each critique (plus its prompt and AI output) to the LLM with a fixed rubric and writes `flags`.
6. Instructor opens the submissions table (metrics view) → Process Visualiser (timeline + flags + detail) → Export PDF (Route Handler renders the same data).

## 5. Screens

| # | Screen | User | Mockup |
| --- | --- | --- | --- |
| 1 | Sign in (magic link) beside what the product does | both | `design/mockups/01-sign-in.html` |
| 2 | Student dashboard: assignments, lanes and status | student | `design/mockups/02-student-dashboard.html` |
| 3 | Project workspace: import a chat link, critique each step against the three questions | student | `design/mockups/03-student-workspace.html` |
| 3b | My log: every step with its critique, final version with an own-writing check before submit | student | `design/mockups/03b-student-log.html` |
| 4 | Instructor overview: review queue (who to read first) and own writing across the cohort | instructor | `design/mockups/04-instructor-overview.html` |
| 5 | Submissions table: steps, own-writing %, critique questions answered, status | instructor | `design/mockups/05-submissions.html` |
| 6 | Process Visualiser: final essay matched against logged AI answers, own-writing share, steps with critique depth and flags | instructor | `design/mockups/06-process-visualiser.html` |
| 6b | Flagged step: the reflection check's evidence and the grader's decision | instructor | `design/mockups/06b-flagged-step.html` |
| 7 | PDF report | instructor | `design/mockups/07-pdf-report.html` |

Screenshots are in `design/screenshots/`. The screens are generated: edit `design/mockups/generate.py`, run `python3 design/mockups/generate.py design/mockups`, then re-screenshot at 1440x960 and 2x (for example headless Chrome with `--window-size=1440,960 --force-device-scale-factor=2 --virtual-time-budget=6000`, so the entrance motion has finished).

## 6. Team split (4 members)

Roles are by area so that each person owns a vertical slice end to end. Everyone writes the Final Report.

| Member | Area | Owns |
| --- | --- | --- |
| M1 | Frontend | App shell, auth UI, student dashboard and workspace, final version editor, demo |
| M2 | Data | Supabase schema, RLS, metrics SQL, seed, security review, handover docs |
| M3 | Dashboard | Instructor pages, submissions table, Process Visualiser, flag display, usability tests with graders, Final Report lead |
| M4 | AI + platform | Anthropic flagging pipeline, PDF export, Vercel, CI, Playwright |

## 7. Milestones and sprints

Due dates are left blank until the course dates are confirmed.

| Milestone | Goal | Done when |
| --- | --- | --- |
| M1 Sprint 1: Foundation | Repo, schema, RLS, auth, Vercel, CI, seed | A seeded student can sign in on the Vercel preview |
| M2 Sprint 2: Student interface | Iteration log, timeline, final version, submit | A student can log 3 iterations and submit |
| M3 Sprint 3: Instructor dashboard | Overview, submissions table, Process Visualiser | A grader can open a submission and read the timeline |
| M4 Sprint 4: Flagging and PDF | LLM flags, cost guards, accuracy check, PDF export | Flags appear on submit; PDF downloads |
| M5 Sprint 5: Testing | Usability tests, fixes, security audit, smoke test | High-severity findings fixed |
| M6 Final | Final report, demo, handover, production release | Final report submitted, demo given |

## 8. Risks and anchors

- Privacy: student text is sent to a third-party LLM. Students see a notice before their first iteration; flags are only visible to the instructor and never shown as a grade.
- Fairness: flags are a prompt for the grader to look closer, never an accusation. The UI wording says "check" not "cheated".
- Cost: flagging runs once per submission with a per-project cap and a daily budget guard.
- Access: no real users yet. Usability tests use proxy students and tutors, labelled honestly.
- Feasibility: PDF generation is the riskiest technical piece; `@react-pdf/renderer` avoids a headless browser on Vercel.

## 9. Issue tracker

The full issue breakdown (45 issues, 6 milestones, blocking edges, member split) is in `docs/issue-plan.json`. It is created on GitHub only after the team approves the visualisation.
