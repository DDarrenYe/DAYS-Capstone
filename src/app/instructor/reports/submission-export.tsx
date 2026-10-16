import { loadSubmission } from "@/app/instructor/visualiser/load-submission";
import { NoSubmission } from "@/app/instructor/visualiser/no-submission";
import { ReportBuilder } from "@/components/report/report-builder";
import { PageBar } from "@/components/shell/page-bar";

export const SubmissionExport = async ({
  searchParams,
}: Pick<PageProps<"/instructor/reports">, "searchParams">) => {
  const { detail, problem } = await loadSubmission(searchParams);
  if (!detail) {
    return (
      <NoSubmission page="Reports">
        {
          {
            empty: "This submission has no logged steps.",
            missing:
              "That submission doesn’t exist, or it isn’t in one of your courses.",
            none: "Open a submission from the list, then choose Export to build its report.",
          }[problem]
        }
      </NoSubmission>
    );
  }
  return (
    <>
      <PageBar
        crumbs={[
          { href: "/instructor", label: "Submissions" },
          {
            href: `/instructor/visualiser?project=${detail.id}`,
            label: detail.name,
          },
          { label: "Export" },
        ]}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <ReportBuilder detail={detail} />
      </div>
    </>
  );
};
