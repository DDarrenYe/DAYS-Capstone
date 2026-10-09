# Project plan: AI-Interaction Analytics

This is our INFOMGMT 399 capstone (Proposal 1). We have a proper prototype now. The next step is to build it into an app where students log their AI use and graders can see how they got to the final essay.

## Where we are now

The nine prototype screens, design tokens, screenshots and showcase film are in `design/`. We have the Next.js scaffold, shared Base UI components and TanStack Query setup. The home page still says “Sign in (coming soon)”. Sign-in, saving data, chat import, text matching, reflection checks, grader decisions and exports still need to be built.

[issue-plan.json](issue-plan.json) lists the 45 GitHub issues. Keep the existing task keys, owners, sub-issues and blockers. The scaffold task is already closed. We can start independent tasks when their blockers are done; we don't need to finish a whole sprint first.

We'll build and check everything with local Supabase first. Use the Docker-free runtime where supported, or the documented container fallback. Hosted Supabase and Vercel setup can wait until we're ready to deploy in the final milestone.

## What we're building

- Assignment cards show the lane, due date and progress. Lane 1 restricts AI, so it has assignment details but no AI log. Lane 2 allows AI and lets students add steps.
- Add steps follows import → critique → save. Students paste a supported public chat link, check the prompt/answer pairs, and critique each step. They can paste the text manually if the link isn't supported or fails.
- Every critique answers the same three questions: **Was the AI right or wrong? How did you check? What did you change?** It can't be empty, but we don't need a 150-character minimum. A short, specific critique can be enough. Students can mark an AI error, but that only records what they reported.
- My log keeps each prompt, raw AI answer, critique and source together. Students can edit drafts, but not submitted text.
- Students write the final essay or import a `.docx` that passes file checks. They review the extracted text and matches to their logged AI before submitting the saved version.
- Graders get a queue showing what needs a closer look, a searchable submissions table, highlighted essay matches and a chart of AI words kept from each step. They can read the critiques, save private notes, dismiss flags or add them to feedback.
- Graders can export the same information as PDF or step CSV. The PDF can include the full prompt history and grader notes.
- We also need the Final Report, demo and handover docs. Reports 1 and 2 are already submitted. We're still waiting for the official Final Report requirements, presentation length and dates.

We're not building automatic grading, misconduct verdicts, authorship detection or LMS integration. We won't capture private chats or add more chat providers without agreeing on that work first. Public-link import only supports formats we've checked and doesn't need a student's provider login.

## What the numbers mean

The main percentage is **how much of the final essay matches none of the logged AI answers**. It doesn't tell us who wrote that text. Paraphrased AI text or AI answers that weren't logged can still appear unmatched. Prompt and critique character counts aren't a substitute for this number.

Use the same matching code for the student preview, cohort numbers, visualiser and exports, and record which version produced the results. Define how we handle case, punctuation and the shortest match we count. Keep each match's source step and position in the original essay. Count each final word once, even if several AI answers contain it. Pick a consistent source step for shared matches so the step bars add up to the essay total. Check no matches, all matches, repeated answers, punctuation, empty essays and results left over after an edit.

The reflection check looks for evidence against the three questions and possible thin critiques or blind acceptance. The grader still decides what to do. If the check suggests a critique might be AI-written, say that it's uncertain; it can't confirm misconduct. “I found no error” can be a good critique if the student explains how they checked. Show the difference between analysis that is still running, analysis that failed, and a completed check with no flags.

## Stack

| Part | What we're using |
| --- | --- |
| App | Next.js 16 App Router, TypeScript and bun. Read the installed Next.js guides before writing code. |
| UI | Tailwind 4, our existing shadcn/Base UI components and prototype tokens. Use accessible HTML/SVG; add a chart library only if we need it. |
| Data fetching | The existing TanStack Query provider and query-client helper, with access checked for each user. |
| Database and sign-in | Supabase Postgres, magic links and Row Level Security (RLS). |
| Reflection check | A server-only Anthropic client with validated responses and a versioned rubric. Check which model is supported when we build it. |
| Export | Server-side PDF and spreadsheet-safe CSV. Check the PDF renderer locally and on the hosted app before release. |
| Hosting | Vercel previews and production, with separate settings and sign-in callback URLs. |
| Checks | `bun run check`, `bun run typecheck` and `bun run build`. Add SQL, integration and Playwright checks as we build the related tasks. |

Reuse the scaffold, UI components and query setup. We don't need another lint setup. `design/mockups/generate.py` generates the prototype, and `design/mockups/style.css` has the design tokens. Keep the app usable with a keyboard, on smaller screens and with reduced motion. The notes still need to be readable.

## Data we need

| Record | What it needs to hold |
| --- | --- |
| profiles | Auth user ID, name and role. New users default to student; client metadata mustn't grant instructor access. |
| courses / enrolments | The instructor who owns each course and its students. Emails without an account need a clear pending-invitation flow. |
| assignments | Course, title, brief, due date and Lane 1/Lane 2. |
| projects | One project per student/assignment, draft/submitted state, submission time and analysis state/version/error/timestamps. |
| iterations | Stable step ID, order, AI tool, prompt, raw answer, critique, import source and student-marked error evidence. |
| final_versions | One current saved final per project, extracted text and the filename if there is one. |
| analysis results / flags | The submitted version checked, three-question results, evidence, explanation, model/rubric version and uncertainty. |
| grader_notes / review decisions | Private notes and open/dismissed/added-to-feedback decisions, with the reviewer, time and previous decisions. |
| usage accounting | Budget reserved before calls, actual token use and limited retries. |

Save or calculate match results for the exact saved or submitted text, with a version attached. The schema task decides the table layout and constraints. These are requirements; the migrations aren't done yet. Choose what happens when a record is deleted instead of adding cascade deletion everywhere.

Check access in both RLS and server code, including views, privileged operations, import and export. Students can only access their own Lane 2 drafts for assignments they're enrolled in. They can't change submitted text. Instructors can only access their courses and can't edit student text. Flags, question results and grader notes are instructor-only. Keep analysis credentials out of browser code. Block Lane 1 logging on the server/database as well as in the UI.

## How the flow works

1. The student or instructor signs in with a magic link. New profiles default to student, and the app sends each user to the right pages based on their role.
2. An enrolled student opens a Lane 2 assignment. Opening it again reuses the same project.
3. The student imports a supported share link or pastes manually, then checks the ordered steps. Restrict hosts and redirects, block private-network requests, and limit fetch size and time. Don't overwrite critiques or import the same saved steps twice.
4. The student writes critiques, optionally marks errors, saves steps and reviews My log. They save or import the final essay. A failed save mustn't lose what they typed.
5. Submit checks every included step and the final essay, then locks the saved text in one database operation and starts analysis. Repeated requests mustn't submit twice. An AI-provider failure mustn't lose the submission.
6. Text matching and reflection checks finish or show an error the user can retry. Keep the previous results and grader decisions until re-analysis succeeds.
7. The grader opens the queue, selects a submission and reads the matched passages, steps and evidence. They can add a private note, dismiss a flag or add it to feedback.
8. PDF and CSV use the same saved text, numbers and decisions. Escape spreadsheet formulas in CSV. Don't expose private notes to students or through public caches.

## Screens and tasks

| Prototype | Tasks |
| --- | --- |
| `01-sign-in.html` | F5 sign-in and session routing; F9 shared shell |
| `02-student-dashboard.html` | S1 assignment lanes and progress; S6 setup |
| `03-student-workspace.html` | S2 import/manual entry, critique and save; S7 privacy notice |
| `03b-student-log.html` | S3 linked log; S4 final essay; S5 submission |
| `04-instructor-overview.html` | I1 metrics; I2 review queue |
| `05-submissions.html` | I3 search, filters, metrics and status |
| `06-process-visualiser.html` | I4 final-text highlights and retained-word chart; I5 step evidence/notes |
| `06b-flagged-step.html` | L1 rubric; L2 analysis; L3 review decisions |
| `07-pdf-report.html` | L6 PDF/CSV and export options |

Use the screenshots in `design/screenshots/` to compare the app with the prototype. Matching a screenshot doesn't prove that sign-in, saving or analysis works. If we change the design, update the generator rather than editing the generated HTML on its own.

## Team and order

Keep the current issue owners and assignees. M1 handles frontend, M2 data, M3 dashboard and report coordination, and M4 AI/platform. Some tasks cross those areas, so check the issue owner and coordinate shared schema, metrics and UI changes. Everyone contributes to the report.

| Milestone | Done when |
| --- | --- |
| M1 Foundation | Seeded students and instructors can sign in locally and reach the right shell. Schema, RLS and repo checks pass. |
| M2 Student flow | Import/manual entry → critique → My log/final essay → saved and locked submission works. Lane 1 blocks AI logging. |
| M3 Instructor flow | Queue → submission → matched essay/step evidence → saved private note works, with the same numbers on each screen. |
| M4 Checks and export | Analysis can recover from errors, dismiss/feedback decisions persist, and authorised PDF/CSV exports match the app. |
| M5 Testing | High-severity findings are fixed and retested. Access checks and the full-flow CI smoke test pass. |
| M6 Final handover | We set up hosting when ready, verify the release, finish maintainer docs, rehearse the demo and check the Final Report against the official rubric. |

Follow the actual GitHub blockers. Once foundation tasks allow it, student features and shared metrics can run in parallel. Rubric and export work can also start when their own blockers are done. The final-essay preview needs matching; we can build the editor first, but it must say when match results aren't available. Add review counts once reflection results exist. Keep collecting docs and report evidence throughout. Sprint groups don't add extra blockers.

## What we need to check

- Seed realistic, consistent examples: Lane 1, an untouched draft, imported steps waiting for critiques, a short specific critique, a thin critique, overlapping matches and pending/failed/reviewed analysis. Don't hardcode the prototype's percentages.
- Test parsing, matching, validation, access, submission locking and saved reviews with unit, SQL and integration checks. Mocked LLM tests check response handling; separately run labelled examples against the live model to check quality and cost.
- Run a student-to-grader flow in CI with Playwright and fixed analysis examples, including export downloads. Passing with mocked responses doesn't prove the live provider or hosted app works.
- Test with proxy students and graders. Record who took part, what they tried, timing, confusion and retest results. A finished prototype doesn't mean we've tested with real university users.
- Check third-party processing notices, secrets, text logging, import/file limits, exports and retention. Only promise deletion behaviour we've built and checked.
- Get the actual course requirements and dates before calling the final submission ready. Check model support, accuracy and the release rather than assuming them.
