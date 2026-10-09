# AI-Interaction Analytics

INFOMGMT 399 capstone (Proposal 1). Students log each AI iteration of an assignment (prompt, raw AI output, critique). Graders get a Process Visualiser that charts the iteration timeline, colour-codes human vs AI text, flags thin critiques with an LLM, and exports a PDF report.

Plan: [docs/plan.md](docs/plan.md). Issues: [docs/issue-plan.json](docs/issue-plan.json) and the GitHub tracker. Mockups: [design/mockups](design/mockups), screenshots in [design/screenshots](design/screenshots). Product film (100 s, 1080p60): [design/ai-interaction-analytics-showcase.mp4](design/ai-interaction-analytics-showcase.mp4).

## Stack

Next.js 16 (App Router, TypeScript), Tailwind CSS 4, shadcn/ui on Base UI, Supabase, Anthropic API, Vercel. Package manager is bun. Linting and formatting run through Vite+ (`vp`) with Ultracite presets in `vite.config.ts`.

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

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `bun dev`           | Start the dev server                           |
| `bun run db:start`  | Start local Supabase without Docker            |
| `bun run db:stop`   | Stop local Supabase, preserving data           |
| `bun run db:status` | Show local service URLs and keys               |
| `bun run build`     | Production build                               |
| `bun run check`     | `vp check` with Ultracite presets, report only |
| `bun run fix`       | `vp check --fix` with Ultracite presets        |
| `bun run typecheck` | `next typegen` then `tsc --noEmit`             |

## Data fetching

TanStack Query is wired in `src/app/providers.tsx` with one `QueryClient` per request on the server (`src/lib/query-client.ts`). Pages prefetch in a server component with `getQueryClient().prefetchQuery(...)`, wrap the client tree in `HydrationBoundary` with `dehydrate(queryClient)`, and client components call `useQuery` with the same key. Per-user data stays dynamic under Suspense; Cache Components and Partial Prefetching (on in `next.config.ts`) cache the static shell.

## Adding UI components

shadcn is configured for Base UI (`components.json`, style `base-nova`). Add components with:

```bash
bunx shadcn@latest add <component>
```

Components land in `src/components/ui/`.

## Design

The product sits on a light sky canvas: white cards, paper sheets for documents and AI output, and sticky notes for what people write about them (yellow for a student critique, pink for a reflection-check flag, mint for an AI error caught, sky for a grader note). Blue is everything the AI wrote and tangerine everything the student wrote. Every critique answers the same three questions the reflection check uses, and the grader's headline number is how much of the final essay is the student's own writing. Motion is short and purposeful: content blurs and rises in, notes are stuck on with a spring. See `design/mockups/style.css` for the tokens the app maps onto shadcn's CSS variables.
