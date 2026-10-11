import { FlagList } from "@/app/instructor/flags/flag-list";
import { PageBar } from "@/components/shell/page-bar";
import { cohortFlags, assignmentName, student } from "@/lib/example-data";

const students = new Set(cohortFlags.map((flag) => flag.name)).size;

const FlagsPage = () => (
  <>
    <PageBar
      crumbs={[
        { href: "/instructor", label: assignmentName },
        { label: "Flags" },
      ]}
      example
    />
    <div className="flex-1 overflow-y-auto">
      <section className="animate-rise px-6 pt-5 max-md:px-4">
        <h1 className="text-title font-semibold">
          {cohortFlags.length} flags across {students} students
        </h1>
        <p className="text-muted-foreground mt-1.5 max-w-160 text-pretty">
          The reflection check suggests where a critique may be thin. Keep a
          flag to add it to your feedback, or dismiss it. Flags never change a
          grade.
        </p>
      </section>
      <FlagList detailFor={student.name} flags={cohortFlags} />
    </div>
  </>
);

export default FlagsPage;
