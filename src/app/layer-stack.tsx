import { essay, steps } from "@/lib/example-data";
import { cn } from "@/lib/utils";

const traced = [
  ...new Set(
    essay.flat().flatMap(({ step }) => (step === undefined ? [] : [step]))
  ),
];

const beats = [
  "A pentimento is an earlier idea showing through a finished painting. Lying flat, a finished essay has one too.",
  "Underneath are the AI answers the student logged, one sheet for each passage that matched.",
  "Lift them apart and each passage sits on the answer it came from. A grader sees what came through, and what the student wrote past.",
];

const Sheet = ({ layer, step }: { layer: number; step?: number }) => (
  <div
    className={cn(
      "stack-sheet shadow-card text-micro/relaxed absolute inset-0 rounded-lg p-5 font-serif",
      step === undefined ? "bg-card/55 text-reading" : "bg-card/10"
    )}
    style={{ "--layer": layer }}
  >
    <p
      className={cn(
        "text-label font-emphasis mb-2.5 font-sans",
        step === undefined ? "text-muted-foreground" : "stack-label text-ai-ink"
      )}
    >
      {step === undefined
        ? "Final essay"
        : `S${step + 1} ${steps[step]?.title}`}
    </p>
    <div className="flex flex-col gap-2">
      {essay.map((paragraph) => (
        <p key={paragraph[0]?.text}>
          {paragraph.map((run) => {
            if (step === undefined) {
              return run.text;
            }
            if (run.step !== step) {
              return (
                <span className="text-transparent" key={run.text}>
                  {run.text}
                </span>
              );
            }
            return (
              <mark
                className={
                  steps[step]?.flag
                    ? "bg-flag-soft text-flag-ink"
                    : "bg-ai-soft text-ai-ink"
                }
                key={run.text}
              >
                {run.text}
              </mark>
            );
          })}
        </p>
      ))}
    </div>
  </div>
);

export const LayerStack = () => (
  <section
    aria-labelledby="stack-title"
    className="stack-scroll overflow-x-clip border-t"
  >
    <div className="stack-pin grid grid-cols-1 items-start gap-x-16 gap-y-12 pt-28 pb-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="flex flex-col gap-7">
        <h2
          className="text-headline font-semibold text-balance"
          id="stack-title"
        >
          Every essay has an earlier layer.
        </h2>
        <ol className="flex max-w-110 flex-col gap-4">
          {beats.map((beat, index) => (
            <li
              className="stack-beat text-lead border-l-2 border-current pl-4 text-pretty"
              key={beat}
              style={{ "--i": index }}
            >
              {beat}
            </li>
          ))}
        </ol>
      </div>
      <div
        aria-hidden="true"
        className="grid place-items-center self-stretch select-none perspective-distant"
      >
        <div className="stack relative h-86 w-120 max-md:scale-65">
          {traced.map((step, layer) => (
            <Sheet key={step} layer={layer} step={step} />
          ))}
          <Sheet layer={traced.length} />
        </div>
      </div>
    </div>
  </section>
);
