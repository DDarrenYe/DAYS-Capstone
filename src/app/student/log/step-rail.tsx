import { useId } from "react";

import { isSaved, loggedAt, stepTitle } from "@/app/student/log/step-meta";
import type { LoggedStep } from "@/app/student/log/step-meta";
import { Icon } from "@/components/icon";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Viewing = number | "new" | undefined;

const itemClassName =
  "hover:bg-foreground/4 aria-[current=step]:bg-ai-wash aria-[current=step]:shadow-ai-ring press focus-visible:shadow-focus grid w-full cursor-pointer grid-cols-[22px_minmax(0,1fr)] gap-x-2.5 rounded-lg px-2.5 py-2 text-left outline-none transition-colors duration-150";

const StepGroup = ({
  heading,
  steps,
  viewing,
  onView,
}: {
  heading: string;
  steps: readonly LoggedStep[];
  viewing: Viewing;
  onView: (view: number) => void;
}) => {
  const headingId = useId();
  return (
    <section className="flex flex-col gap-1">
      <h2
        className="text-label text-muted-foreground font-emphasis px-2.5"
        id={headingId}
      >
        {heading}
      </h2>
      <ol aria-labelledby={headingId} className="flex flex-col gap-0.5">
        {steps.map((item) => {
          const done = isSaved(item);
          const current = item.step_number === viewing;
          return (
            <li
              className="[&:not(:last-child)]:after:bg-border-strong relative [&:not(:last-child)]:after:absolute [&:not(:last-child)]:after:top-8.5 [&:not(:last-child)]:after:left-[20.5px] [&:not(:last-child)]:after:h-3 [&:not(:last-child)]:after:w-px"
              key={item.id}
            >
              <button
                aria-current={current ? "step" : undefined}
                className={itemClassName}
                onClick={() => onView(item.step_number)}
                type="button"
              >
                <span
                  className={cn(
                    "text-micro row-span-2 mt-0.5 grid size-5.5 place-items-center rounded-full font-mono font-medium transition-colors duration-200",
                    done && "bg-primary text-primary-foreground",
                    !done && "bg-ai ring-ai-soft text-white ring-3"
                  )}
                >
                  {done ? (
                    <Icon className="size-3" name="check" />
                  ) : (
                    item.step_number
                  )}
                </span>
                <b
                  className={cn(
                    "text-control line-clamp-2 font-medium",
                    current ? "text-foreground" : "text-body"
                  )}
                >
                  {stepTitle(item)}
                </b>
                <span className="text-faint text-label">
                  Step {item.step_number} · {loggedAt(item)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export const StepRail = ({
  title,
  steps,
  viewing,
  locked,
  onView,
}: {
  title: string;
  steps: readonly LoggedStep[];
  viewing: Viewing;
  locked: boolean;
  onView: (view: number | "new") => void;
}) => {
  const saved = steps.filter(isSaved);
  const waiting = steps.filter((step) => !isSaved(step));
  return (
    <nav
      aria-label={`Steps in ${title}`}
      className="flex flex-col gap-3 px-3 py-4.5 max-lg:border-b lg:overflow-y-auto lg:border-r"
    >
      <div className="px-2.5">
        <p className="text-label text-muted-foreground font-emphasis truncate">
          {title}
        </p>
        <div className="mt-2 flex items-center gap-2.5">
          <Progress
            aria-label="Steps with a saved critique"
            max={Math.max(steps.length, 1)}
            value={saved.length}
          />
          <span className="text-label text-muted-foreground font-mono whitespace-nowrap tabular-nums">
            {saved.length}/{steps.length}
          </span>
        </div>
      </div>
      {saved.length > 0 ? (
        <StepGroup
          heading="Saved in your log"
          onView={onView}
          steps={saved}
          viewing={viewing}
        />
      ) : null}
      {waiting.length > 0 ? (
        <StepGroup
          heading={locked ? "Without a critique" : "Waiting for your critique"}
          onView={onView}
          steps={waiting}
          viewing={viewing}
        />
      ) : null}
      {locked ? null : (
        <button
          aria-current={viewing === "new" ? "step" : undefined}
          className={cn(
            itemClassName,
            "border-border-strong border border-dashed hover:border-solid aria-[current=step]:border-solid"
          )}
          onClick={() => onView("new")}
          type="button"
        >
          <span className="text-body bg-card shadow-hairline row-span-2 mt-0.5 grid size-5.5 place-items-center rounded-full font-mono text-sm leading-none">
            +
          </span>
          <b
            className={cn(
              "text-control font-medium",
              viewing === "new" ? "text-foreground" : "text-body"
            )}
          >
            Add steps
          </b>
          <span className="text-faint text-label">
            Import a chat or paste one
          </span>
        </button>
      )}
    </nav>
  );
};
