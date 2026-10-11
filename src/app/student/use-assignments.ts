"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { assignmentsQuery } from "@/lib/data/queries";
import type { AssignmentRows } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/browser";

export interface InitialAssignments {
  fetchedAt: number;
  initialAssignments: AssignmentRows;
  userId: string;
}

export const useAssignments = ({
  fetchedAt,
  initialAssignments,
  userId,
}: InitialAssignments) => {
  const { data, dataUpdatedAt } = useSuspenseQuery({
    ...assignmentsQuery(createClient(), userId),
    initialData: initialAssignments,
    initialDataUpdatedAt: fetchedAt,
  });
  return { assignments: data, now: dataUpdatedAt };
};
