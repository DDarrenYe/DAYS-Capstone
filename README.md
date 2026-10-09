# AI-Interaction Analytics

This is our INFOMGMT 399 capstone (Proposal 1). Students import or paste their AI chats, critique each step using three questions, and submit the final essay. Graders can see which parts match the logged AI answers, read the reflection checks, add notes or feedback, and export a PDF or CSV. Unmatched text doesn't prove who wrote it.

Plan: [docs/plan.md](docs/plan.md). Issues: [docs/issue-plan.json](docs/issue-plan.json) and the GitHub tracker. Mockups: [design/mockups](design/mockups), screenshots in [design/screenshots](design/screenshots). Product film (100 s, 1080p60): [design/ai-interaction-analytics-showcase.mp4](design/ai-interaction-analytics-showcase.mp4).

## Current status

We have the nine-screen prototype and showcase ready. The app has the Next.js scaffold and shared UI, but we still need to build sign-in, saving data, chat import, text matching, reflection checks, grader decisions and exports. The plan follows the existing 45 GitHub issues; the scaffold task is already done.

## Stack

We use Next.js 16 (App Router, TypeScript), Tailwind CSS 4, shadcn/ui with Base UI, Supabase, the Anthropic API, and Vercel. Bun handles packages. Vite+ (`vp`) runs linting and formatting with the Ultracite presets in `vite.config.ts`.

## Setup

Requires [bun](https://bun.sh) 1.3 or newer. Supabase runs locally; no hosted Supabase project, login, or Vercel deployment is needed.

The Docker-free runtime supports Apple silicon Macs on macOS 14+ and Linux x64/ARM64 with glibc 2.35+ and `tar`. The first start needs internet to download service binaries. The CLI is pinned because the native stack is experimental. See [Supabase's runtime guide](https://supabase.com/docs/guides/local-development/docker-and-native-runtimes).

```bash
bun install
bun run db:start
cp .env.example .env.local
```

Get this checkout's connection details:

```bash
bunx --no-install supabase status --env --output-format text --override-name API_URL=NEXT_PUBLIC_SUPABASE_URL,ANON_KEY=NEXT_PUBLIC_SUPABASE_ANON_KEY,SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY
```

Copy those three values into `.env.local`, then start the app:

```bash
bun dev
```

Open http://localhost:3000.

`bun run db:status` shows the local API, database, Studio, and Mailpit URLs. Ports are assigned per checkout and branch, so use the printed URLs rather than assuming default ports. Auth emails stay in Mailpit instead of going to real inboxes. Each teammate has their own database.

`.env.local` is ignored by Git. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; never prefix it with `NEXT_PUBLIC_` or put it in browser code. The app's Supabase clients, schema, and seed data are implemented in later issues; seeding is disabled until a seed exists.

Stop the stack with `bun run db:stop`; stopping preserves local data. Database resets and `supabase stack destroy` delete data. Changing branches selects a different stack; stop the current one before switching.

Windows and Intel Macs need Docker or Podman and can start with `bunx --no-install supabase start --runtime docker` (or `--runtime podman`) instead. A stack keeps its original runtime; don't switch an existing stack without backing up its data.

When we decide to deploy, create a hosted Supabase project, apply the committed migrations, configure hosted auth and environment variables, and deploy Next.js. Local test data doesn't move automatically. The planned Anthropic API is external even when the app runs locally; fully offline AI checks need mocked responses or a local model.

## Scripts

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `bun dev`           | Start the dev server                            |
| `bun run db:start`  | Start local Supabase without Docker             |
| `bun run db:stop`   | Stop local Supabase, preserving data            |
| `bun run db:status` | Show local service URLs and keys                |
| `bun run build`     | Build for production                            |
| `bun run check`     | Check formatting and lint with `vp check`       |
| `bun run fix`       | Fix formatting and lint with `vp check --fix`   |
| `bun run typecheck` | Generate Next.js types, then run `tsc --noEmit` |

## CI

GitHub Actions runs lint, typecheck, and build in parallel for every PR, push to `main`, and merge queue entry. All three jobs use `.github/actions/setup-bun` to install the Bun version from `package.json`, reuse cached downloads, and install from `bun.lock` without changing it. The build also caches Next.js. New runs cancel older runs for the same branch or PR.

`Verify` passes only when all three jobs pass. A repo admin needs to make it a required check for `main` in branch protection or a ruleset. Until then, failing CI won't block a merge.

## Data fetching

TanStack Query is set up in `src/app/providers.tsx`. On the server, `src/lib/query-client.ts` creates one `QueryClient` per request.

To load data, call `getQueryClient().prefetchQuery(...)` in a server component. Wrap the client components in `HydrationBoundary` with `dehydrate(queryClient)`, then call `useQuery` with the same key in those components.

Per-user data stays dynamic under Suspense. Cache Components and Partial Prefetching are enabled in `next.config.ts` to cache the static shell.

## Adding UI components

shadcn uses Base UI with the `base-nova` style in `components.json`. Add a component with:

```bash
bunx shadcn@latest add <component>
```

Components go in `src/components/ui/`.

## Design

The app uses a light sky background, white cards, and paper sheets for documents and AI output. Sticky notes hold comments: yellow for student critiques, pink for reflection-check flags, mint for AI errors caught, and sky for grader notes. AI text is blue; student text is tangerine.

Students and graders see the same three questions: was the AI right or wrong, how did you check, and what did you change? The main percentage shows how much of the final essay doesn't match any logged AI answer. It doesn't prove that the student wrote those parts.

Animations are short: content blurs and rises into view, and notes appear with a spring. See `design/mockups/style.css` for the design tokens mapped to shadcn's CSS variables.
