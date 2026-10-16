import { CohortOverview } from "@/app/instructor/cohort-overview";
import { requireRole } from "@/lib/auth";
import { cohortMetricsQuery } from "@/lib/data/queries";
import { submissionRows } from "@/lib/submission-rows";
import { createClient } from "@/lib/supabase/server";

/* Read on the server as the signed-in instructor, so RLS decides which courses show and the essay text never reaches the browser. */
export const loadSubmissionRows = async () => {
  const { id } = await requireRole("instructor");
  return submissionRows(
    await cohortMetricsQuery(await createClient(), id).queryFn()
  );
};

export const Submissions = async () => (
  <CohortOverview rows={await loadSubmissionRows()} />
);
