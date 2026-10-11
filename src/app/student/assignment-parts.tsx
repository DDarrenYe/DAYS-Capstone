import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { AssignmentState } from "./assignment-state";

const dueDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  weekday: "short",
});

const duePrefix = ({ overdue, past }: AssignmentState) => {
  if (overdue) {
    return "Overdue · due";
  }
  return past ? "Was due" : "Due";
};

export const LaneBadge = ({ aiAllowed }: { aiAllowed: boolean }) => (
  <Badge variant={aiAllowed ? "ai" : "neutral"}>
    {aiAllowed ? "Lane 2 · AI allowed" : "Lane 1 · AI restricted"}
  </Badge>
);

export const DueLine = ({
  dueAt,
  state,
}: {
  dueAt: string | null;
  state: AssignmentState;
}) => {
  if (!(state.submitted || dueAt)) {
    return null;
  }
  return (
    <p
      className={cn(
        "flex items-center gap-2",
        state.overdue
          ? "text-destructive font-semibold"
          : "text-muted-foreground"
      )}
    >
      <Clock aria-hidden="true" size={18} />
      {state.submitted || !dueAt ? (
        "Submitted"
      ) : (
        <time dateTime={dueAt} suppressHydrationWarning>
          {duePrefix(state)} {dueDate.format(new Date(dueAt))}
        </time>
      )}
    </p>
  );
};
