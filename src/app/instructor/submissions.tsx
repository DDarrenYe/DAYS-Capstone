import { SubmissionsTable } from "@/app/instructor/submissions-table";
import { requireRole } from "@/lib/auth";
import { cohortMetricsQuery } from "@/lib/data/queries";
import { submissionRows } from "@/lib/submission-rows";
import { createClient } from "@/lib/supabase/server";

/* Read on the server as the signed-in instructor, so RLS decides which courses show and the essay text never reaches the browser. */
export const Submissions = async () => {
  const { id } = await requireRole("instructor");
  const rows = submissionRows(
    await cohortMetricsQuery(await createClient(), id).queryFn()
  );
  if (rows.length === 0) {
    return (
      <section aria-label="Submissions" className="px-6 pb-6 max-md:px-4">
        <p className="text-muted-foreground py-8 text-center">
          No submissions yet. Students appear here once they submit their log.
        </p>
      </section>
    );
  }
  return <SubmissionsTable rows={rows} />;
};
