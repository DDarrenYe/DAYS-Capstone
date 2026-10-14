import { useState } from "react";

import { ConfirmDialog } from "@/app/student/log/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { useSubmitProject } from "@/lib/data/use-mutations";

export const SubmitCard = ({
  blockers,
  projectId,
  submit,
}: {
  blockers: string[];
  projectId: string;
  submit: ReturnType<typeof useSubmitProject>;
}) => {
  const [asking, setAsking] = useState(false);

  const send = async () => {
    const done = await submit
      .mutateAsync({ projectId })
      .then(() => true)
      .catch(() => false);
    if (done) {
      setAsking(false);
    }
  };

  return (
    <Card className="mt-5" variant="raised">
      <div className="flex flex-wrap items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="font-heading">Ready to hand in?</p>
          {blockers.length > 0 ? (
            <ul className="text-body text-meta mt-1 list-disc pl-4">
              {blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          ) : (
            <p className="text-body text-meta mt-1">
              Once you submit, your steps and final version are locked.
            </p>
          )}
        </div>
        <Button disabled={blockers.length > 0} onClick={() => setAsking(true)}>
          Submit log
        </Button>
      </div>
      <ConfirmDialog
        confirm="Submit log"
        description="This hands in your log and final version. You won’t be able to change either one after that."
        error={submit.error?.message}
        onConfirm={send}
        onOpenChange={(open) => {
          setAsking(open);
          if (!open) {
            submit.reset();
          }
        }}
        open={asking}
        pending={submit.isPending}
        pendingLabel="Submitting…"
        title="Submit your log?"
        variant="default"
      />
    </Card>
  );
};
