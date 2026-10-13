import { useIsFetching } from "@tanstack/react-query";
import { useEffect, useEffectEvent } from "react";
import { z } from "zod";

import type { SavedFinal } from "@/app/student/log/step-meta";
import { queryKeys } from "@/lib/data/queries";
import { useSaveFinal, WriteError } from "@/lib/data/use-mutations";
import { usePersistentState } from "@/lib/local-state";

const AUTOSAVE_MS = 1200;

const editSchema = z
  .object({
    base: z.int().nonnegative(),
    filename: z.string().nullable(),
    text: z.string(),
  })
  .nullable();

type Edit = NonNullable<z.infer<typeof editSchema>>;

export type FinalStatus =
  | "saved"
  | "unsaved"
  | "saving"
  | "failed"
  | "conflict";

export const useFinalDraft = ({
  projectId,
  userId,
  saved,
  locked,
}: {
  projectId: string;
  userId: string;
  saved: SavedFinal;
  locked: boolean;
}) => {
  const [edit, setEdit, clearEdit] = usePersistentState(
    `final:${projectId}`,
    editSchema,
    null
  );
  const save = useSaveFinal(userId);
  const refreshing =
    useIsFetching({ queryKey: queryKeys.projectLog(userId, projectId) }) > 0;
  const conflict = save.error instanceof WriteError && save.error.conflict;
  const shown = locked ? null : edit;

  const send = (draft: Edit) =>
    save.mutate(
      {
        base: draft.base,
        filename: draft.filename,
        projectId,
        text: draft.text,
      },
      {
        onSuccess: ({ version }) =>
          setEdit((current) => {
            if (!current) {
              return current;
            }
            return current.text === draft.text &&
              current.filename === draft.filename
              ? null
              : { ...current, base: version };
          }),
      }
    );

  const autosave = useEffectEvent(send);
  useEffect(() => {
    if (!edit || locked || save.isPending || save.isError) {
      return;
    }
    const timer = setTimeout(() => autosave(edit), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [edit, locked, save.isPending, save.isError]);

  const text = shown?.text ?? saved.text;
  const filename = shown ? shown.filename : saved.filename;

  const change = (patch: Partial<Pick<Edit, "filename" | "text">>) => {
    const next = {
      base: edit?.base ?? saved.version,
      filename,
      text,
      ...patch,
    };
    if (!conflict) {
      save.reset();
    }
    if (next.text === saved.text && next.filename === saved.filename) {
      clearEdit();
    } else {
      setEdit(() => next);
    }
  };

  const retry = () => {
    if (edit) {
      send(edit);
    }
  };

  const keepMine = () => {
    if (edit) {
      const rebased = { ...edit, base: saved.version };
      setEdit(() => rebased);
      send(rebased);
    }
  };

  const adoptSaved = () => {
    clearEdit();
    save.reset();
  };

  let status: FinalStatus = "saved";
  if (conflict) {
    status = "conflict";
  } else if (save.isPending) {
    status = "saving";
  } else if (save.isError) {
    status = "failed";
  } else if (shown) {
    status = "unsaved";
  }

  return {
    adoptSaved,
    change,
    error: save.error?.message,
    filename,
    keepMine,
    refreshing,
    retry,
    status,
    text,
  };
};
