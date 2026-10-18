---
version: alpha
name: Pentimento
description: The design system for AI-Interaction Analytics, a Lane 2 grading tool where students log and critique their AI use and graders review the process.
colors:
  primary: "#18191B"
  on-primary: "#FAFAF8"
  neutral: "#F4F4F0"
  surface: "#FFFFFF"
  on-surface: "#151618"
  body: "#3B3D41"
  reading: "#26272A"
  muted: "#F3F3EF"
  muted-foreground: "#6B6D72"
  faint: "#9C9DA1"
  well: "#ECEBE6"
  border: "#E7E6E1"
  border-strong: "#D9D8D2"
  input: "#DCDBD5"
  human: "#2B2C30"
  human-soft: "#E6E5E0"
  traced: "#3E5FD0"
  traced-ink: "#2A45A6"
  traced-soft: "#DFE5FA"
  traced-wash: "#F2F4FD"
  traced-line: "#A9B8EE"
  traced-select: "#CDD7FA"
  flag: "#C8431B"
  flag-ink: "#A3350F"
  flag-soft: "#FBEDE7"
  flag-line: "#F0C3B1"
  caught: "#2C7A50"
  caught-soft: "#E5F1E9"
  review: "#C98A1B"
  review-ink: "#7A5410"
  review-soft: "#F6ECD5"
  error: "#C8431B"
typography:
  headline:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -0.022em
  display:
    fontFamily: Inter
    fontSize: 52px
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: -0.025em
  title:
    fontFamily: Inter
    fontSize: 21px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
  stat:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: 580
    lineHeight: 1.1
    letterSpacing: -0.025em
    fontFeature: '"tnum"'
  figure:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: 580
    lineHeight: 1.2
    letterSpacing: -0.02em
  heading:
    fontFamily: Inter
    fontSize: 13.5px
    fontWeight: 580
    lineHeight: 1.5
    letterSpacing: -0.012em
  body:
    fontFamily: Inter
    fontSize: 13.5px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: -0.003em
    fontFeature: '"cv11", "ss01", "ss03"'
  control:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 520
    lineHeight: 1.4
  meta:
    fontFamily: Inter
    fontSize: 12.5px
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: Inter
    fontSize: 11.5px
    fontWeight: 520
    lineHeight: 1.4
  reading:
    fontFamily: Newsreader
    fontSize: 15.5px
    fontWeight: 400
    lineHeight: 1.64
  reading-quote:
    fontFamily: Newsreader
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
  mono:
    fontFamily: Geist Mono
    fontSize: 11.5px
    fontWeight: 400
    lineHeight: 1.4
  micro:
    fontFamily: Geist Mono
    fontSize: 10.5px
    fontWeight: 500
    lineHeight: 1.4
rounded:
  xs: 2px
  sm: 4.8px
  md: 6.4px
  lg: 8px
  xl: 10px
  2xl: 14px
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar: 236px
  inset: 8px
  page-gutter: 24px
  page-gutter-mobile: 16px
  card-padding: 16px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    height: 30px
    padding: 11px
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    height: 30px
    padding: 11px
  button-outline-hover:
    backgroundColor: "{colors.muted}"
  button-ghost:
    textColor: "{colors.body}"
    rounded: "{rounded.md}"
    height: 30px
  button-sm:
    height: 26px
    padding: 9px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 36px
    padding: 12px
  textarea:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.reading}"
    typography: "{typography.reading}"
    rounded: "{rounded.lg}"
    padding: 14px
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: 16px
  badge-traced:
    backgroundColor: "{colors.traced-wash}"
    textColor: "{colors.traced-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 20px
  badge-flag:
    backgroundColor: "{colors.flag-soft}"
    textColor: "{colors.flag-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 20px
  badge-caught:
    backgroundColor: "{colors.caught-soft}"
    textColor: "{colors.caught}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 20px
  tooltip:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 10px
  popover:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: 4px
  dialog:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: 20px
  badge-review:
    backgroundColor: "{colors.review-soft}"
    textColor: "{colors.review-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 20px
  status-dot-review:
    backgroundColor: "{colors.review}"
    rounded: "{rounded.full}"
    size: 6px
  status-dot-flag:
    backgroundColor: "{colors.flag}"
    rounded: "{rounded.full}"
    size: 6px
  sidebar:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.body}"
    width: 236px
  table-header:
    textColor: "{colors.muted-foreground}"
    height: 34px
  metadata:
    textColor: "{colors.faint}"
    typography: "{typography.mono}"
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  divider-strong:
    backgroundColor: "{colors.border-strong}"
    height: 1px
  input-outline:
    backgroundColor: "{colors.input}"
    width: 1px
  focus-ring:
    backgroundColor: "{colors.traced}"
    width: 2px
  avatar:
    backgroundColor: "{colors.human-soft}"
    textColor: "{colors.body}"
    rounded: "{rounded.full}"
    size: 26px
  chart-ai-answer:
    backgroundColor: "{colors.traced-soft}"
    rounded: "{rounded.xs}"
  chart-reached-essay:
    backgroundColor: "{colors.traced}"
    rounded: "{rounded.xs}"
  chart-critique:
    backgroundColor: "{colors.human}"
    rounded: "{rounded.xs}"
  chart-critique-flagged:
    backgroundColor: "{colors.flag}"
    rounded: "{rounded.xs}"
  essay-traced:
    backgroundColor: "{colors.traced-wash}"
    textColor: "{colors.reading}"
    typography: "{typography.reading}"
  essay-traced-underline:
    backgroundColor: "{colors.traced-line}"
    height: 1.5px
  essay-traced-hover:
    backgroundColor: "{colors.traced-soft}"
  essay-flagged-underline:
    backgroundColor: "{colors.flag-line}"
    height: 1.5px
  text-selection:
    backgroundColor: "{colors.traced-select}"
  report-well:
    backgroundColor: "{colors.well}"
    padding: 28px
---

# Pentimento

## Overview

Pentimento is the design system for AI-Interaction Analytics, a grading tool for Lane 2 assessment. Students log each AI prompt, the answer and their critique of it. Graders see the whole process at a glance and where a critique was thin.

It should feel like a serious, quiet working tool, closer to a well-made editor than a dashboard. Graders open it dozens of times in a sitting, so it stays dense, calm and fast. Paper and ink do most of the work. Colour is rare, and when it appears it means something.

Two ideas run through everything:

- **The earlier layer.** A pentimento is the earlier idea that shows through a finished painting. The logo is a hairline P under a heavy one, and the product draws the same two layers: cobalt for what traced to a logged AI answer, ink for what the student kept.
- **Reading is not UI.** Anything a student wrote (an essay, a critique, a reflection) is set in a serif. Everything the product says is set in a sans. A grader always knows whose words they are reading.

The source of truth for values is `src/app/globals.css`, and the shadcn primitives in `src/components/ui/` apply them. Static reference pages live in `design/concept/`.

## Colors

The palette is warm neutrals with four meaning colours. A meaning colour is never decoration, and no two meanings share a colour.

- **Ink (#18191B):** primary actions, headings and the student's own work in charts. Primary buttons are ink, not a brand colour.
- **Paper (#F4F4F0):** the canvas and sidebar. Content sits on a white **Sheet (#FFFFFF)** inset beside it.
- **Body (#3B3D41)** for running text, **Muted foreground (#6B6D72)** for secondary text and **Faint (#9C9DA1)** for metadata like IDs and axis ticks only.
- **Traced cobalt (#3E5FD0):** text that matches a logged AI answer, and nothing else. It also marks the current step and focus rings. Its soft tints (#DFE5FA, #F2F4FD) highlight traced passages, and the line tint (#A9B8EE) underlines them.
- **Flag vermilion (#C8431B):** the reflection check asking a grader to look closer. It also marks errors and invalid fields, because both mean "look here".
- **Caught green (#2C7A50):** an AI error the student caught. It is the one colour of praise in the product.
- **Review amber (#C98A1B):** work waiting for a grader.
- **Human (#2B2C30):** the student's critique in process charts, so it reads as the same ink as their writing.

Pentimento is light-only. The root layout declares `color-scheme: light` and a paper `theme-color`, so a browser in dark mode paints paper, not a dark canvas, before the page arrives.

## Typography

Three families with fixed jobs:

- **Inter** runs the interface. It uses `cv11`, `ss01` and `ss03`, and tabular figures wherever numbers line up. The base size is 13.5px, which suits a dense tool used on a laptop all day.
- **Newsreader** sets anything a student wrote: the final essay, critiques and the critique fields while typing. Body reading text is 15.5px with 1.64 line height.
- **Geist Mono** carries student IDs, timestamps, step numbers (`S6`) and keyboard hints.

Weights are deliberate in-between values: 450 for book text in menus, 520 for emphasis and labels, 580 for headings and figures, 600 for page titles. Avoid 700. The utilities are `font-book`, `font-emphasis` and `font-heading`; `font-heading` is a weight, not a family.

Page titles are 21px. The display size, used on landing, privacy and the 404 page only, scales with `clamp(34px, 4.2vw, 52px)`. The landing hero alone uses the hero size, `clamp(40px, 6.6vw, 96px)` with 0.98 line height. Inter loads with its optical size axis, so large type gets Inter's display cut on its own. Landing section headings use the headline size, `clamp(28px, 3vw, 40px)`. In-app headings never go above the title size.

## Layout

The signed-in app is a fixed shell: a 236px paper sidebar on the left, and the page on a white sheet inset 8px from the window edge with a 10px radius. On screens under 768px the sidebar becomes a top bar and the sheet fills the width.

Every page starts with a page bar: breadcrumbs on the left, the page's own actions on the right, and an "Example data" badge on screens not yet connected to Supabase. Content below uses a 24px gutter (16px on phones).

A page that needs a submission never dead-ends. Opening the Visualiser or Reports without one lists the submissions grouped by assignment, in the same "look closer first" order as the table, so a grader is one click from the work.

Landing, privacy and the 404 page sit outside the shell. Landing's header sticks to the top with a small "Sign in" button, so signing in is one click from anywhere on the page. Headings carry no eyebrow labels, and each section after the hero opens with its heading on the left and its lead on the right. The two product pictures are numbered figures with a caption underneath, like plates in a book. The page runs in seven parts:

1. **Hero:** "See the thinking behind the work." at the hero size, drawn over a hairline cobalt copy of itself that is tilted and offset like the logo's earlier P, with the lead and the sign-in card beside it.
2. **Every essay has an earlier layer:** a pinned section. On the left, the heading and three captions; on the right, a stack of tracing-paper sheets: the finished essay on top, and under it one sheet per AI answer the essay matched, each passage set where it sits in the essay. Lying flat, the passages show through the essay in register. As the reader scrolls, the stack tilts and the sheets lift apart so each passage lands on its own labelled sheet, and the caption that matches turns ink.
3. **Look through it yourself (Figure 1):** the finished essay with a divider. Left of it is the finished text; right of it is the earlier layer, with traced and flagged passages marked. A legend and the "Not traced to logged AI" figure sit beside it.
4. **A thin critique looks thin (Figure 2):** the process chart drawn large, with four numbered pins on the steps that show each part of the encoding and a key underneath. On phones the chart keeps a 480px minimum and scrolls sideways.
5. **How it works:** three numbered stages (log, critique, review) in one sheet divided by hairlines, each with a small picture of the product drawn from the same tokens and example data. They use the same `01`–`03` markers as the student's log.
6. **Ground rules:** what Pentimento will never claim, as a list of rules and explanations beside a sticky heading.
7. **Close:** "Make the messy middle visible", drawn over its own hairline cobalt copy, with sign-in and privacy links.

Privacy reads like a document: a sticky "On this page" index on wide screens, sections divided by hairlines rather than cards, and an ink hairline across the top of the window that fills as the reader scrolls. The 404 page repeats the hero's two layers with its own number, a hairline cobalt 404 tilted under a heavy one. The root error page uses the same centred layout, with "Try again" and a way back to the landing page.

Spacing follows Tailwind's 4px scale. Cards pad 16px. Related items group by hairline dividers inside one card rather than by separate cards. Data screens are dense on purpose. A grader should see the chart, the essay and the selected step without scrolling on a laptop.

## Elevation & Depth

Pentimento is nearly flat. Hierarchy comes from paper against sheet, and from hairlines, not shadows.

- Cards and fields use a 1px inset hairline (`--border`, #E7E6E1), not a drop shadow.
- The inset page sheet has a very soft card shadow to lift it off the paper.
- Only things that float get a real shadow: popovers, menus and tooltips use the `pop` shadow, and dialogs use the deeper `dialog` shadow with a 34% ink backdrop.
- The report preview uses a paper shadow so it reads as a printed A4 page.

## Shapes

Corners are small and consistent. The base radius is 8px.

- 6.4px (`md`) for buttons, inputs and tooltips
- 8px (`lg`) for textareas and inline panels
- 10px (`xl`) for cards, popovers and menus
- 14px (`2xl`) for dialogs
- Full for badges, status dots and avatars

Chart bars use 2 to 3px corners so they still read as data, not as buttons.

## Components

Every component is a shadcn primitive on Base UI in `src/components/ui/`, restyled on these tokens. Pages never restyle a primitive with `className`. If a screen needs a different look, add a variant in the component file. The shadcn lint rules enforce this and forbid arbitrary values.

- **Buttons:** primary (ink), outline (white with a strong hairline), ghost, secondary, destructive and link. Sizes are 30px default, 26px small and 36px large. Keyboard hints sit inside the button as a `Kbd`.
- **Badges:** 20px pills. Use `ai` for Lane 2 and traced text, `flag` for flags, `success` for caught errors and submissions, `review` for waiting work, `outline` for "Example data".
- **Inputs:** 36px by default, and a `compact` 30px density for toolbars. An `icon` inset leaves room for a leading icon. Focus shows a 1px cobalt ring with a soft 4px halo.
- **Textareas:** set in Newsreader, because a student is writing.
- **Toggle group:** the segmented control for verdicts and filters. In a filter, a white thumb slides to the pressed item (wrap the items in `ToggleGroupThumb` and give them `tone="thumb"`). A verdict keeps its meaning colour and doesn't slide.
- **Toggle:** a filter chip, dashed while off and solid once pressed.
- **Switch, radio group, tooltip, popover, dropdown menu and dialog** wrap the Base UI primitives and keep their keyboard, focus and dismissal behaviour.
- **Process chart** (`ProcessChart` and the static `ProcessBars`): AI words rise above the baseline in a soft cobalt, the part that reached the essay in solid cobalt, and the critique hangs below on the same scale in ink, or vermilion when flagged. A thin critique looks thin. The scale fits the longest answer, rounded up to a readable figure, so a 2,000-word ChatGPT reply never overflows. Up to 12 steps each column shows its title; beyond that columns compact to at least 14px, titles move to the tooltip and every fifth step is numbered. When even that doesn't fit, the plot scrolls sideways with the axis fixed. Sparklines in a table share one maximum so rows compare fairly.
- **Submissions table:** TanStack Table with sortable headers. Search, the flagged filter and sort live in the URL through nuqs, so Back from a student restores the view and any view can be linked. With no sort chosen, rows stay in "look closer first" order.
- **Stat:** a label above a 22px tabular figure. Neighbouring stats are divided by a hairline.
- **Not-from-logged-AI histogram:** ten columns from 0 to 100% in ink, with counts above and a dashed median line behind the bars.

## Iconography

Icons are a custom duotone set in `src/components/icon.tsx`, not a library. Draw new ones to the same rules:

- 20px grid, 1.5px stroke, round caps and joins, 2.25px corner radius, live area 3.25 to 16.75.
- A soft body filled with the stroke colour at 14% opacity.
- One accent detail coloured by `--icon-accent` (cobalt for traced, vermilion for flags, amber for review), applied with the `icon-ai`, `icon-flag` and `icon-review` utilities.
- Small touches carry the character: the flag waves, the lens has a shine, finished log steps are filled dots.

## Motion

Motion follows Emil Kowalski's rules, judged by how often a grader sees it.

- **Signed-in pages don't animate in.** Graders open the Visualiser around 41 times a session, so content and charts appear immediately. Only landing, privacy, the 404 and the error page, which people see rarely, rise in with a 40ms stagger.
- **Changing section is one continuous move.** The white active pill is one indicator behind the sidebar links, and it glides to the current item whenever the section changes (`nav-indicator`, 240ms, `--ease-in-out`), so a label is never covered. Sidebar links also carry the `section` transition type: the old page fades out in 90ms and the new one rises 4px into place in 200ms. Filters, `router.refresh()`, Back and Suspense reveals carry no type, so the page swaps instantly. React's `<ViewTransition>` drives the page fade in `PageTransition`. On phones the sidebar is a top bar whose links scroll sideways, and the current link carries its own pill.
- **Motion comes from what the user does.** Clicking a step slides the selection band (240ms, `ease-in-out`), swaps the inspector with a 2px blur (180ms) and moves the essay highlight (160ms). Filter thumbs and tab indicators slide with the `morph` utility (200ms, `ease-in-out`).
- **State changes morph instead of jumping.** A button label that changes while it works ("Save" to "Saving…") crossfades with the same 2px blur through `SwapText`, but never on first render. Deciding a flag swaps its actions the same way. A checkbox tick draws in from the left (150ms) and wipes back out (100ms). Progress fills slide with `translate` (240ms), and each answered critique question fills its pip from the left.
- **Landing motion tells one story: layers coming apart, then lining up.** It is the one place motion runs past the 300ms limit, because people see it rarely and it explains the product. Every scroll-linked effect declares its timeline and range once, in `--timeline` and `--range`, and applies them with `scroll-linked`. Browsers with scroll timelines run them natively. Others, such as Firefox, get the same CSS animations driven from the scroll position by `ScrollTimelines`, which pauses each one and sets its current time from the same `cover`, `contain` and `entry` maths, so the motion matches frame for frame. Without JavaScript there, each element rests in its finished state. A named timeline (`stage`, `chart-grow`, `stack-scroll`, `rule-in`) sets `--timeline-name`; keep its subject outside any scroll container, or the timeline measures that container instead of the page.
- **The hero is drawn in.** Each headline word rises out of a 10px blur (`word-in`, 900ms, 70ms apart). The hairline cobalt copy (`underdrawing`, `underdrawing-surface`) is then sketched in left to right with a `clip-path` sweep and slips out from under the ink to its tilt and offset. It leans away from the mouse by up to 8px (`PointerDepth` sets `--px` and `--py`) and pulls further apart over the first 640px of scroll (`pull-apart`).
- **The layer stack plays while pinned.** The section is 320svh tall with a sticky frame (`stack-scroll`, `stack-pin`). Over the pinned scroll the stack turns from flat to tilted (`stack`), the sheets lift apart on the registered `--lift` property (`stack-sheet`), the sheet labels fade in (`stack-label`) and each caption turns from Faint to ink in its third (`stack-beat`).
- **The earlier layer sweeps across the essay.** Until a reader moves the divider, it slides from the right edge to the middle as Figure 1 scrolls into view (`split-area`, scroll-linked on the registered `--split` property). Dragging anywhere on the essay or pressing the arrow keys takes it over, and from then on it follows the reader with no transition. Touch keeps vertical scrolling (`touch-action: pan-y`), and a tap alone doesn't move the divider.
- **The rest of the landing page arrives as it scrolls in.** Section headings and leads rise (`rise-on-scroll`). The Figure 1 handle beckons with a soft ring until it is moved (`split-hint`). In Figure 2 each column grows out of the baseline in turn and its pin pops in after it (`chart-grow`, `pop-in`; `ProcessBars` marks its rects with `data-part` and its columns with `--i`). Each stage of How it works plays out in order (`stage`, `stage-in`, `stage-reveal`). Each ground rule rises as its hairline draws across beneath it (`rule-in`). The closing line's cobalt copy starts tilted and settles into register (`underdrawing-settle`): the layers line up at the end.
- **The landing header settles as you scroll.** Over the first 96px it gains its paper bar and hairline (`header-settle`).
- **Keyboard actions never animate.** Arrow keys move the selection with no transition.
- **Easing:** `--ease-out` is `cubic-bezier(0.23, 1, 0.32, 1)` for anything entering, and `--ease-in-out` is `cubic-bezier(0.77, 0, 0.175, 1)` for movement on screen. Hover and colour changes use the default ease-shaped curve. Never use `ease-in`.
- **Durations:** button press 140ms (`scale(0.97)`), tooltips 125ms, menus and popovers 160ms in and 100ms out, dialogs 220ms in and 150ms out. Keep UI motion under 300ms.
- **Origins:** popovers and menus scale from their trigger with Base UI's `--transform-origin`. Dialogs stay centred. Nothing scales from 0; entrances start at 0.96 to 0.97 with opacity.
- **Tooltips** wait 300ms the first time, then open instantly while one is already showing.
- **Reduced motion** keeps fades and colour changes and drops anything that moves or scales. The essay divider starts in the middle and never sweeps. The landing header keeps its paper bar from the start, the headline's underdrawing fades in already in place and doesn't follow the pointer, and the layer stack is no longer pinned and rests tilted and apart. Section changes in the app swap without a transition, the sidebar pill jumps, and the privacy progress line is hidden.
- Animate only `transform`, `opacity`, colours, shadows and `clip-path` reveals. Never `transition: all`.

## Do's and Don'ts

- Do use cobalt only for text traced to a logged AI answer, the current step and focus. Don't use it for links, decoration or charts of other data. The logo, the landing headlines' underdrawings and the 404 mark are the only places cobalt draws a shape, because there it is the earlier layer.
- Do set anything a student wrote in Newsreader, and everything else in Inter.
- Do call the 68% figure "Not traced to logged AI". Don't call it the student's own words, originality or an AI-detection score. Matching text is a prompt for judgement, not proof of authorship.
- Do describe flags as asking a grader to look closer. Don't imply a flag changes a grade.
- Do add a component variant when a screen needs a new look. Don't restyle primitives at the call site or use arbitrary Tailwind values.
- Do show a page bar with breadcrumbs on every signed-in page, and the "Example data" badge until the page reads real data.
- Do keep data visible on arrival. Don't add entrance animations to pages graders revisit.
- Don't use more than one meaning colour on a single element, and don't use a meaning colour as a background for a whole section.
- Don't use 700 weights, heavy shadows or radii above 14px.
- Do keep Faint (#9C9DA1) to metadata. It is too light for anything a grader has to read.
