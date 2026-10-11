import { cacheLife } from "next/cache";

import { assignmentsQuery } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";

export const getAssignments = async (userId: string) => {
  "use cache: private";
  cacheLife({ stale: 300 });
  const assignments = await assignmentsQuery(
    await createClient(),
    userId
  ).queryFn();
  return { assignments, fetchedAt: Date.now() };
};
