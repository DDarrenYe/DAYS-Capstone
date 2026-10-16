import { useId, useState } from "react";

import { isSaved, loggedAt, stepTitle } from "@/app/student/log/step-meta";
import type { LoggedStep } from "@/app/student/log/step-meta";
import { Icon } from "@/components/icon";
import { SelectionHighlight } from "@/components/selection-highlight";
import { Progress } from "@/components/ui/progress";
import {
  ToggleGroup,
  ToggleGroupItem,
  ToggleGroupThumb,
} from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Viewing = number | "new" | "final" | undefined;
type Filter = "all" | "saved" | "waiting";

const filterOptions = [
  { key: "all", label: "All" },
  { key: "saved", label: "Saved" },
  { key: "waiting", label: "Waiting" },
] as const;

const itemClassName =
  "hover:bg-foreground/4 active:bg-foreground/8 focus-visible:shadow-focus grid w-full cursor-pointer grid-cols-[22px_minmax(0,1fr)] gap-x-2.5 rounded-lg px-2.5 py-2 text-left outline-none transition-colors duration-150";

const StepGroup = ({
  heading,
  saved,
  steps,
  viewing,
  onView,
}: {
  heading: string;
  saved: boolean;
  steps: readonly LoggedStep[];
  viewing: Viewing;
  onView: (view: number) => void;
}) => {
  const headingId = useId();
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="text-label text-muted-foreground font-emphasis flex items-center gap-2 px-2.5">
        <i
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            saved ? "bg-primary" : "bg-ai ring-ai-soft ring-3"
          )}
        />
        <span id={headingId}>{heading}</span>
        <span
          aria-hidden="true"
          className="text-faint ml-auto font-mono tabular-nums"
        >
          {steps.length}
        </span>
      </h2>
      <ol aria-labelledby={headingId} className="flex flex-col gap-0.5">
        {steps.map((item, index) => {
          const current = item.step_number === viewing;
          return (
            <li key={item.id}>
              <button
                aria-current={current ? "step" : undefined}
                className={itemClassName}
                onClick={() => onView(item.step_number)}
                type="button"
              >
                <span className="relative row-span-2 self-stretch">
                  {index < steps.length - 1 ? (
                    <i
                      aria-hidden="true"
                      className={cn(
                        "absolute top-3.25 -bottom-7.75 left-[10.5px]",
                        saved
                          ? "bg-border-strong w-px"
                          : "border-border-strong w-0 border-l border-dashed"
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "text-micro relative z-10 mt-0.5 grid size-5.5 place-items-center rounded-full font-mono font-medium transition-colors duration-200",
                      saved
                        ? "bg-primary text-primary-foreground"
                        : "bg-ai ring-ai-soft text-ai-foreground ring-3"
                    )}
                  >
                    {saved ? (
                      <Icon className="size-3" name="check" />
                    ) : (
                      item.step_number
                    )}
                  </span>
                </span>
                <b
                  className={cn(
                    "text-control line-clamp-2 font-medium",
                    current ? "text-foreground" : "text-body"
                  )}
                >
                  {stepTitle(item)}
                </b>
                <span className="text-faint text-label tabular-nums">
                  Step {item.step_number} ·{" "}
                  <time dateTime={item.created_at}>{loggedAt(item)}</time>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

const RailFilter = ({
  counts,
  value,
  onChange,
}: {
  counts: Record<Filter, number>;
  value: Filter;
  onChange: (value: Filter) => void;
}) => (
  <ToggleGroup
    aria-label="Show steps"
    onValueChange={([next]) => {
      const chosen = filterOptions.find(({ key }) => key === next);
      if (chosen) {
        onChange(chosen.key);
      }
    }}
    value={[value]}
  >
    <ToggleGroupThumb className="w-full">
      {filterOptions.map(({ key, label }) => (
        <ToggleGroupItem
          className="flex-1 justify-center"
          key={key}
          tone="thumb"
          value={key}
        >
          {label}
          <span className="text-faint font-mono tabular-nums">
            {counts[key]}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroupThumb>
  </ToggleGroup>
);

export const StepRail = ({
  title,
  steps,
  viewing,
  locked,
  finalLabel,
  onView,
}: {
  title: string;
  steps: readonly LoggedStep[];
  viewing: Viewing;
  locked: boolean;
  finalLabel?: string;
  onView: (view: number | "new" | "final") => void;
}) => {
  const [filter, setFilter] = useState<Filter>("all");
  const saved = steps.filter(isSaved);
  const waiting = steps.filter((step) => !isSaved(step));
  const filterable = !locked && saved.length > 0 && waiting.length > 0;
  const shown = filterable ? filter : "all";
  return (
    <nav
      aria-label={`Steps in ${title}`}
      className="flex flex-col gap-4 px-3 py-4.5 max-lg:border-b lg:overflow-y-auto lg:border-r"
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
      {filterable ? (
        <RailFilter
          counts={{
            all: steps.length,
            saved: saved.length,
            waiting: waiting.length,
          }}
          onChange={setFilter}
          value={shown}
        />
      ) : null}
      <SelectionHighlight
        className="flex flex-col gap-5"
        selector='[aria-current="step"]'
        thumbClassName="bg-ai-wash shadow-ai-ring rounded-lg"
      >
        {saved.length > 0 && shown !== "waiting" ? (
          <StepGroup
            heading="Saved in your log"
            onView={onView}
            saved
            steps={saved}
            viewing={viewing}
          />
        ) : null}
        {waiting.length > 0 && shown !== "saved" ? (
          <StepGroup
            heading={
              locked ? "Without a critique" : "Waiting for your critique"
            }
            onView={onView}
            saved={false}
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
        <button
          aria-current={viewing === "final" ? "step" : undefined}
          className={cn(
            itemClassName,
            "bg-card shadow-hairline aria-[current=step]:shadow-none"
          )}
          onClick={() => onView("final")}
          type="button"
        >
          <span className="text-body bg-muted shadow-hairline row-span-2 mt-0.5 grid size-5.5 place-items-center rounded-full">
            <Icon className="size-3.5" name="essay" />
          </span>
          <b
            className={cn(
              "text-control font-medium",
              viewing === "final" ? "text-foreground" : "text-body"
            )}
          >
            Final version
          </b>
          <span className="text-faint text-label">
            {finalLabel ?? "Your essay text"}
          </span>
        </button>
      </SelectionHighlight>
    </nav>
  );
};
