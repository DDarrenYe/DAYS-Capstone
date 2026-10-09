<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## App Router architecture

- Use `layout.tsx` for persistent shared UI and `page.tsx` for route content and data composition. Extract shared components when callers actually reuse them.
- Default to Server Components. Keep browser hooks and interactive state in small client modules; passing server-rendered children through a client provider preserves their server ownership.
- Scope providers to the routes that consume them. Public pages should not require the role application’s query provider.
- Add `loading.tsx` when a route needs a meaningful async fallback. It covers the page and descendants below its layout; runtime reads in that layout need their own focused `<Suspense>` boundary.
- Place `error.tsx` at the route boundary that should recover. It is a Client Component and does not catch its own layout’s errors. Use component-level boundaries when sibling panels should recover independently.
- Keep static UI outside request-time reads. Use `use cache` with `cacheLife` for reusable async data and invalidate it after mutations. Session data and authorization belong in server data access; choose cache keys and private scopes deliberately.
- Use default `Link` prefetching for shared shells. Opt into `prefetch={true}` when cached URL-specific content is worth fetching before the click. Fix instant-navigation insights at the offending read or boundary.
- Use parallel routes for independently navigable slots and intercepted routes for URL-addressable overlays. Provide slot fallbacks for hard navigation. Use route groups for organization without changing URLs.
- Preserve drafts and view state with the framework’s Activity behaviour. Reset transient menus explicitly; add `template.tsx` only when the whole segment should remount.
- Keep `src/components/ui` generic: component variants own visual styles, while route callers own page geometry. Use Tailwind theme tokens and canonical utilities, and import `cn` from `@/lib/utils`. Express coupled font size and themed line-height together, such as `text-base/paper`, so class sorting cannot change the override.

## Read before matching changes

Resolve these guides under `node_modules/next/dist/docs/`; use the installed version and locate moved guides with `rg --files`.

- Route/component structure: `01-app/01-getting-started/03-layouts-and-pages.md`, `01-app/01-getting-started/05-server-and-client-components.md`, and `01-app/02-guides/server-and-client-boundary.md`.
- Loading/error placement: `01-app/03-api-reference/03-file-conventions/layout.md`, `01-app/03-api-reference/03-file-conventions/loading.md`, `01-app/03-api-reference/03-file-conventions/error.md`, and `01-app/03-api-reference/03-file-conventions/template.md`.
- Data, PPR, caching, and navigation: `01-app/01-getting-started/08-caching.md`, `01-app/02-guides/instant-navigation.md`, `01-app/02-guides/adopting-partial-prefetching.md`, and `01-app/02-guides/optimizing-prefetching.md`.
- Advanced routing/state: `01-app/03-api-reference/03-file-conventions/parallel-routes.md`, `01-app/03-api-reference/03-file-conventions/intercepting-routes.md`, `01-app/03-api-reference/03-file-conventions/default.md`, and `01-app/02-guides/preserving-ui-state.md`.
- Authentication or sensitive data: `01-app/02-guides/authentication.md`, `01-app/02-guides/authentication-with-cache-components.md`, and `01-app/02-guides/data-security.md`.
- Theme/class merging: `node_modules/cn/README.md` and [the official cn build guide](https://github.com/shadcn-ui/cn/blob/main/docs/build-setup.md). The Next config generates merge tables from the app’s `@theme`; keep generated tables out of Git.
- Menus, dialogs, or other interactive primitives: locate the component and composition guidance in [Base UI’s docs index](https://base-ui.com/llms.txt), then check the installed types. Preserve the primitive’s keyboard, dismissal, focus, and render-prop contracts.

After changes, run the repository’s lint, unit test, typecheck, and build scripts. For rendering or routing changes, also check Next.js dev diagnostics and production prefetch/navigation behaviour. A passing static build does not verify runtime streaming, authorization, or CI browser coverage.
