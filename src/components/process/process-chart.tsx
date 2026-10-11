import { useEffect, useRef } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { wordsAxis } from "@/lib/process";
import type { Step } from "@/lib/process";
import { cn } from "@/lib/utils";

/* Bars rise into 84px (h-21) above the baseline; critiques hang into 22px below it. */
const UP = 84;
const DOWN = 22;

/* Up to this many steps each column carries its title; beyond it columns compact and titles move to the tooltip. */
const TITLED_STEPS = 12;
/* Narrowest column per mode. Past steps × this width the plot scrolls sideways and the axis stays put. */
const TITLED_COLUMN = 72;
const COMPACT_COLUMN = 14;

const dayRuns = (steps: readonly Step[]) => {
  const runs: { day: string; span: number }[] = [];
  for (const step of steps) {
    const last = runs.at(-1);
    if (last?.day === step.day) {
      last.span += 1;
    } else {
      runs.push({ day: step.day, span: 1 });
    }
  }
  return runs;
};

const describe = (step: Step, index: number) =>
  [
    `Step ${index + 1}, ${step.title}: ${step.words} AI words`,
    `${step.carried} reached the essay`,
    `${step.critiqueWords} critique words`,
    step.flag ? `flagged: ${step.flag.title}` : "",
    step.caught ? `AI error caught: ${step.caught}` : "",
  ]
    .filter(Boolean)
    .join(", ");

const formatWords = (words: number) =>
  words >= 1000 ? `${words / 1000}k` : String(words);

/*
  Every step is a column and a button: AI words rise above the baseline, the part that reached the essay in
  cobalt, and the critique hangs below on the same scale. The scale fits the longest answer, so a 2,000-word
  ChatGPT reply never overflows. Long imports compact the columns and, past what fits, scroll sideways while
  the axis stays put. The selected band slides on click and jumps on arrow keys, which never animate.
*/
export const ProcessChart = ({
  steps,
  selected,
  animate,
  onSelect,
  onHover,
}: {
  steps: readonly Step[];
  selected: number;
  animate: boolean;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
}) => {
  const axis = wordsAxis(steps);
  const px = (words: number, room: number) =>
    `${Math.min(Math.max((words / axis) * UP, 1.5), room)}px`;
  const titled = steps.length <= TITLED_STEPS;
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const column = columnsRef.current?.querySelectorAll("button")[selected];
    column?.scrollIntoView({
      behavior: animate ? "smooth" : "instant",
      block: "nearest",
      inline: "nearest",
    });
  }, [selected, animate]);

  return (
    <div className="flex">
      <div
        aria-hidden="true"
        className="text-faint text-micro relative w-8.5 shrink-0 font-mono"
      >
        <span className="absolute top-0 -translate-y-1/2">
          {formatWords(axis)}
        </span>
        <span className="absolute top-10.5 -translate-y-1/2">
          {formatWords(axis / 2)}
        </span>
      </div>
      <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-1">
        <div
          className="relative min-w-(--min)"
          style={{
            "--min": `${steps.length * (titled ? TITLED_COLUMN : COMPACT_COLUMN)}px`,
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-10.5 border-t border-dashed"
          />
          <div
            aria-hidden="true"
            className="bg-border-strong pointer-events-none absolute inset-x-0 top-21 h-px"
          />
          <div
            className="relative grid auto-cols-fr grid-flow-col"
            ref={columnsRef}
          >
            <div
              aria-hidden="true"
              className={cn(
                "bg-muted absolute inset-y-0 left-0 w-(--band) translate-x-(--at) rounded-lg",
                animate && "transition-transform duration-240 ease-in-out"
              )}
              style={{
                "--at": `${selected * 100}%`,
                "--band": `${100 / steps.length}%`,
              }}
            />
            <TooltipProvider>
              {steps.map((step, index) => {
                const isSelected = index === selected;
                const numbered =
                  titled || isSelected || index === 0 || (index + 1) % 5 === 0;
                return (
                  <Tooltip key={`${step.time}-${step.title}`}>
                    <TooltipTrigger
                      className={cn(
                        "group/col relative flex cursor-pointer flex-col items-center rounded-lg pb-2 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2",
                        titled && "px-1.5"
                      )}
                      onBlur={() => onHover(null)}
                      onClick={() => onSelect(index)}
                      onFocus={() => onHover(index)}
                      onMouseEnter={() => onHover(index)}
                      onMouseLeave={() => onHover(null)}
                      render={
                        <button
                          aria-label={describe(step, index)}
                          aria-pressed={isSelected}
                          type="button"
                        />
                      }
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "relative flex h-21 items-end",
                          titled ? "w-6.5" : "w-3/5 max-w-6.5"
                        )}
                      >
                        <span
                          className="bg-ai-soft absolute inset-x-0 bottom-0 h-(--h) rounded-xs"
                          style={{ "--h": px(step.words, UP) }}
                        />
                        {step.carried > 0 ? (
                          <span
                            className="bg-ai absolute inset-x-0 bottom-0 h-(--h) rounded-xs"
                            style={{ "--h": px(step.carried, UP) }}
                          />
                        ) : null}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "relative h-6",
                          titled ? "w-6.5" : "w-3/5 max-w-6.5"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute inset-x-0 top-0.5 h-(--h) rounded-xs",
                            step.flag ? "bg-flag" : "bg-human"
                          )}
                          style={{ "--h": px(step.critiqueWords, DOWN) }}
                        />
                      </span>
                      <span
                        aria-hidden="true"
                        className="grid h-5 place-items-center"
                      >
                        {step.flag ? (
                          <i className="bg-flag ring-flag/25 block size-2 rounded-full ring-3" />
                        ) : null}
                        {step.caught ? (
                          <i className="bg-success block size-2 rounded-full" />
                        ) : null}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "text-faint text-label mt-1 font-mono",
                          !numbered && "invisible",
                          isSelected && "text-foreground"
                        )}
                      >
                        {titled ? `S${index + 1}` : index + 1}
                      </span>
                      {titled ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "text-muted-foreground w-full truncate text-center text-xs",
                            isSelected && "text-foreground font-medium"
                          )}
                        >
                          {step.title}
                        </span>
                      ) : null}
                    </TooltipTrigger>
                    <TooltipContent className="w-54">
                      <b className="font-heading">
                        S{index + 1} · {step.title}
                      </b>
                      <dl className="text-primary-foreground/70 [&_dd]:text-primary-foreground mt-1.25 grid grid-cols-2 tabular-nums [&_dd]:text-right">
                        <dt>AI answer</dt>
                        <dd>{step.words} words</dd>
                        <dt>Reached the essay</dt>
                        <dd>{step.carried} words</dd>
                        <dt>Critique</dt>
                        <dd>{step.critiqueWords} words</dd>
                      </dl>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
          <ol
            aria-label="Days worked"
            className="grid auto-cols-fr grid-flow-col pt-1"
          >
            {dayRuns(steps).map((run, index) => (
              <li
                className="text-muted-foreground before:bg-border-strong after:bg-border-strong border-border-strong text-label relative col-span-(--span) mx-1.5 mt-1.5 truncate border-t pt-1 text-center font-medium before:absolute before:-top-1.5 before:left-0 before:h-1.5 before:w-px after:absolute after:-top-1.5 after:right-0 after:h-1.5 after:w-px"
                key={`${run.day}-${index}`}
                style={{ "--span": run.span }}
              >
                {titled || run.span >= 3 ? (
                  run.day
                ) : (
                  <abbr className="no-underline" title={run.day}>
                    <span aria-hidden="true">{run.day[0]}</span>
                    <span className="sr-only">{run.day}</span>
                  </abbr>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
