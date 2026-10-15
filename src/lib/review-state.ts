"use client";

import { useCallback } from "react";
import { z } from "zod";

import { usePersistentState } from "@/lib/local-state";
import { withEntry } from "@/lib/stored";

const reviewedSchema = z.record(z.string(), z.boolean());

const NONE: Record<string, never> = {};

export const useReviewed = () => {
  const [reviewed, setReviewed] = usePersistentState(
    "review:reviewed",
    reviewedSchema,
    NONE
  );
  const markReviewed = useCallback(
    (studentId: string, value: boolean) =>
      setReviewed((current) =>
        withEntry(current, studentId, value ? true : undefined)
      ),
    [setReviewed]
  );
  return { markReviewed, reviewed };
};
