import { Icon } from "@/components/icon";
import { CompositionBar } from "@/components/process/metrics";
import { ProcessBars } from "@/components/process/process-bars";
import { Avatar } from "@/components/shell/avatar";
import { essay, steps, student, summary } from "@/lib/example-data";
import { formatPercent } from "@/lib/process";
import { cn } from "@/lib/utils";

const flagged = steps.find((step) => step.flag);

/* The product, drawn from the same components and example data the app uses. */
export const LandingPreview = () => (
  <div aria-hidden="true" className="relative mb-16 max-lg:hidden">
    <div
      className="bg-card shadow-card animate-rise stagger rounded-xl p-5"
      style={{ "--i": 2 }}
    >
      <div className="flex items-center gap-3">
        <Avatar name={student.name} size="lg" />
        <div>
          <b className="text-lead tracking-snug block font-semibold">
            {student.name}
          </b>
          <span className="text-muted-foreground text-xs">
            Essay 2 · {steps.length} steps over 5 days
          </span>
        </div>
        <div className="ml-auto text-right">
          <span className="text-label text-muted-foreground font-emphasis block">
            Not traced to logged AI
          </span>
          <b className="text-stat font-heading">
            {formatPercent(summary.untraced)}
          </b>
          <CompositionBar
            className="mt-1.5 w-36"
            traced={1 - summary.untraced}
          />
        </div>
      </div>
      <div className="mt-5 border-t pt-4" style={{ "--i": 5 }}>
        <ProcessBars
          base={70}
          className="animate-reveal stagger w-full"
          height={104}
          labels
          steps={steps}
          width={520}
        />
      </div>
      <p
        className="text-reading text-lead mt-4 border-t pt-4 font-serif leading-relaxed"
        style={{ "--i": 14 }}
      >
        {essay[4]?.map((run) =>
          run.step === undefined ? (
            run.text
          ) : (
            <mark
              className={cn(
                "animate-trace stagger text-inherit motion-reduce:animate-none",
                steps[run.step]?.flag
                  ? "bg-flag-soft shadow-flagged"
                  : "bg-ai-wash shadow-traced"
              )}
              key={run.text}
            >
              {run.text}
            </mark>
          )
        )}
      </p>
    </div>
    {flagged?.flag ? (
      <div className="drift absolute -bottom-20 -left-10 w-76 [--drift:-56px]">
        <div
          className="bg-card shadow-pop animate-rise stagger rounded-xl p-3.5"
          style={{ "--i": 16 }}
        >
          <p className="text-flag-ink font-heading flex items-center gap-1.75">
            <Icon name="flag" />
            {flagged.flag.title}
          </p>
          <blockquote className="text-reading border-flag text-lead mt-2 border-l-2 pl-3 font-serif">
            “{flagged.critique}”
          </blockquote>
          <p className="text-muted-foreground mt-2 text-xs">
            Step {steps.indexOf(flagged) + 1} · {flagged.carried} words reached
            the conclusion
          </p>
        </div>
      </div>
    ) : null}
    <div className="drift absolute -top-5 -right-5 [--drift:-24px]">
      <div
        className="bg-success-soft text-success shadow-pop animate-rise stagger text-meta font-emphasis flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-2.5"
        style={{ "--i": 18 }}
      >
        <Icon name="caught" />
        {summary.caught} AI errors caught
      </div>
    </div>
  </div>
);
