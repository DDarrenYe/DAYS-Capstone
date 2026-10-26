import { loadSubmission } from "@/app/instructor/visualiser/load-submission";
import { NoSubmission } from "@/app/instructor/visualiser/no-submission";
import { PickSubmission } from "@/app/instructor/visualiser/pick-submission";
import { Visualiser } from "@/app/instructor/visualiser/visualiser";

export const Submission = async ({
  searchParams,
}: Pick<PageProps<"/instructor/visualiser">, "searchParams">) => {
  const loaded = await loadSubmission(searchParams);
  if (loaded.detail) {
    return <Visualiser detail={loaded.detail} key={loaded.detail.id} />;
  }
  if (loaded.problem === "none") {
    return (
      <PickSubmission
        intro="Open one to see every step, the critique beside it and where the final text came from."
        page="Submissions"
      />
    );
  }
  return (
    <NoSubmission>
      {
        {
          empty: "This submission has no logged steps.",
          missing:
            "That submission doesn’t exist, or it isn’t in one of your courses.",
        }[loaded.problem]
      }
    </NoSubmission>
  );
};
