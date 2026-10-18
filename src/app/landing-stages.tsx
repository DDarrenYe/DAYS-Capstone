import type { ReactNode } from "react";

import { Icon } from "@/components/icon";
import { CompositionBar, DepthMeter } from "@/components/process/metrics";
import { ProcessBars } from "@/components/process/process-bars";
import { Badge } from "@/components/ui/badge";
import { steps, summary } from "@/lib/example-data";
import { formatPercent } from "@/lib/process";
import { cn } from "@/lib/utils";

const caught = steps.find((step) => step.caught);
const flagged = steps.find((step) => step.flag);

const LogVignette = () => (
  <div className="flex flex-col gap-2.5">
    <div className="stage-in flex items-center gap-2 [--i:0]">
      <Badge variant="ai">ChatGPT</Badge>
      <span className="text-faint text-label truncate font-mono">
        chatgpt.com/share/6f2a91c…
      </span>
    </div>
    <ol className="flex flex-col gap-1.5">
      {steps.slice(0, 3).map((step, index) => {
        const waiting = index === 2;
        return (
          <li
            className={cn(
              "stage-in flex items-center gap-2.5 rounded-lg px-2.5 py-2",
              waiting ? "bg-ai-wash shadow-ai-ring" : "bg-card shadow-hairline"
            )}
            key={step.title}
            style={{ "--i": index + 1 }}
          >
            <span
              className={cn(
                "text-micro grid size-5 shrink-0 place-items-center rounded-full font-mono font-medium",
                waiting
                  ? "bg-ai text-white"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {waiting ? index + 1 : <Icon className="size-3" name="check" />}
            </span>
            <span className="text-meta font-emphasis truncate">
              {step.title}
            </span>
            {waiting ? (
              <Badge className="ml-auto" variant="review">
                Needs critique
              </Badge>
            ) : null}
          </li>
        );
      })}
    </ol>
  </div>
);

const VERDICTS = [
  { dot: "bg-success", label: "Right" },
  { dot: "bg-review", label: "Partly" },
  { dot: "bg-flag", label: "Wrong" },
];

const CritiqueVignette = () => (
  <div className="flex flex-col gap-3">
    <span className="bg-muted shadow-hairline stage-in inline-flex w-fit rounded-lg p-0.5 [--i:0]">
      {VERDICTS.map(({ dot, label }) => (
        <span
          className={cn(
            "text-meta inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 font-medium",
            label === "Wrong"
              ? "bg-flag-soft text-flag-ink"
              : "text-muted-foreground"
          )}
          key={label}
        >
          <i className={cn("size-1.5 rounded-full", dot)} />
          {label}
        </span>
      ))}
    </span>
    <p className="text-reading border-human stage-reveal line-clamp-3 border-l-2 pl-3 font-serif [--i:1]">
      {caught?.critique}
    </p>
    <div className="stage-in flex items-center gap-2 [--i:3]">
      <Badge variant="success">
        <Icon name="caught" />
        Caught: {caught?.caught}
      </Badge>
      <span className="text-muted-foreground text-label ml-auto flex items-center gap-1.5">
        <DepthMeter depth={3} />3 of 3
      </span>
    </div>
  </div>
);

const ReviewVignette = () => (
  <div className="flex flex-col gap-3">
    <div className="stage-in flex items-end justify-between gap-3 [--i:0]">
      <div>
        <span className="text-label text-muted-foreground font-emphasis block">
          Not traced to logged AI
        </span>
        <b className="text-figure font-heading tabular-nums">
          {formatPercent(summary.untraced)}
        </b>
      </div>
      <CompositionBar className="mb-1.5 w-24" traced={1 - summary.untraced} />
    </div>
    <ProcessBars
      base={46}
      className="stage-reveal w-full [--i:1]"
      height={64}
      steps={steps}
      width={280}
    />
    {flagged?.flag ? (
      <p className="text-flag-ink text-meta font-emphasis stage-in flex items-center gap-1.75 [--i:3]">
        <Icon name="flag" />
        {flagged.flag.title}
        <span className="text-muted-foreground font-book ml-auto font-mono">
          S{steps.indexOf(flagged) + 1}
        </span>
      </p>
    ) : null}
  </div>
);

const stages: {
  body: string;
  title: string;
  vignette: ReactNode;
}[] = [
  {
    body: "Import a ChatGPT share link or paste the chat. Each prompt and answer becomes a step, in the order it happened.",
    title: "Log the chat",
    vignette: <LogVignette />,
  },
  {
    body: "Say whether the AI was right, how you checked and what you changed. An error you catch is the best evidence you can give.",
    title: "Critique each answer",
    vignette: <CritiqueVignette />,
  },
  {
    body: "Graders see which answers reached the essay and where a critique ran thin. A flag asks them to look closer and never sets a grade.",
    title: "Review the process",
    vignette: <ReviewVignette />,
  },
];

export const Stages = () => (
  <ol className="bg-card shadow-card grid overflow-clip rounded-xl max-md:divide-y md:grid-cols-3 md:divide-x">
    {stages.map(({ body, title, vignette }, index) => (
      <li className="stage flex flex-col" key={title}>
        <div
          aria-hidden="true"
          className="bg-muted flex h-48 flex-col justify-center border-b px-5"
        >
          {vignette}
        </div>
        <div className="flex flex-col gap-2 p-5">
          <span className="flex items-center gap-2.5">
            <span className="bg-card text-body shadow-strong-ring text-label grid size-6.5 place-items-center rounded-lg font-mono font-medium">
              {`0${index + 1}`}
            </span>
            <h3 className="font-heading tracking-snug text-lead">{title}</h3>
          </span>
          <p className="text-body text-pretty">{body}</p>
        </div>
      </li>
    ))}
  </ol>
);
