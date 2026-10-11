import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Step } from "@/lib/process";
import { cn } from "@/lib/utils";

/* 0.19px per word: 400 words rise 76px into the 84px (h-21) area, and 200 words sit on the top-11.5 gridline. */
const SCALE = 0.19;
const px = (words: number) => `${Math.max(words * SCALE, 1.5)}px`;

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

/*
  Every step is a column and a button: AI words rise above the baseline, the part that reached the essay in
  cobalt, and the critique hangs below on the same scale. The selected band slides between columns on click
  and jumps on arrow keys, which never animate.
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
}) => (
  <div className="flex">
    <div
      aria-hidden="true"
      className="text-faint text-micro relative w-8.5 shrink-0 font-mono"
    >
      <span className="absolute top-0 -translate-y-1/2">400</span>
      <span className="absolute top-11.5 -translate-y-1/2">200</span>
    </div>
    <div className="relative min-w-0 flex-1">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-11.5 border-t border-dashed"
      />
      <div
        aria-hidden="true"
        className="bg-border-strong pointer-events-none absolute inset-x-0 top-21 h-px"
      />
      <div className="relative grid auto-cols-fr grid-flow-col">
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
          {steps.map((step, index) => (
            <Tooltip key={step.title}>
              <TooltipTrigger
                className="group/col relative flex cursor-pointer flex-col items-center rounded-lg px-1.5 pb-2 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2"
                onBlur={() => onHover(null)}
                onClick={() => onSelect(index)}
                onFocus={() => onHover(index)}
                onMouseEnter={() => onHover(index)}
                onMouseLeave={() => onHover(null)}
                render={
                  <button
                    aria-label={describe(step, index)}
                    aria-pressed={index === selected}
                    type="button"
                  />
                }
              >
                <span
                  aria-hidden="true"
                  className="relative flex h-21 w-6.5 items-end"
                >
                  <span
                    className="bg-ai-soft animate-grow stagger absolute inset-x-0 bottom-0 h-(--h) origin-bottom rounded-xs"
                    style={{ "--h": px(step.words), "--i": index }}
                  />
                  {step.carried > 0 ? (
                    <span
                      className="bg-ai animate-grow stagger absolute inset-x-0 bottom-0 h-(--h) origin-bottom rounded-xs"
                      style={{ "--h": px(step.carried), "--i": index + 2 }}
                    />
                  ) : null}
                </span>
                <span aria-hidden="true" className="relative h-6 w-6.5">
                  <span
                    className={cn(
                      "animate-grow stagger absolute inset-x-0 top-0.5 h-(--h) origin-top rounded-xs",
                      step.flag ? "bg-flag" : "bg-human"
                    )}
                    style={{ "--h": px(step.critiqueWords), "--i": index + 3 }}
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
                    index === selected && "text-foreground"
                  )}
                >
                  S{index + 1}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "text-muted-foreground w-full truncate text-center text-xs",
                    index === selected && "text-foreground font-medium"
                  )}
                >
                  {step.title}
                </span>
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
          ))}
        </TooltipProvider>
      </div>
      <ol
        aria-label="Days worked"
        className="grid auto-cols-fr grid-flow-col pt-1"
      >
        {dayRuns(steps).map((run) => (
          <li
            className="text-muted-foreground before:bg-border-strong after:bg-border-strong border-border-strong text-label relative col-span-(--span) mx-5.5 mt-1.5 border-t pt-1 text-center font-medium before:absolute before:-top-1.5 before:left-0 before:h-1.5 before:w-px after:absolute after:-top-1.5 after:right-0 after:h-1.5 after:w-px"
            key={run.day}
            style={{ "--span": run.span }}
          >
            {run.day}
          </li>
        ))}
      </ol>
    </div>
  </div>
);
