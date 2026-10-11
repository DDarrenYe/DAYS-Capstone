import { ReportBuilder } from "@/components/report/report-builder";
import { PageBar } from "@/components/shell/page-bar";
import { assignmentName } from "@/lib/example-data";

const ReportsPage = () => (
  <>
    <PageBar
      crumbs={[
        { href: "/instructor", label: assignmentName },
        { label: "Reports" },
      ]}
      example
    />
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <ReportBuilder />
    </div>
  </>
);

export default ReportsPage;
