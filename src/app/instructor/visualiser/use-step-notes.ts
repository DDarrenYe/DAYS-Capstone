import { useState } from "react";

import type { SubmissionDetail } from "@/app/instructor/visualiser/submission-detail";
import { useSaveNote } from "@/lib/data/use-mutations";

export interface StepNoteState {
  draft: string;
  error?: string;
  saved: string;
  saving: boolean;
}

const EMPTY: StepNoteState = { draft: "", saved: "", saving: false };

export const useStepNotes = ({ id: projectId, steps }: SubmissionDetail) => {
  const [notes, setNotes] = useState<Record<string, StepNoteState>>(() =>
    Object.fromEntries(
      steps.map(({ id, note }) => [
        id,
        { draft: note, saved: note, saving: false },
      ])
    )
  );
  const { mutateAsync } = useSaveNote();

  const noteOf = (stepId: string) => notes[stepId] ?? EMPTY;
  const patch = (stepId: string, change: Partial<StepNoteState>) =>
    setNotes((current) => ({
      ...current,
      [stepId]: { ...(current[stepId] ?? EMPTY), ...change },
    }));

  const save = async (stepId: string) => {
    const { draft, saved, saving } = noteOf(stepId);
    const body = draft.trim();
    if (saving || body === saved) {
      return;
    }
    patch(stepId, { error: undefined, saving: true });
    try {
      await mutateAsync({ body, projectId, stepId });
      patch(stepId, { saved: body, saving: false });
    } catch (error) {
      patch(stepId, {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save. Try again shortly.",
        saving: false,
      });
    }
  };

  return {
    noteOf,
    save,
    write: (stepId: string, draft: string) => patch(stepId, { draft }),
  };
};
