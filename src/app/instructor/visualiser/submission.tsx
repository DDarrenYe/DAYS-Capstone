import { z } from "zod";

import { NoSubmission } from "@/app/instructor/visualiser/no-submission";
import { submissionDetail } from "@/app/instructor/visualiser/submission-detail";
import { Visualiser } from "@/app/instructor/visualiser/visualiser";
import { requireRole } from "@/lib/auth";
import { submissionQuery } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";

export const Submission = async ({
  searchParams,
}: Pick<PageProps<"/instructor/visualiser">, "searchParams">) => {
  const { project } = await searchParams;
  const { id } = await requireRole("instructor");
  const projectId = z.guid().safeParse(project);
  if (!projectId.success) {
    return (
      <NoSubmission>
        Open a submission from the list to see how it was written.
      </NoSubmission>
    );
  }
  const found = await submissionQuery(
    await createClient(),
    id,
    projectId.data
  ).queryFn();
  if (!found) {
    return (
      <NoSubmission>
        That submission doesn’t exist, or it isn’t in one of your courses.
      </NoSubmission>
    );
  }
  const detail = submissionDetail(found);
  if (detail.steps.length === 0) {
    return <NoSubmission>This submission has no logged steps.</NoSubmission>;
  }
  return <Visualiser detail={detail} key={detail.id} />;
};
