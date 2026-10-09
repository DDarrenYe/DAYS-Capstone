# AI-Interaction Analytics

INFOMGMT 399 capstone (Proposal 1). Students save the prompt, raw AI output, and their critique each time they use AI for an assignment. Graders can follow these steps in the Process Visualiser, see which text came from the student or AI, check critiques flagged by an LLM, and export a PDF report.

Plan: [docs/plan.md](docs/plan.md). Issues: [docs/issue-plan.json](docs/issue-plan.json) and the GitHub tracker. Mockups: [design/mockups](design/mockups), screenshots in [design/screenshots](design/screenshots). Product film (100 s, 1080p60): [design/ai-interaction-analytics-showcase.mp4](design/ai-interaction-analytics-showcase.mp4).

## Stack

We use Next.js 16 (App Router, TypeScript), Tailwind CSS 4, shadcn/ui with Base UI, Supabase, the Anthropic API, and Vercel. Bun handles packages. Vite+ (`vp`) runs linting and formatting with the Ultracite presets in `vite.config.ts`.

## Setup

Requires [bun](https://bun.sh) 1.3 or newer.

```bash
bun install
bun dev
```

Open http://localhost:3000.

Supabase and Anthropic setup will come later. We'll add the required environment variables to `.env.example` then.

## Scripts

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `bun dev`           | Start the dev server                            |
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

Every critique answers the same three questions used by the reflection check. The main number shown to graders is how much of the final essay the student wrote themselves.

Animations are short: content blurs and rises into view, and notes appear with a spring. See `design/mockups/style.css` for the design tokens mapped to shadcn's CSS variables.
