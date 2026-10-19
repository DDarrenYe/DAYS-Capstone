# AI-Interaction Analytics

This is our INFOMGMT 399 capstone (Proposal 1). The app is called Pentimento. Students import or paste their AI chats, critique each step using three questions, and submit the final essay. Graders can see which parts match the logged AI answers, read the reflection checks, add notes or feedback, and export a PDF or CSV. Unmatched text doesn't prove who wrote it.

Where to look:

- [docs/plan.md](docs/plan.md): scope, the numbers and the milestones.
- [docs/architecture.md](docs/architecture.md): schema, data flow, access and export.
- [docs/flagging.md](docs/flagging.md): the reflection check, its limits and how well it works.
- [docs/testing/main-journey.md](docs/testing/main-journey.md): what we ran on the main journey, with inputs and results.
- [docs/final-report/outline.md](docs/final-report/outline.md): the Final Report, presentation and demo, mapped to the course requirements.
- [supabase/README.md](supabase/README.md): the database contract.
- [DESIGN.md](DESIGN.md) and [design/](design/README.md): the design system, the earlier prototype and its film.
- The GitHub tracker has the 45 issues. [docs/issue-plan.json](docs/issue-plan.json) is the plan we made them from on 2026-10-08.

## Try it

The deployed app is at https://days-capstone.vercel.app. Vercel deploys `main` to production and gives every PR its own preview. It runs on a hosted Supabase project with the demo seed, so the same accounts work there and on a local stack.

| Role       | Email                    | Password             |
| ---------- | ------------------------ | -------------------- |
| Student    | `student@example.com`    | `Capstone-demo-399!` |
| Instructor | `instructor@example.com` | `Capstone-demo-399!` |

The other students are `john.doe@`, `alex.kim@`, `jane.roe@`, `sam.lee@`, `priya.shah@` and `tom.ng@` at `example.com`, with the same password. Use these accounts only. They are synthetic, and the password is public, so never reuse it for a real account or deploy this seed for real users.

To walk the main journey, sign in as the student, open **Essay 2: The two-lane model**, critique the two waiting steps, add a step by pasting text, write the final essay and submit. Then sign in as the instructor and open that submission from **Submissions**. A submitted log is locked. On a local stack, `bun run db:reset` puts the seed back; on the deployed app there's no undo, so do it once. [docs/testing/main-journey.md](docs/testing/main-journey.md) has the exact steps and what we saw.

## What works today

- **Sign-in:** password sign-in with role routing. Students land on `/student`, instructors on `/instructor`.
- **Student:** assignments from Supabase (Lane 1 has no AI log), and My log. In My log a student imports a ChatGPT share link or pastes a chat, critiques each step against the three questions, can mark an AI error, saves the final essay (typed or a `.docx`), sees how much of it matches their logged AI, and submits. A submitted log is locked.
- **Instructor:** Submissions (the review queue first, then the table), the Visualiser for one submission, Flags with dismiss and add-to-feedback decisions, private notes, Reports (PDF and step CSV) and Courses (create courses and assignments, enrol students by email).
- **Reflection check:** it runs when a student submits and needs the `LLM_*` variables. An instructor can run it again from the Visualiser.
- **Still example data:** the student Progress page and the figures on the landing page. Progress shows an "Example data" badge.
- **Not done yet:** sessions with proxy students and graders (#37, #38), the security audit (#39), the automated student-to-grader browser test (#41) and the demo rehearsal (#44).

## Stack

We use Next.js 16 (App Router, TypeScript), Tailwind CSS 4, shadcn/ui with Base UI, Drizzle ORM with Supabase Postgres/Auth, the Vercel AI SDK with an OpenAI-compatible LLM API (GLM from Z.ai), and Vercel. Bun handles packages. Vite+ (`vp`) runs linting and formatting with the Ultracite presets in `vite.config.ts`.

## Setup

Requires [bun](https://bun.sh) 1.3 or newer. Supabase runs locally, so you don't need a hosted project, a login or Vercel to run the app.

```bash
bun run setup
PORTLESS=0 bun dev
```

`bun run setup` installs packages from the lockfile and, if `.env.local` doesn't exist yet, starts this checkout's Supabase and writes its four connection values there. It never touches an existing `.env.local`, so it's safe to run again. `bun dev` starts Supabase, applies any pending migrations and runs Next.js. `PORTLESS=0` skips the proxy below and serves http://localhost:3000.

- **Supported machines:** Apple silicon Macs on macOS 14+ and Linux x64/ARM64 with glibc 2.35+ and `tar`. The first start needs internet to download the service binaries. The CLI is pinned because the native stack is experimental. See [Supabase's runtime guide](https://supabase.com/docs/guides/local-development/docker-and-native-runtimes).
- **Windows and Intel Macs:** they need Docker or Podman. Start with `bunx --no-install supabase start --runtime docker` (or `--runtime podman`). A stack keeps its original runtime, so don't switch an existing one without backing up its data.
- **Portless:** plain `bun dev` uses [Portless](https://portless.sh), which gives each checkout its own HTTPS address, like `https://days-capstone.localhost` for the main checkout and `https://chat-import.days-capstone.localhost` for a worktree on `feat/chat-import`. It needs Node.js 24 or newer. Run `bunx portless proxy start` once first. It binds port 443, trusts a local certificate and asks for your password, and that prompt scrolls away inside `bun dev`. If a URL doesn't load, run `bunx portless doctor` (and `bunx portless hosts sync` for Safari).
- **Services:** `bun run db:status` shows the local API, database, Studio and Mailpit URLs. Ports are assigned per checkout and branch, so use the printed URLs. Auth emails stay in Mailpit.
- **Stopping:** `bun run db:stop` keeps the data. `bun run db:reset` and `supabase stack destroy` delete it. Changing branches selects a different stack, so stop the current one first.

On a fresh stack the seed runs by itself. To keep existing data, apply `supabase/seed.sql` to the local database instead; it leaves rows that already exist alone and doesn't reset passwords. The seed builds the INFOMGMT 399 course, assignments, drafts, submissions and flag reviews, and `supabase/README.md` lists every scenario ID. `bun run db:test` expects the fresh seed, so run `bun run db:reset` first if you've clicked around.

### Environment variables

`.env.local` is ignored by Git, so don't commit it. Never put the service-role key in browser code.

| Variable | Used for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server Supabase clients | Written by `bun run setup`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server Supabase clients | The auth client uses this plus the signed-in user's session. |
| `SUPABASE_SERVICE_ROLE_KEY` | The reflection-check job | Server-only. Never prefix it with `NEXT_PUBLIC_`. |
| `DATABASE_URL` | Drizzle tooling and `getDb()` | Server-only. |
| `LLM_BASE_URL` | Reflection check | For example `https://api.z.ai/api/paas/v4`. Add it yourself. |
| `LLM_API_KEY` | Reflection check | A normal Z.ai pay-as-you-go key. A GLM Coding Plan key won't work, because Z.ai only allows that plan in its own coding tools. |
| `LLM_MODEL` | Reflection check | For example `glm-4.7-flash` (free). |
| `ANALYSIS_DAILY_TOKENS` | Daily token budget for the check | Optional. Defaults to 3,000,000. |

Without the three `LLM_*` values everything else works. A submission still goes through, and the Visualiser shows "The reflection check failed. Try again." We saw exactly that on a local stack with no `LLM_*` set (see the testing page).

### Sign-in and redirects

Password sign-in doesn't send an email. `proxy.ts` is an optimistic check: it reads the session cookie, saves refreshed cookies and sends signed-out visitors on `/student` or `/instructor` back to `/`. It never asks Supabase for the user or the role. The account menu in each shell calls `requireRole`, which verifies the user and reads the role from the profile in Postgres (not from user metadata), then sends a signed-out or wrong-role visitor to the right place. That check streams in behind its own `Suspense` boundary, so it doesn't hold up the page. Sign out is in the account menu. It reloads the page and clears text kept in the browser, so nothing carries over on a shared computer.

The shell check is not authorization. Every page that reads data and every mutation calls `requireRole` itself and relies on RLS. The server client is read-only while rendering; Server Actions use `createClient({ writeCookies: true })`.

There's no public signup and no self-service password reset. Users ask their instructor. Because sign-in is by password, no email redirect URLs are needed today. If we add confirmation or recovery emails, set the Supabase Site URL and redirect URLs to the deployed address and the preview addresses.

### Optional hosted email with Resend

If we add email confirmation, invitations or recovery, configure a verified sender domain and a Resend API key in Supabase's custom SMTP settings: host `smtp.resend.com`, port `465`, username `resend`, password the API key, and a sender address on the verified domain. Keep the key in Supabase, not in browser code. Turn off link tracking for auth emails, and check Supabase's auth email rate limits separately from Resend's quota. Local email tests use Mailpit. See [Resend's Supabase SMTP guide](https://resend.com/docs/send-with-supabase-smtp). Supabase Auth emails don't need the Resend SDK.

## Deploying

The deployed app is a Vercel project (`days-capstone`) connected to this repo, with a hosted Supabase project behind it. To set up another one:

1. Create a hosted Supabase project and apply the committed migrations in `supabase/migrations` (for example with `supabase db push`). Local data doesn't move.
2. Apply `supabase/seed.sql` only for a demo. It creates the accounts above.
3. In Vercel, set the variables from the table above for Preview and Production. `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` stay server-only.
4. The reflection check runs in Next's `after()` when a student submits or an instructor runs it again. `/student/log` and `/instructor/visualiser` set `maxDuration = 300`, so the host has to allow a function to run for 300 seconds.
5. Open the deployed URL, sign in with a demo account, and download a PDF and a CSV from a seeded submission.

To roll back, promote the previous deployment from the Vercel dashboard. Database migrations only go forward, so undoing one means writing a new migration. We haven't tried a rollback yet.

## Chat import

Only ChatGPT share links (`chatgpt.com/share/…`) can be imported. Anything else is refused with "Only ChatGPT share links (chatgpt.com/share/…) can be imported. Paste other chats below." If a link is deleted, blocked, too large or times out, the student gets a message and the Paste text tab as the fallback. Pasting works for any tool.

## Versions and limits

- **Matcher:** `words-6.v1`. A match is an unbroken run of 6 or more words from a logged AI answer.
- **Rubric:** `three-questions-v2`. Each run of the check gets its own version (`analysis-v1`, `analysis-v2`, …), and every result stores the model and rubric that made it.
- **Cost controls:** a log can have at most 20 steps and 30,000 characters per step, 3 checks can run at once, there is a 3,000,000-token budget per rolling 24 hours, 5 runs per submission per 24 hours, and 3 retries per model call. [docs/flagging.md](docs/flagging.md) explains each limit and what the user sees when one is hit.
- **Size limits:** final essay text up to 50,000 characters and a `.docx` up to 4,000,000 bytes.

## Known limitations

- The "not from logged AI" figure is not proof of authorship. Light editing can hide a copy, a paraphrase never matches, and a common six-word phrase can match. `docs/flagging.md` measured this on 12 cases.
- The reflection check misses thin critiques and sometimes flags a fine one. On 36 labelled steps it raised `blind_acceptance` with no false positives but caught only 5 of 9. It reads each step on its own, so it can't see patterns across a log.
- The Z.ai free model often answers "overloaded" (HTTP 429). We retry three times, then the check fails and an instructor runs it again.
- The PDF font has no Japanese, Chinese, Korean, Arabic or emoji, so those characters print as `?`. The CSV keeps the original text.
- We haven't tested with real students or graders yet, so we can't say how well people understand the figures.
- Instructors are promoted by an administrator, and enrolling by email never changes a role.

## Scripts

| Command | What it does |
| --- | --- |
| `bun run setup` | Install packages and write `.env.local` from this checkout's Supabase |
| `bun dev` | Start Supabase, apply migrations and run Next.js |
| `bun run db:start` | Start local Supabase without Docker |
| `bun run db:stop` | Stop local Supabase, keeping data |
| `bun run db:status` | Show local service URLs and keys |
| `bun run db:reset` | Reset this checkout's database, apply migrations and seed (deletes data) |
| `bun run db:test` | Run the SQL constraint and RLS tests (needs the fresh seed) |
| `bun run db:generate` | Generate SQL migrations from the Drizzle schema |
| `bun run db:migrate` | Apply pending local SQL migrations |
| `bun run db:types` | Regenerate `src/lib/supabase/database.types.ts` |
| `bun run db:check` | Check Drizzle migration snapshots |
| `bun run test` | Run the unit tests and the migration snapshot check |
| `bun run test:integration` | Run the database and bundle checks against the local stack (needs `.env.local`) |
| `bun run test:live` | Send five labelled steps to the real model in `.env.local` (uses tokens) |
| `bun run test:evaluation` | Run the 36-step evaluation against the real model (uses tokens, 14 to 19 minutes) |
| `bun run check` | Check formatting and lint with `vp check` |
| `bun run fix` | Fix formatting and lint with `vp check --fix` |
| `bun run typecheck` | Generate Next.js types, then run `tsc --noEmit` |
| `bun run typegen` | Generate Next.js route types |
| `bun run build` | Build for production |
| `bun run start` | Serve the production build |

### Build tooling and CI

Turborepo caches `typegen`, `typecheck`, `test`, `db:check` and `build` in `.turbo/cache` (1GB, 14 days; override with `TURBO_CACHE_MAX_SIZE` and `TURBO_CACHE_MAX_AGE`). Use `bun run build --force` to skip the cache. Docs and mockups don't invalidate typecheck or build. Lint still checks docs formatting. `.env*` files and declared variables only invalidate the Next.js tasks, so add any new server-side variable to the task `env` lists in `turbo.json`. Turborepo runs in its terminal UI with one log pane per task; set `TURBO_UI=0` for plain logs.

GitHub Actions runs `Lint`, `Typecheck`, `Test` and `Build` as separate jobs on every PR, every push to `main` and every merge queue entry. New runs cancel older runs for the same branch. `Verify` passes only when all four pass. A repo admin still needs to make it a required check for `main`; until then, failing CI won't block a merge.

## Data fetching

TanStack Query is set up in `src/app/providers.tsx`. On the server, `src/lib/query-client.ts` creates one `QueryClient` per request. To load data, call `getQueryClient().prefetchQuery(...)` in a server component, wrap the client components in `HydrationBoundary` with `dehydrate(queryClient)`, then call `useQuery` with the same key. Per-user data stays dynamic under Suspense. Cache Components and Partial Prefetching are on in `next.config.ts` to cache the static shell.

## Adding UI components

shadcn uses Base UI with the `base-nova` style in `components.json`. Add a component with `bunx shadcn@latest add <component>`. Components go in `src/components/ui/`.

## Design

The design system is Pentimento, and [DESIGN.md](DESIGN.md) is the source of truth for its colours, type, components and motion. Warm paper and ink neutrals do most of the work. Colour only carries meaning: cobalt for text that matches a logged AI answer, vermilion for a reflection-check flag, green for an AI error the student caught, and amber for work waiting on a grader. Anything a student wrote is set in a serif, so a grader always knows whose words they're reading.

Students and graders see the same three questions: was the AI right or wrong, how did you check, and what did you change? The main percentage shows how much of the final essay doesn't match any logged AI answer. It doesn't prove that the student wrote those parts.

Signed-in pages don't animate in, because graders open them dozens of times a session; motion comes from what you click. Tokens live in `src/app/globals.css`, and components add variants instead of being restyled where they're used. See [design/README.md](design/README.md) for the static reference pages and the earlier prototype.
