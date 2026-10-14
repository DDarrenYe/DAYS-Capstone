"use client";

import { useCallback } from "react";
import { z } from "zod";

import { usePersistentState } from "@/lib/local-state";
import { withEntry } from "@/lib/stored";

/*
  A grader's decisions on the example cohort, shared by the Visualiser, Flags and Submissions so every screen
  agrees and nothing is lost on reload. When flag decisions land (#33) these hooks become mutations.
*/
type Decision = "kept" | "dismissed";

const decisionsSchema = z.record(z.string(), z.enum(["kept", "dismissed"]));
const reviewedSchema = z.record(z.string(), z.boolean());

const NONE: Record<string, never> = {};

/* Identifies one step of one student. Steps are numbered from 1, as graders see them. */
export const stepKey = (student: string, step: number) => `${student}-${step}`;

export const useFlagDecisions = () => {
  const [decisions, setDecisions] = usePersistentState(
    "review:flags",
    decisionsSchema,
    NONE
  );
  const decide = useCallback(
    (key: string, decision?: Decision) =>
      setDecisions((current) => withEntry(current, key, decision)),
    [setDecisions]
  );
  return { decide, decisions };
};

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
