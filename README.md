# AI-Interaction Analytics

INFOMGMT 399 capstone (Proposal 1). Students log each AI iteration of an assignment (prompt, raw AI output, critique). Graders get a Process Visualiser that charts the iteration timeline, colour-codes human vs AI text, flags thin critiques with an LLM, and exports a PDF report.

Plan: [docs/plan.md](docs/plan.md). Issues: [docs/issue-plan.json](docs/issue-plan.json) and the GitHub tracker. Mockups: [design/mockups](design/mockups), screenshots in [design/screenshots](design/screenshots). Product film (100 s, 1080p60): [design/ai-interaction-analytics-showcase.mp4](design/ai-interaction-analytics-showcase.mp4).

## Stack

Next.js 16 (App Router, TypeScript), Tailwind CSS 4, shadcn/ui on Base UI, Supabase, Anthropic API, Vercel. Package manager is bun. Linting and formatting run through Vite+ (`vp`) with Ultracite presets in `vite.config.ts`.

## Setup

Requires [bun](https://bun.sh) 1.3 or newer.

```bash
bun install
bun dev
```

Open http://localhost:3000.

Supabase and Anthropic environment variables are added in later issues; see `.env.example` once it exists.

## Scripts

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `bun dev`           | Start the dev server                           |
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
