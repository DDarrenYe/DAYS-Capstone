import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";

import { ConfirmDialog } from "@/app/student/log/confirm-dialog";
import { stepTitle } from "@/app/student/log/step-meta";
import type { LoggedStep } from "@/app/student/log/step-meta";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteStep } from "@/lib/data/use-mutations";

const afterRemoval = (stepNumber: number, total: number) => {
  if (total - 1 >= stepNumber) {
    return String(stepNumber);
  }
  return stepNumber > 1 ? String(stepNumber - 1) : "new";
};

export const StepActions = ({
  step,
  total,
  projectId,
  userId,
  saved,
  editing = false,
}: {
  step: LoggedStep;
  total: number;
  projectId: string;
  userId: string;
  saved: boolean;
  editing?: boolean;
}) => {
  const [, setStepParam] = useQueryState("step", parseAsString);
  const [, setEditParam] = useQueryState("edit", parseAsString);
  const [asking, setAsking] = useState(false);
  const removal = useDeleteStep(userId);

  const remove = async () => {
    const done = await removal
      .mutateAsync({ projectId, stepId: step.id })
      .then(() => true)
      .catch(() => false);
    if (done) {
      setAsking(false);
      setEditParam(null);
      setStepParam(afterRemoval(step.step_number, total));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button aria-label="Step actions" size="icon" variant="ghost" />
          }
        >
          <Icon name="more" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {saved && !editing ? (
            <>
              <DropdownMenuItem
                onClick={() => setEditParam(String(step.step_number))}
              >
                <Icon name="edit" />
                Edit critique
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem onClick={() => setAsking(true)} tone="destructive">
            <Icon name="trash" />
            Remove step
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        confirm="Remove step"
        description={`This removes “${stepTitle(step)}” ${saved ? "and your critique" : "and anything you wrote for it"} from your log. The steps after it move up one number. ${step.source_url ? "You can import it again from the share link." : "This can't be undone."}`}
        error={removal.error?.message}
        onConfirm={remove}
        onOpenChange={(open) => {
          setAsking(open);
          if (!open) {
            removal.reset();
          }
        }}
        open={asking}
        pending={removal.isPending}
        pendingLabel="Removing…"
        title={`Remove step ${step.step_number}?`}
      />
    </>
  );
};
