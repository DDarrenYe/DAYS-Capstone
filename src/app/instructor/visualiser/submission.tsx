import { loadSubmission } from "@/app/instructor/visualiser/load-submission";
import { NoSubmission } from "@/app/instructor/visualiser/no-submission";
import { Visualiser } from "@/app/instructor/visualiser/visualiser";

export const Submission = async ({
  searchParams,
}: Pick<PageProps<"/instructor/visualiser">, "searchParams">) => {
  const loaded = await loadSubmission(searchParams);
  if (loaded.detail) {
    return <Visualiser detail={loaded.detail} key={loaded.detail.id} />;
  }
  return (
    <NoSubmission>
      {
        {
          empty: "This submission has no logged steps.",
          missing:
            "That submission doesn’t exist, or it isn’t in one of your courses.",
          none: "Open a submission from the list to see how it was written.",
        }[loaded.problem]
      }
    </NoSubmission>
  );
};
