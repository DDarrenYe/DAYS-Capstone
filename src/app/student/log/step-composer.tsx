"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icon";
import { Answer } from "@/components/process/answer";
import { ProcessBars } from "@/components/process/process-bars";
import { PageBar } from "@/components/shell/page-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { assignmentName, steps } from "@/lib/example-data";
import { addMark, splitMarks } from "@/lib/marks";
import type { Mark, MarkKind } from "@/lib/marks";
import {
  countWords,
  critiqueCoverage,
  critiqueOrder,
  critiqueQuestions,
} from "@/lib/process";
import type { CritiqueQuestion } from "@/lib/process";
import { cn } from "@/lib/utils";

const CURRENT = 6;

const MARKS: {
  kind: MarkKind;
  label: string;
  icon: IconName;
  accent: string;
  style: string;
}[] = [
  {
    accent: "icon-flag",
    icon: "wrong",
    kind: "wrong",
    label: "It’s wrong",
    style: "decoration-flag underline decoration-wavy underline-offset-4",
  },
  {
    accent: "icon-review",
    icon: "unsourced",
    kind: "unsourced",
    label: "No source I could find",
    style:
      "decoration-review underline decoration-dotted decoration-2 underline-offset-4",
  },
  {
    accent: "icon-ai",
    icon: "used",
    kind: "used",
    label: "I used this in my essay",
    style: "bg-ai-wash shadow-traced rounded-xs",
  },
];

const answerText = (steps[CURRENT]?.answer ?? [])
  .map((segment) => segment.text)
  .join("");

const saveStatus = (saved: boolean, complete: boolean) => {
  if (saved) {
    return "Saved. Your grader will see this step.";
  }
  return complete ? "Ready to save." : "Answer all three questions to save.";
};

const offsetWithin = (root: Node, node: Node, offset: number) => {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(node, offset);
  return range.toString().length;
};

const Part = ({
  number,
  title,
  meta,
  active = false,
  children,
  index,
}: {
  number: string;
  title: string;
  meta?: ReactNode;
  active?: boolean;
  children: ReactNode;
  index: number;
}) => (
  <section
    className="animate-rise stagger before:bg-border relative grid grid-cols-[26px_minmax(0,1fr)] gap-x-3.5 pb-6.5 before:absolute before:top-7 before:bottom-1 before:left-[12.5px] before:w-px last:before:hidden"
    style={{ "--i": index }}
  >
    <span
      className={cn(
        "text-label grid size-6.5 place-items-center rounded-lg font-mono font-medium",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-card text-body shadow-strong-ring"
      )}
    >
      {number}
    </span>
    <div className="min-w-0">
      <header className="mb-2 flex h-6.5 items-center gap-2.5">
        <h2 className="text-ui font-heading">{title}</h2>
        <div className="text-muted-foreground ml-auto flex items-center gap-2 text-xs">
          {meta}
        </div>
      </header>
      {children}
    </div>
  </section>
);

/* The student's steps: finished ones filled, thin critiques in vermilion, the current one in cobalt. */
const StepRail = ({
  done,
  viewing,
  onView,
}: {
  done: readonly boolean[];
  viewing: number;
  onView: (index: number) => void;
}) => (
  <nav
    aria-label="Steps in Essay 2"
    className="animate-fade flex flex-col gap-0.5 px-3 py-4.5 max-lg:border-b lg:overflow-y-auto lg:border-r"
  >
    <span className="text-label text-muted-foreground font-emphasis px-2.5 pb-2">
      Essay 2 · {steps.length} steps
    </span>
    <ol className="flex flex-col gap-0.5">
      {steps.map((item, index) => {
        const isDone = done[index];
        const thin = isDone && Boolean(item.flag);
        const started = isDone || index === CURRENT;
        return (
          <li
            className="[&:not(:last-child)]:after:bg-border-strong relative [&:not(:last-child)]:after:absolute [&:not(:last-child)]:after:top-7.75 [&:not(:last-child)]:after:left-[20.5px] [&:not(:last-child)]:after:h-3.5 [&:not(:last-child)]:after:w-px"
            key={item.title}
          >
            <button
              aria-current={index === viewing ? "step" : undefined}
              className="hover:bg-muted aria-[current=step]:bg-ai-wash aria-[current=step]:shadow-ai-ring grid w-full grid-cols-[22px_minmax(0,1fr)] gap-x-2.5 rounded-lg px-2.5 py-1.75 text-left disabled:cursor-default disabled:hover:bg-transparent"
              disabled={!started}
              onClick={() => onView(index)}
              type="button"
            >
              <span
                className={cn(
                  "text-micro row-span-2 grid size-5.5 place-items-center rounded-full font-mono font-medium",
                  isDone && !thin && "bg-primary text-primary-foreground",
                  thin && "bg-flag-soft text-flag-ink shadow-flag-ring",
                  !isDone &&
                    index === CURRENT &&
                    "bg-ai ring-ai-soft text-white ring-3",
                  !started && "bg-muted text-muted-foreground shadow-hairline"
                )}
              >
                {isDone && !thin ? (
                  <Icon className="size-3" name="check" />
                ) : (
                  index + 1
                )}
              </span>
              <b
                className={cn(
                  "text-control truncate font-medium",
                  index === viewing ? "text-foreground" : "text-body"
                )}
              >
                {item.title}
              </b>
              <span className="text-faint text-label">
                {isDone && thin && "Critique could say more"}
                {isDone && !thin && item.time.split(" · ")[0]}
                {!isDone && index === CURRENT && "Writing critique"}
                {!started && "Not started"}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

/* Live coverage of the three questions, the student's own process so far, and who will read it. */
const CritiqueSidebar = ({
  coverage,
  sources,
  saved,
}: {
  coverage: Record<CritiqueQuestion, boolean>;
  sources: number;
  saved: number;
}) => (
  <aside className="flex flex-col gap-4.5 px-4.5 py-4.5 max-lg:border-t lg:overflow-y-auto lg:border-l">
    <section className="animate-rise stagger [--i:3]">
      <h2 className="text-label text-muted-foreground font-emphasis mb-2">
        Your critique covers
      </h2>
      <ul className="flex flex-col gap-2">
        {critiqueOrder.map((question) => (
          <li
            className="text-body text-meta flex items-center gap-2.25"
            key={question}
          >
            <span
              className={cn(
                "grid size-4.5 place-items-center rounded-full transition-colors duration-150",
                coverage[question]
                  ? "bg-success-soft text-success"
                  : "bg-muted text-faint shadow-hairline"
              )}
            >
              <Icon
                className="size-3"
                name={coverage[question] ? "check" : "x"}
              />
            </span>
            {critiqueQuestions[question]}
            {question === "check" ? (
              <span className="text-muted-foreground text-label ml-auto">
                {sources} {sources === 1 ? "source" : "sources"}
              </span>
            ) : null}
            <span className="sr-only">
              {coverage[question] ? "covered" : "not covered yet"}
            </span>
          </li>
        ))}
      </ul>
    </section>

    <section className="animate-rise stagger shadow-hairline rounded-xl px-3.5 py-3 [--i:4]">
      <div className="flex items-baseline justify-between">
        <h2 className="text-label text-muted-foreground font-emphasis">
          Your process so far
        </h2>
        <span className="text-faint text-label font-mono">{saved} saved</span>
      </div>
      <ProcessBars
        base={44}
        className="mt-2.5 w-full"
        height={64}
        scale={0.1}
        steps={steps.slice(0, CURRENT + 1)}
        width={262}
      />
      <ul className="text-muted-foreground mt-2 flex gap-3 text-xs">
        <li className="flex items-center gap-1.25">
          <i className="bg-ai-soft block size-2 rounded-xs" />
          AI
        </li>
        <li className="flex items-center gap-1.25">
          <i className="bg-ai block size-2 rounded-xs" />
          Used
        </li>
        <li className="flex items-center gap-1.25">
          <i className="bg-human block size-2 rounded-xs" />
          Critique
        </li>
      </ul>
    </section>

    <section className="animate-rise stagger bg-muted text-body text-meta rounded-xl px-3.5 py-3 [--i:5]">
      <h2 className="text-foreground font-heading mb-1 flex items-center gap-1.75">
        <Icon name="eye" />
        Who sees this
      </h2>
      Your grader sees each prompt, answer and critique as you log them. A
      reflection check may ask them to look closer at a thin critique. It never
      grades you.
    </section>

    <dl className="text-muted-foreground animate-rise stagger grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-1.75 text-xs [--i:6]">
      <dt>
        <Kbd>⌘↵</Kbd>
      </dt>
      <dd>Save step</dd>
      <dt>
        <Kbd>1–3</Kbd>
      </dt>
      <dd>Mark a selected passage</dd>
    </dl>
  </aside>
);

export const StepComposer = () => {
  const [done, setDone] = useState(() =>
    steps.map((_, index) => index < CURRENT)
  );
  const [verdict, setVerdict] = useState<string | null>("wrong");
  const [check, setCheck] = useState(
    "I looked up the 2025 Universities NZ student survey. It reports 64% weekly use of AI tools, and it does not say the use is for assignments."
  );
  const [change, setChange] = useState(
    "I rewrote the sentence in paragraph 3 to say “every week” and cited the survey"
  );
  const [sources, setSources] = useState([
    "https://www.universitiesnz.ac.nz/student-survey-2025",
  ]);
  const [source, setSource] = useState("");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [pending, setPending] = useState<{
    start: number;
    end: number;
    rect: DOMRect;
  } | null>(null);
  const [viewing, setViewing] = useState(CURRENT);
  const answerRef = useRef<HTMLDivElement>(null);
  const verdictLabel = useId();
  const fieldId = useId();

  const coverage = critiqueCoverage({ change, check, verdict });
  const complete = Object.values(coverage).every(Boolean);
  const saved = done[CURRENT];
  const step = steps[viewing];

  const save = () => {
    if (complete) {
      setDone((current) =>
        current.map((value, index) => value || index === CURRENT)
      );
    }
  };

  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      save();
    }
  });

  useEffect(() => {
    globalThis.addEventListener("keydown", onShortcut);
    return () => globalThis.removeEventListener("keydown", onShortcut);
  }, []);

  const onSelectionEnd = useEffectEvent(() => {
    const root = answerRef.current;
    const selection = globalThis.getSelection();
    if (!(root && selection) || selection.isCollapsed) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) {
      return;
    }
    setPending({
      end: offsetWithin(root, range.endContainer, range.endOffset),
      rect: range.getBoundingClientRect(),
      start: offsetWithin(root, range.startContainer, range.startOffset),
    });
  });

  useEffect(() => {
    document.addEventListener("pointerup", onSelectionEnd);
    document.addEventListener("keyup", onSelectionEnd);
    return () => {
      document.removeEventListener("pointerup", onSelectionEnd);
      document.removeEventListener("keyup", onSelectionEnd);
    };
  }, []);

  const mark = (kind: MarkKind) => {
    if (pending) {
      setMarks((current) =>
        addMark(current, { end: pending.end, kind, start: pending.start })
      );
    }
    globalThis.getSelection()?.removeAllRanges();
    setPending(null);
  };

  const addSource = () => {
    const url = source.trim();
    if (URL.canParse(url) && !sources.includes(url)) {
      setSources((current) => [...current, url]);
      setSource("");
    }
  };

  return (
    <>
      <PageBar
        crumbs={[
          { href: "/student", label: assignmentName },
          { href: "/student/log", label: "My log" },
          { label: `Step ${viewing + 1}` },
        ]}
        example
      >
        <Link
          className="text-muted-foreground hover:text-foreground text-meta flex items-center gap-1.5"
          href="/privacy"
        >
          <Icon name="eye" />
          Who sees this
        </Link>
      </PageBar>

      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[252px_minmax(0,1fr)_300px] lg:overflow-hidden">
        <StepRail done={done} onView={setViewing} viewing={viewing} />

        <div className="flex min-h-0 flex-col lg:overflow-y-auto">
          {step && viewing !== CURRENT ? (
            <article className="px-10 py-5.5 max-md:px-4" key={viewing}>
              <p className="animate-rise text-muted-foreground text-meta flex items-center gap-2">
                <span className="font-mono">
                  Step {viewing + 1} of {steps.length}
                </span>
                · {step.time}
              </p>
              <h1 className="text-title animate-rise stagger mt-1 mb-4.5 font-semibold [--i:1]">
                {step.title}
              </h1>
              <Part index={2} number="01" title="What you asked">
                <p className="text-body">{step.asked}</p>
              </Part>
              <Part index={3} number="02" title="What the AI answered">
                <p className="bg-muted shadow-hairline text-body rounded-lg px-3.75 py-3.25 leading-relaxed">
                  <Answer segments={step.answer} />
                </p>
              </Part>
              <Part index={4} number="03" title="Your critique">
                <blockquote className="text-reading border-border-strong text-read border-l-2 pl-3 font-serif">
                  {step.critique}
                </blockquote>
                {step.flag ? (
                  <p className="bg-review-soft text-review-ink text-meta mt-3 rounded-lg px-3 py-2.5">
                    Your grader may look closer at this one. Saying what you
                    checked and what you changed makes it stronger.
                  </p>
                ) : null}
              </Part>
            </article>
          ) : (
            <form
              className="flex flex-1 flex-col px-10 pt-5.5 max-md:px-4"
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              <p className="animate-rise text-muted-foreground text-meta flex items-center gap-2">
                <span className="font-mono">
                  Step {CURRENT + 1} of {steps.length}
                </span>
                · Thu 9 Oct ·<Badge variant="ai">Lane 2</Badge>
              </p>
              <h1 className="text-title animate-rise stagger mt-1 mb-4.5 font-semibold [--i:1]">
                {steps[CURRENT]?.title}
              </h1>

              <Part
                index={2}
                meta={
                  <span className="bg-muted shadow-hairline flex h-6 items-center gap-1.5 rounded-md px-2 text-xs">
                    <Icon className="text-ai size-3.5" name="link" />
                    chatgpt.com/share/6f2a…
                  </span>
                }
                number="01"
                title="What you asked"
              >
                <p className="shadow-field rounded-lg px-3.5 py-2.75">
                  {steps[CURRENT]?.asked}
                </p>
              </Part>

              <Part
                index={3}
                meta={`Imported · ${countWords(answerText)} words`}
                number="02"
                title="What the AI answered"
              >
                <div
                  className="bg-muted shadow-hairline text-body rounded-lg px-3.75 py-3.25 text-sm leading-relaxed"
                  ref={answerRef}
                >
                  {splitMarks(answerText, marks).map((run) => {
                    const style = MARKS.find(
                      (item) => item.kind === run.mark?.kind
                    )?.style;
                    return run.mark ? (
                      <mark
                        className={cn("bg-transparent text-inherit", style)}
                        key={`${run.mark.start}-${run.mark.kind}`}
                      >
                        {run.text}
                      </mark>
                    ) : (
                      run.text
                    );
                  })}
                </div>
                <p className="text-muted-foreground mt-1.75 text-xs">
                  Select any part of the answer to mark it.
                  {marks.length > 0
                    ? ` ${marks.length} ${marks.length === 1 ? "passage" : "passages"} marked.`
                    : ""}
                </p>
                <DropdownMenu
                  modal={false}
                  onOpenChange={(open) => {
                    if (!open) {
                      setPending(null);
                    }
                  }}
                  open={pending !== null}
                >
                  <DropdownMenuContent
                    align="start"
                    anchor={
                      pending
                        ? { getBoundingClientRect: () => pending.rect }
                        : null
                    }
                    className="w-63"
                    onKeyDown={(event) => {
                      const choice = MARKS[Number(event.key) - 1];
                      if (choice) {
                        mark(choice.kind);
                      }
                    }}
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Mark this passage</DropdownMenuLabel>
                      {MARKS.map((item, index) => (
                        <DropdownMenuItem
                          key={item.kind}
                          onClick={() => mark(item.kind)}
                        >
                          <span className={item.accent}>
                            <Icon name={item.icon} />
                          </span>
                          {item.label}
                          <Kbd>{index + 1}</Kbd>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Part>

              <Part
                active
                index={4}
                meta="Your grader reads this"
                number="03"
                title="Your critique"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2.5">
                  <span
                    className="text-body text-label font-emphasis"
                    id={verdictLabel}
                  >
                    Was the AI right?
                  </span>
                  <ToggleGroup
                    aria-labelledby={verdictLabel}
                    onValueChange={(value) => setVerdict(value[0] ?? null)}
                    value={verdict ? [verdict] : []}
                  >
                    <ToggleGroupItem value="right">Right</ToggleGroupItem>
                    <ToggleGroupItem value="partly">Partly</ToggleGroupItem>
                    <ToggleGroupItem value="wrong">Wrong</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <label
                  className="text-body text-label font-emphasis mt-3.5 mb-1.25 block"
                  htmlFor={`${fieldId}-check`}
                >
                  How did you check it?
                </label>
                <Textarea
                  id={`${fieldId}-check`}
                  onChange={(event) => setCheck(event.target.value)}
                  value={check}
                />
                <ul className="mt-2 flex flex-wrap items-center gap-1.5">
                  {sources.map((url) => (
                    <li
                      className="bg-muted shadow-hairline text-body flex h-6 items-center gap-1.5 rounded-md pr-1 pl-1.5 text-xs"
                      key={url}
                    >
                      <Icon className="text-ai size-3.5" name="link" />
                      {new URL(url).hostname}
                      <button
                        aria-label={`Remove ${url}`}
                        className="text-faint hover:text-foreground rounded-sm"
                        onClick={() =>
                          setSources((current) =>
                            current.filter((item) => item !== url)
                          )
                        }
                        type="button"
                      >
                        <Icon className="size-3.5" name="x" />
                      </button>
                    </li>
                  ))}
                  <li>
                    <label className="sr-only" htmlFor={`${fieldId}-source`}>
                      Add a source link
                    </label>
                    <Input
                      className="w-56"
                      density="compact"
                      onChange={(event) => setSource(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addSource();
                        }
                      }}
                      id={`${fieldId}-source`}
                      placeholder="Paste a source link, then Enter"
                      type="url"
                      value={source}
                    />
                  </li>
                </ul>
                <label
                  className="text-body text-label font-emphasis mt-3.5 mb-1.25 block"
                  htmlFor={`${fieldId}-change`}
                >
                  What did you change?
                </label>
                <Textarea
                  id={`${fieldId}-change`}
                  onChange={(event) => setChange(event.target.value)}
                  value={change}
                />
                <div className="shadow-hairline mt-3.5 overflow-hidden rounded-lg">
                  <div className="bg-muted text-muted-foreground flex h-8.5 items-center gap-2 border-b px-3 text-xs">
                    <Icon name="essay" />
                    In your essay · ¶3
                    <span className="ml-auto max-sm:hidden">
                      Matched from essay2-final.docx
                    </span>
                  </div>
                  <p className="bg-flag-soft text-flag-ink text-lead grid grid-cols-[22px_1fr] px-3 py-2 font-serif leading-normal">
                    <span
                      aria-hidden="true"
                      className="font-mono text-xs leading-5.5"
                    >
                      −
                    </span>
                    <del className="decoration-flag/45">
                      Nine in ten students now use AI for their assignments.
                    </del>
                  </p>
                  <p className="bg-success-soft text-success text-lead grid grid-cols-[22px_1fr] px-3 py-2 font-serif leading-normal">
                    <span
                      aria-hidden="true"
                      className="font-mono text-xs leading-5.5"
                    >
                      +
                    </span>
                    <ins className="no-underline">
                      Most students already use AI tools every week
                      (Universities NZ, 2025).
                    </ins>
                  </p>
                </div>
              </Part>

              <div className="bg-card sticky bottom-0 mt-auto flex items-center gap-2.5 border-t py-3">
                <span
                  aria-live="polite"
                  className="text-muted-foreground text-xs"
                >
                  {saveStatus(saved, complete)}
                </span>
                <Button
                  className="ml-auto"
                  disabled={!complete || saved}
                  type="submit"
                >
                  {saved ? "Saved" : "Save step"}
                  <Kbd>⌘↵</Kbd>
                </Button>
              </div>
            </form>
          )}
        </div>

        <CritiqueSidebar
          coverage={coverage}
          saved={done.filter(Boolean).length}
          sources={sources.length}
        />
      </div>
    </>
  );
};
