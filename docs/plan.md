# Project plan: AI-Interaction Analytics

INFOMGMT 399 capstone (Proposal 1). Build the existing design prototype into a working app where students log AI conversations and reflect on each step, and graders review the process behind the final essay.

## Current baseline

The nine static screens, design tokens, screenshots and showcase film exist under `design/`. The Next.js app has its scaffold, shared Base UI components and TanStack Query provider; its home page still shows “Sign in (coming soon)”. Auth, persistence, import, matching, reflection checks, review decisions and exports are implementation work, not completed prototype features. The scaffold issue is already closed and stays closed.

The task source is [issue-plan.json](issue-plan.json), with stable keys and links to all 45 existing GitHub issues. Keep existing member labels, native hierarchy and blocked-by relationships, including the hosted-deployment task moved to the final milestone. Do not confuse sprint grouping with a requirement to finish every task in one sprint before starting independent work elsewhere.

Develop and verify against local Supabase until the team decides to deploy. Use the configured Docker-free CLI runtime where supported, with a documented container fallback. Hosted Supabase/Vercel setup belongs to the final milestone and does not block local development.

## Product scope

- Students see assignment cards with Lane 1 (AI restricted) or Lane 2 (AI allowed), due dates and progress. Lane 1 has assignment details but no AI logging.
- Lane 2 Add steps follows import → critique → save. Import a supported public chat share link, preview ordered prompt/answer pairs, then critique each step. Manual paste is always available when an import is unsupported or fails.
- Every critique uses the same three questions: **Was the AI right or wrong? How did you check? What did you change?** Require non-empty reflection, not an arbitrary 150-character minimum. A short specific critique can be useful. Student-marked AI errors remain student-reported evidence.
- My log links every saved prompt, raw output, critique and provenance. Drafts can be edited; submitted text cannot.
- Students type a final essay or import a validated `.docx`, review its extracted text and logged-AI matches, then submit a complete saved snapshot.
- Graders see a review-first cohort queue, a searchable submissions table, final-essay match highlighting, per-step retained AI text and critique evidence. They can save private notes and dismiss flags or add them to feedback.
- Export the same reviewed evidence as PDF or step CSV, with optional prompt history and grader notes for the PDF.
- Prepare the Final Report, demo and handover. Reports 1 and 2 are already submitted. Final Report rubric, presentation length and dates still need the official course specification.

Out of scope: automatic grading, misconduct verdicts, proof of authorship, LMS integration, private-account chat capture and additional chat providers without an explicit follow-up scope. Public-link import is limited to verified supported formats and never requires students’ provider credentials.

## Interpretation contract

The headline percentage is **final-essay words that match none of the logged AI answers**. It is not a count of prompt/critique characters, an AI-detector score or proof that a student wrote the unmatched words. Paraphrased or unlogged AI text may be unmatched.

Use one versioned matcher for student preview, cohort metrics, visualiser and exports. Define normalisation and minimum match spans, retain source step IDs and original-text offsets, and count overlapping final words once. Attribute shared matches deterministically so per-step retained-word bars reconcile with the essay total. Test zero/all matches, repeated outputs, punctuation, empty input and stale results after edits.

The reflection check returns evidence against the three questions and possible low-effort/blind-accept observations. Results are advice for a grader. Any suggestion of AI-written reflection is explicitly uncertain, never a confirmed flag of misconduct. A student finding no error can still provide a strong critique by describing verification. Pending, failed and completed-with-no-flags analysis are different states.

## Stack and implementation constraints

| Layer | Baseline / planned choice |
| --- | --- |
| App | Installed Next.js 16 App Router, TypeScript and bun; read the installed Next.js guides before implementation |
| UI | Tailwind 4, existing shadcn/ui on Base UI, prototype tokens and accessible HTML/SVG; add a chart library only when needed |
| Reads | Existing TanStack Query provider and query-client helper; authorised per-user dynamic reads |
| Data and auth | Supabase Postgres, magic-link Auth and RLS |
| Reflection | Server-only Anthropic client, validated structured results and versioned rubric; verify a supported model during implementation |
| Export | Server-side PDF renderer verified locally and, before release, on the deployment target, plus spreadsheet-safe CSV |
| Hosting | Vercel previews and production with separate configuration and auth callbacks |
| Checks | Existing `bun run check`, `bun run typecheck`, `bun run build`; SQL/integration checks and Playwright as their tasks land |

Do not recreate the scaffold or add a second lint stack. Reuse existing UI primitives and query setup. The prototype is generated from `design/mockups/generate.py`; `design/mockups/style.css` is its design-token reference. Preserve keyboard access, readable notes, narrow layouts and reduced motion when porting the visuals.

## Data model to implement

| Record | Required fields / responsibilities |
| --- | --- |
| profiles | Auth user ID, identity and role; student is the default, instructor role is never granted from client metadata |
| courses / enrolments | Instructor ownership and student membership; unknown enrolment emails need a deliberate pending-invitation path |
| assignments | Course, title, brief, due date and Lane 1/Lane 2 |
| projects | Student/assignment uniqueness, draft/submitted status, submission time, analysis state/version/error/timestamps |
| iterations | Stable ID, ordered step number, tool, prompt, raw output, critique, import provenance and student-marked error evidence |
| final_versions | One current saved final per project, extracted text and optional source filename |
| analysis results / flags | Snapshot version, three-question results, evidence, rationale, model/rubric version and uncertainty |
| grader_notes / review decisions | Course-authorised private notes; open/dismissed/added-to-feedback state, reviewer and timestamp, preserved review history |
| usage accounting | Atomic budget reservations, actual token use and bounded retries |

Store or derive versioned text-match results for the saved/submitted snapshot. The schema task owns the exact relational layout and constraints; this plan specifies the product contract, not a migration already applied. Choose deletion behaviour explicitly rather than cascading every foreign key indiscriminately.

RLS and server checks cover tables, views, privileged operations, imports and exports. Students can access only their own enrolled Lane 2 drafts and cannot alter submitted text. Instructors access only their courses and cannot edit student text. Flags, question results and grader notes are instructor-only. Analysis credentials never reach browser bundles. Lane 1 logging is rejected on the server/database as well as hidden in the UI.

## Data flow

1. Magic-link sign-in creates a safely defaulted profile and routes by authorised role.
2. An enrolled student opens a Lane 2 assignment; repeated visits reuse one project.
3. A supported share link yields previewed ordered pairs, or the student pastes manually. Share fetching uses host/redirect restrictions, private-network protection and bounded size/time. Import never overwrites a saved critique or duplicates previously saved steps.
4. The student critiques and optionally marks error evidence, saves steps, reviews My log and saves/extracts final text. Save failures preserve input.
5. Submit validates all included steps and final text, atomically freezes the snapshot and starts analysis. Duplicate requests are idempotent; provider failure does not lose the submission.
6. Matching and reflection analysis record complete or recoverable error states. Re-analysis preserves prior results and grader decisions until a replacement succeeds.
7. The instructor follows queue → submission → matched passage/step → evidence, then records a private note or flag decision.
8. PDF/CSV export reads the same authorised snapshot, metrics and decisions. Spreadsheet formulas are escaped in CSV; private notes never leak to students or public caches.

## Screens and task ownership

| Prototype | Build tasks |
| --- | --- |
| `01-sign-in.html` | F5 sign-in and session routing; F9 shared shell |
| `02-student-dashboard.html` | S1 assignment lanes and progress; S6 setup |
| `03-student-workspace.html` | S2 import/manual entry, critique and save; S7 disclosure |
| `03b-student-log.html` | S3 linked log; S4 final essay; S5 submission |
| `04-instructor-overview.html` | I1 metrics; I2 review queue |
| `05-submissions.html` | I3 search, filters, metrics and status |
| `06-process-visualiser.html` | I4 final-text highlights and retained-word chart; I5 step evidence/notes |
| `06b-flagged-step.html` | L1 rubric; L2 analysis; L3 review decisions |
| `07-pdf-report.html` | L6 PDF/CSV and export options |

Screenshots live in `design/screenshots/`. Compare freshly captured app screens to these references; screenshot similarity alone does not verify auth, persistence or analysis. Update the generator when design changes are intended, rather than editing generated HTML independently.

## Team and implementation order

Keep existing issue member labels and assignees. M1 handles frontend, M2 data, M3 dashboard and report coordination, and M4 AI/platform; individual issue ownership may cross these areas. Coordinate schema, shared metrics and UI files. Everyone contributes report evidence.

| Milestone | Completion checkpoint |
| --- | --- |
| M1 Foundation | Seeded student/instructor sessions reach the correct shell on localhost; schema/RLS and repository checks pass |
| M2 Student flow | Import/manual entry → critique → My log/final text → locked persisted submission; Lane 1 disallows logging |
| M3 Instructor flow | Queue → submission → matched essay/step evidence → persisted private note, with consistent metrics |
| M4 Checks and export | Recoverable analysis, persistent dismiss/feedback decisions and authorised PDF/CSV agreeing with the app |
| M5 Testing | High-severity findings fixed and retested; access checks and full-flow CI smoke test pass |
| M6 Final handover | Hosted Supabase/Vercel setup when ready, verified release, maintainer setup, rehearsed demo and rubric-mapped Final Report |

Native dependencies remain the execution source of truth. After foundation prerequisites, student work and shared metrics can progress in parallel; rubric and export preparation can also proceed when their own blockers allow. The matching task is required for the final-essay preview, even if the final editor is built first with an explicit unavailable state. Review counts can be integrated after reflection results exist. Documentation and report evidence collection run throughout. Tracker issues explain phases without introducing artificial sprint-wide blockers.

## Verification and limits

- Seed coherent scenarios instead of hardcoding prototype percentages: Lane 1, untouched draft, imported pending steps, short specific critique, thin critique, overlapping matches and pending/failed/reviewed analysis.
- Unit/SQL/integration checks cover deterministic parsing, matching, validation, role access, atomic submission and review persistence. Mocked LLM tests verify response handling; live labelled evaluations separately assess quality and cost.
- CI Playwright verifies a student-to-grader flow with deterministic analysis fixtures and export downloads. A passing mocked flow does not prove the live provider or production deployment works.
- Run proxy-student and proxy-grader sessions and record participants, tasks, timing, interpretation errors and retests honestly. No real university-user evidence exists merely because the prototype looks complete.
- Audit third-party disclosure, service credentials, text logging, import/file limits, exports and retention. Publish only retention behaviour that is implemented and verified.
- Confirm actual course report requirements and dates before claiming final submission readiness. No deadline, model availability, measured accuracy or release success is assumed by this plan.
