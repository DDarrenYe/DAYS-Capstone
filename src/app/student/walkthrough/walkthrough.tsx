"use client";

import type { VariantProps } from "class-variance-authority";
import { Fragment, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

import type { EssayChoice } from "@/app/student/walkthrough/sample-step";
import {
  CritiqueStage,
  LogStage,
  ReviewStage,
} from "@/app/student/walkthrough/stages";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import type { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const stages = [
  {
    lead: "Paste a ChatGPT chat or import its share link. Each prompt and its answer becomes one step in your log.",
    title: "Log the chat",
  },
  {
    lead: "Say whether the AI was right and how you checked it. Graders read this when they review your process.",
    title: "Critique the answer",
  },
  {
    lead: "Pick what you did with the AI’s answer and watch the chart move.",
    title: "See what graders see",
  },
];

const Stepper = ({
  stage,
  onStage,
}: {
  stage: number;
  onStage: (stage: number) => void;
}) => (
  <ol className="flex items-center gap-3">
    {stages.map(({ title }, index) => {
      const current = index === stage;
      return (
        <Fragment key={title}>
          {index > 0 ? (
            <li
              aria-hidden="true"
              className="bg-border relative h-px flex-1 overflow-hidden"
            >
              <span
                className={cn(
                  "bg-primary absolute inset-0 transition-transform duration-240 ease-out",
                  stage < index && "-translate-x-full"
                )}
              />
            </li>
          ) : null}
          <li>
            <button
              aria-current={current ? "step" : undefined}
              className="focus-visible:shadow-focus flex cursor-pointer items-center gap-2 rounded-lg outline-none"
              onClick={() => onStage(index)}
              type="button"
            >
              <span
                className={cn(
                  "text-label grid size-6.5 place-items-center rounded-lg font-mono font-medium transition-colors duration-150",
                  current
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-body shadow-strong-ring"
                )}
              >
                {index < stage ? (
                  <Icon className="size-3.5" name="check" />
                ) : (
                  `0${index + 1}`
                )}
              </span>
              <span
                className={cn(
                  "text-meta font-emphasis",
                  current ? "text-foreground" : "text-muted-foreground",
                  !current && "max-sm:hidden"
                )}
              >
                {title}
              </span>
            </button>
          </li>
        </Fragment>
      );
    })}
  </ol>
);

const Tour = ({
  nextRef,
  onDone,
}: {
  nextRef: RefObject<HTMLButtonElement | null>;
  onDone: () => void;
}) => {
  const [stage, setStage] = useState(0);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [check, setCheck] = useState("");
  const [choice, setChoice] = useState<EssayChoice>("copied");
  const last = stage === stages.length - 1;
  const bodies = [
    <LogStage key="log" />,
    <CritiqueStage
      check={check}
      key="critique"
      onCheck={setCheck}
      onVerdict={setVerdict}
      verdict={verdict}
    />,
    <ReviewStage
      check={check}
      choice={choice}
      key="review"
      onChoice={setChoice}
      verdict={verdict}
    />,
  ];
  return (
    <>
      <header className="flex flex-col gap-4 border-b px-5 pt-4 pb-4">
        <DialogTitle>Try a sample step</DialogTitle>
        <Stepper onStage={setStage} stage={stage} />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {stages.map(({ lead, title }, index) =>
          index === stage ? (
            <div className="animate-swap" key={title}>
              <h3 className="text-lead tracking-snug font-heading">{title}</h3>
              <p className="text-body mt-1 max-w-120 text-pretty">{lead}</p>
              <div className="mt-5">{bodies[index]}</div>
            </div>
          ) : null
        )}
      </div>
      <footer className="flex items-center gap-2 border-t px-5 py-3">
        <DialogDescription className="mr-auto">
          Nothing here is saved.
        </DialogDescription>
        <Button
          disabled={stage === 0}
          onClick={() => {
            setStage(stage - 1);
            if (stage === 1) {
              nextRef.current?.focus();
            }
          }}
          variant="ghost"
        >
          Back
        </Button>
        <Button
          onClick={() => (last ? onDone() : setStage(stage + 1))}
          ref={nextRef}
        >
          {last ? "Done" : "Next"}
        </Button>
      </footer>
    </>
  );
};

export const Walkthrough = ({
  children,
  size,
  variant,
}: VariantProps<typeof buttonVariants> & { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const nextRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button size={size} variant={variant} />}>
        {children}
      </DialogTrigger>
      <DialogContent initialFocus={nextRef} size="tour">
        <Tour nextRef={nextRef} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
