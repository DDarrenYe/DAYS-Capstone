# Testing the main journey

This is what we ran on the main journey: a student logs and submits, then an instructor reviews and exports. Every result below is what we saw on 2026-10-19, not what we expected to see. It's a hand-run test by one person, so it's not the same as the proxy-user sessions in [#37](https://github.com/DDarrenYe/DAYS-Capstone/issues/37) and [#38](https://github.com/DDarrenYe/DAYS-Capstone/issues/38), which are still open.

## How we ran it

- **Local stack:** `PORTLESS=0 bun dev` on a freshly seeded database (Next.js 16.4.0, local Supabase). `.env.local` had no `LLM_*` values, on purpose, so the reflection check can't run.
- **Browser:** Chrome, driven from the command line. Student and instructor were separate sessions.
- **Accounts:** `student@example.com` and `instructor@example.com` with the demo password from the [README](../../README.md).
- **Deployed app:** we signed in on https://days-capstone.vercel.app and only read. We didn't submit or change anything there.

## The journey

1. The student opens **Essay 2: The two-lane model** from Assignments.
2. They critique the two steps that are waiting, add one step by pasting text, and write the final essay.
3. They submit. The log locks.
4. The instructor opens the new submission from Submissions, reads it in the Visualiser, and downloads a PDF and a CSV.

## Test scenarios

| # | Input | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| T1 | Step 4 (waiting). Verdict "Partly", check "I checked the University of Auckland two-lane page and the model was introduced in 2023, not 2022 as the answer says.", change "Changed the year to 2023 and kept the Lane 1 and Lane 2 definitions." Save step. | The step moves from Waiting to Saved. | The counts changed from Saved 3 / Waiting 2 to Saved 4 / Waiting 1, and the log moved on to step 5. The save wrote the three answers into one critique. | Pass |
| T2 | Step 5 (waiting). First only the verdict "Right". Then the check and the change filled in, but no verdict. Then all three. | Save stays off until all three are answered. | Disabled with only a verdict. Disabled with the check and the change but no verdict. Enabled once all three were there, and the step saved (Saved 5). | Pass |
| T3 | Add steps, Share link: `https://example.com/share/6f2a91c0-1111-4222-8333-444455556666`. Preview. | A refusal that points to pasting. | "Only ChatGPT share links (chatgpt.com/share/…) can be imported. Paste other chats below." Nothing was saved. | Pass |
| T4 | Add steps, Paste text. Asked: "Write one sentence on why graders need the prompt history." Answered: "Graders need the prompt history because the final essay alone does not show how a student questioned, checked and changed what the AI produced." | A new step 6 that waits for a critique. | Step 6 appeared under "Waiting for your critique" (All 6, Saved 5, Waiting 1). | Pass |
| T5 | Final version. A 49-word essay: step 3's first AI sentence copied word for word (25 words) plus one sentence of our own (24 words). | 25 of 49 words match, so 49% is not from logged AI. | "25 of 49 words match", "49%", and "It saves as you type. Saved at 3:55 PM". | Pass |
| T6 | Submit while step 6 still has no critique. | Submit stays off and says why. | "Submit log" was disabled with "Add a critique to step 6." | Pass |
| T7 | Critique step 6 (verdict "Right", a check, a change), open Final version, Submit log, confirm "Submit your log?". | The log is submitted and locked. The reflection check can't run without `LLM_*`, but the submission must stand. | "This log is submitted, so your final version is locked." and a "Submitted" label. The server log shows `submitProject` succeeding and then "Reflection check failed … LLM_BASE_URL, LLM_API_KEY and LLM_MODEL are required for the reflection check." | Pass |
| T8 | Instructor opens Submissions, then the Visualiser for the new submission. | One more submission, with the same 49% on every screen and the check shown as failed. | The assignment showed 6 submissions (the seeded data, and the deployed app, have 5). The table row reads 6 steps, 49%, critique score 2.0 / 3, "Check failed". The Visualiser reads "Not from logged AI 49%", "25 of 49 words match a logged AI answer. 24 don't (49%)", "Check failed. The reflection check failed. Try again." and a "Run check again" button. The student's preview, the table and the Visualiser agree. | Pass |
| T9 | Download the CSV for that submission as the instructor. | One row per step, with spreadsheet-safe text. | 200, `text/csv; charset=utf-8`, `Cache-Control: private, no-store`. A header row and 6 step rows, starting `student,email,course,assignment,check,step,logged_at,title,ai_words,words_in_essay,critique_words,questions_answered,…`. The check column reads "Check failed". | Pass |
| T10 | Download the PDF for the same submission. | A PDF. | 200, `application/pdf`, 26,333 bytes, starting with `%PDF-`. We haven't opened it to look at the layout. | Partly |

### Other users and bad requests

| # | Input | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| T11 | A signed-in student opens `/instructor`. | Sent back to the student pages. | Redirected to `/student`. | Pass |
| T12 | The same student requests the export URL. | Refused, and not cached. | 403 with `Cache-Control: private, no-store`. | Pass |
| T13 | A signed-out request for the export URL. | Sent to sign-in. | 307 to `/`. | Pass |
| T14 | As the instructor: `format=xml`, then `notes=maybe` (not a yes or a no), then a project id that doesn't exist. | 400, 400, 404. | 400, 400, 404. | Pass |
| T15 | The Lane 1 assignment (Lab 4: Database design) on the student's Assignments page. | No way to start an AI log. | The card has a Details button and no Add steps or My log link. We checked the card only. The database rule that blocks a Lane 1 project is covered by `supabase/tests`. | Partly |

### Deployed app, read only

| # | Input | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| T16 | Sign in on https://days-capstone.vercel.app as the student, then as the instructor. | Both reach their own pages with the seeded data. | The student sees three assignments (Reflection 1, Essay 2, Lab 4). The instructor sees "Essay 2: The two-lane model", 5 submissions, 2 with open flags (John Doe and Alex Kim), and "Sam Lee (check failed) · Priya Shah (check pending)". | Pass |
| T17 | As the instructor, request the CSV and the PDF of a seeded submission (`40000000-0000-0000-0000-000000000002`), and `format=xml`. | The same behaviour as local. | CSV: 200, 3,221 bytes. PDF: 200, 31,071 bytes, `%PDF-1.3`. Both `private, no-store`. `format=xml` gave 400. | Pass |

## Automated checks

| Command | Result |
| --- | --- |
| `bun run test` | 297 pass, 0 fail, in 35 files. |
| `bun run db:test` | 350 tests in 10 files pass on a freshly seeded database. |
| `bun run test:integration` | 23 pass in 2 files, including the check that no production client bundle contains the service-role key. |
| `bun run typecheck` | Passes. |
| `bun run build` | Passes. |

## What these don't show

- **The reflection check against the real model.** We left `LLM_*` unset, so T7 and T8 only show the failure path. The real model is measured in [flagging.md](../flagging.md#evaluation), not here. We don't know yet whether the deployed app has the `LLM_*` variables set.
- **A person other than us using the app.** One person ran every scenario. We haven't seen anyone get confused, which is what #37 and #38 are for.
- **How the PDF looks.** We checked that the file comes back and that it's a PDF, not the fonts or the page breaks.
- **Two sessions at once, large logs and slow networks.** The SQL and integration tests cover simultaneous submits and analysis claims. We didn't try them in the browser.
- **The deployed write path.** Submitting on the deployed app is permanent, so we only read there.

## Things we ran into

- `bun run db:test` failed 6 of 33 subtests in `seed_scenarios.sql` right after we ran the journey by hand. It passed after `bun run db:reset`. We think the submission we made changed the seeded rows those tests count, but we didn't check which rows. Run `bun run db:reset` before `bun run db:test` if you've clicked around.
