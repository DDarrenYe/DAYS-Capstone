import Link from "next/link";

import { Icon } from "@/components/icon";
import { DepthMeter, Stat } from "@/components/process/metrics";
import { ProcessBars } from "@/components/process/process-bars";
import { PageBar } from "@/components/shell/page-bar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";
import { assignmentName, essayTitle, steps, summary } from "@/lib/example-data";
import { formatPercent } from "@/lib/process";
import { cn } from "@/lib/utils";

const figures = [
  ["Steps logged", String(steps.length)],
  ["AI errors you caught", String(summary.caught)],
  ["Critique depth", `${summary.depth.toFixed(1)} / 3`],
  ["Not traced to logged AI", formatPercent(summary.untraced)],
] as const;

const ProgressPage = () => (
  <>
    <PageBar
      crumbs={[
        { href: "/student", label: assignmentName },
        { label: "Progress" },
      ]}
      example
    >
      <Link className={buttonVariants()} href="/student/log">
        Continue logging
        <Icon name="right" />
      </Link>
    </PageBar>
    <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6 max-md:px-4">
      <h1 className="text-title font-semibold">Your process</h1>
      <p className="text-muted-foreground mt-1.5 max-w-160 text-pretty">
        How you worked with AI on {essayTitle}. Your grader sees the same steps.
        They read your essay as usual; this only shows how you got there.
      </p>
      <div className="mt-5 flex flex-wrap gap-y-3">
        {figures.map(([label, value]) => (
          <Stat key={label} label={label}>
            {value}
          </Stat>
        ))}
      </div>
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Every step</CardTitle>
          <CardAction>AI words above the line, your critique below</CardAction>
        </CardHeader>
        <div className="overflow-x-auto px-4 pt-4 pb-3">
          <ProcessBars
            className="w-full"
            base={96}
            height={134}
            labels
            steps={steps}
            width={720}
          />
        </div>
        <ol>
          {steps.map((step, index) => (
            <li
              className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-t px-4 py-2.5"
              key={step.title}
            >
              <span className="text-faint text-label font-mono">
                S{index + 1}
              </span>
              <span className="min-w-0">
                <b className="block truncate font-medium">{step.title}</b>
                <span
                  className={cn(
                    "text-xs",
                    step.flag ? "text-review-ink" : "text-muted-foreground"
                  )}
                >
                  {step.flag
                    ? "Say what you checked and what you changed"
                    : (step.caught &&
                        `You caught: ${step.caught.toLowerCase()}`) ||
                      step.time}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <DepthMeter depth={step.depth} />
                <span className="text-muted-foreground w-7 text-right tabular-nums">
                  {step.depth}/3
                </span>
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  </>
);

export default ProgressPage;
