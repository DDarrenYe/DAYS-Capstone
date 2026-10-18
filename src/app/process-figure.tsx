import { ProcessBars } from "@/components/process/process-bars";
import { steps } from "@/lib/example-data";
import { wordsAxis } from "@/lib/process";

const WIDTH = 560;
const HEIGHT = 140;
const BASE = 92;
const scale = (BASE - 1) / wordsAxis(steps);

const most = (key: "carried" | "critiqueWords" | "words") =>
  steps.toSorted((a, b) => b[key] - a[key])[0];

const answer = most("words");
const carried = most("carried");
const critique = most("critiqueWords");
const flagged = steps.find((step) => step.flag);

const notes = [
  {
    body: "Every word it gave, in soft cobalt above the line.",
    step: answer,
    title: "The AI's answer",
    y: BASE - answer.words * scale,
  },
  {
    body: "The part found in the final text, in solid cobalt.",
    step: carried,
    title: "What reached the essay",
    y: BASE - (carried.carried * scale) / 2,
  },
  {
    body: "The student's own words hang below, on the same scale.",
    step: critique,
    title: "The critique",
    y: BASE + 1.5 + critique.critiqueWords * scale,
  },
  ...(flagged
    ? [
        {
          body: `Just “${flagged.critique}” for an answer whose ${flagged.carried} words reached the conclusion.`,
          step: flagged,
          title: "A flagged critique",
          y: BASE + 4,
        },
      ]
    : []),
];

const Pin = ({ children }: { children: number }) => (
  <span className="bg-primary text-primary-foreground text-label font-emphasis grid size-5 shrink-0 place-items-center rounded-full tabular-nums">
    {children}
  </span>
);

export const ProcessFigure = () => (
  <div className="bg-card shadow-card chart-grow overflow-clip rounded-xl">
    <div aria-hidden="true" className="overflow-x-auto p-8 max-md:p-5">
      <div className="relative min-w-120">
        <ProcessBars
          base={BASE}
          className="w-full"
          height={HEIGHT}
          labels
          steps={steps}
          width={WIDTH}
        />
        {notes.map(({ step, title, y }, note) => (
          <span
            className="pop-in absolute top-(--y) left-(--x) ml-4 -translate-y-1/2"
            key={title}
            style={{
              "--i": steps.indexOf(step),
              "--x": `${((steps.indexOf(step) + 0.5) / steps.length) * 100}%`,
              "--y": `${(y / HEIGHT) * 100}%`,
            }}
          >
            <Pin>{note + 1}</Pin>
          </span>
        ))}
      </div>
    </div>
    <ol className="bg-border grid gap-px border-t sm:grid-cols-2 lg:grid-cols-4">
      {notes.map(({ body, title }, note) => (
        <li className="bg-card flex gap-3 p-5" key={title}>
          <Pin>{note + 1}</Pin>
          <span className="flex flex-col gap-1">
            <b className="font-heading tracking-snug">{title}</b>
            <span className="text-body text-pretty">{body}</span>
          </span>
        </li>
      ))}
    </ol>
  </div>
);
