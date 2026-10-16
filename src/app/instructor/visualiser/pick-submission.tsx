import Link from "next/link";

import { CHECK_STATE } from "@/app/instructor/check-state";
import { loadSubmissionRows } from "@/app/instructor/submissions";
import { NoSubmission } from "@/app/instructor/visualiser/no-submission";
import { Icon } from "@/components/icon";
import { Avatar } from "@/components/shell/avatar";
import { PageBar } from "@/components/shell/page-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const PickSubmission = async ({
  intro,
  page,
}: {
  intro: string;
  page: "Reports" | "Visualiser";
}) => {
  const rows = await loadSubmissionRows();
  if (rows.length === 0) {
    return (
      <NoSubmission page={page}>
        Nobody has submitted yet. Submissions appear here as soon as a student
        submits their log.
      </NoSubmission>
    );
  }
  const assignments = [
    ...Map.groupBy(rows, ({ assignmentId }) => assignmentId).values(),
  ].toSorted((first, second) =>
    (first[0]?.assignment ?? "").localeCompare(second[0]?.assignment ?? "")
  );
  return (
    <>
      <PageBar
        crumbs={[
          { href: "/instructor", label: "Submissions" },
          { label: page },
        ]}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-170 flex-col gap-5 px-6 py-10 max-md:px-4">
          <div>
            <h1 className="text-title font-semibold">Choose a submission</h1>
            <p className="text-body mt-1.5 text-pretty">{intro}</p>
          </div>
          {assignments.map((group) => (
            <Card key={group[0]?.assignmentId}>
              <CardHeader>
                <CardTitle>{group[0]?.assignment}</CardTitle>
                <CardAction>
                  {group.length}{" "}
                  {group.length === 1 ? "submission" : "submissions"}
                </CardAction>
              </CardHeader>
              <ul>
                {group.map((row) => {
                  const { dot, label } = CHECK_STATE[row.state];
                  return (
                    <li className="border-t first:border-t-0" key={row.id}>
                      <Link
                        className="hover:bg-muted group flex items-center gap-3 px-4 py-2.5 transition-colors duration-150"
                        href={`/instructor/${page.toLowerCase()}?project=${row.id}`}
                      >
                        <Avatar name={row.name} />
                        <span className="min-w-0 flex-1">
                          <span className="font-emphasis block truncate">
                            {row.name}
                          </span>
                          <span className="text-muted-foreground text-meta block truncate">
                            {row.stepCount}{" "}
                            {row.stepCount === 1 ? "step" : "steps"}
                          </span>
                        </span>
                        <span className="text-body text-meta flex items-center gap-1.75 max-sm:hidden">
                          <i
                            className={cn("block size-1.5 rounded-full", dot)}
                          />
                          {label}
                        </span>
                        {row.openFlags > 0 ? (
                          <Badge variant="flag">
                            <Icon name="flag" />
                            {row.openFlags}
                          </Badge>
                        ) : null}
                        <Icon
                          className="text-faint group-hover:text-foreground transition-colors duration-150"
                          name="right"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};
