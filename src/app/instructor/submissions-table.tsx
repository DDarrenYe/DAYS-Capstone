"use client";

import Link from "next/link";
import { useDeferredValue, useId, useState } from "react";

import { Icon } from "@/components/icon";
import { CompositionBar, DepthMeter } from "@/components/process/metrics";
import { ProcessBars } from "@/components/process/process-bars";
import { Avatar } from "@/components/shell/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import type { CohortStudent } from "@/lib/example-data";
import { formatPercent } from "@/lib/process";
import { cn } from "@/lib/utils";

/* Look closer first: open flags, then students waiting for review, then the most AI-traced. */
const lookCloserFirst = (a: CohortStudent, b: CohortStudent) =>
  b.flags - a.flags ||
  Number(b.status === "review") - Number(a.status === "review") ||
  b.traced - a.traced;

const STATUS = {
  done: { dot: "bg-success", label: "Reviewed" },
  flagged: {
    dot: "bg-flag ring-3 ring-flag-soft",
    label: "Needs review",
  },
  review: {
    dot: "bg-review ring-3 ring-review-soft",
    label: "Needs review",
  },
};

export const SubmissionsTable = ({
  students,
}: {
  students: readonly CohortStudent[];
}) => {
  const [query, setQuery] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const search = useDeferredValue(query.trim().toLowerCase());
  const searchId = useId();
  const rows = students
    .filter(
      (student) =>
        (!flaggedOnly || student.flags > 0) &&
        (search === "" ||
          student.name.toLowerCase().includes(search) ||
          student.id.includes(search))
    )
    .toSorted(lookCloserFirst);
  const flagged = students.filter((student) => student.flags > 0).length;

  return (
    <section aria-label="Submissions" className="px-6 pb-6 max-md:px-4">
      <div className="flex flex-wrap items-center gap-2 pt-4 pb-2.5">
        <div className="relative w-65 max-sm:w-full">
          <label className="sr-only" htmlFor={searchId}>
            Filter by name or ID
          </label>
          <Icon
            className="text-faint pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
            name="search"
          />
          <Input
            density="compact"
            id={searchId}
            inset="icon"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by name or ID"
            type="search"
            value={query}
          />
        </div>
        <Toggle onPressedChange={setFlaggedOnly} pressed={flaggedOnly}>
          <Icon name="flag" />
          Flagged
          <Badge variant="flag">{flagged}</Badge>
        </Toggle>
        <span className="text-muted-foreground text-meta ml-auto flex items-center gap-1.5">
          <Icon name="sort" />
          Look closer first
        </span>
      </div>
      <Table className="min-w-230">
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Process</TableHead>
            <TableHead>Traced to logged AI</TableHead>
            <TableHead className="text-right">Errors caught</TableHead>
            <TableHead>Critique depth</TableHead>
            <TableHead>Flags</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((student) => {
            const status =
              STATUS[
                student.status === "review" && student.flags > 0
                  ? "flagged"
                  : student.status
              ];
            return (
              <TableRow
                className={student.detail ? "relative" : undefined}
                data-state={student.detail ? "selected" : undefined}
                key={student.name}
              >
                <TableCell>
                  <span className="flex items-center gap-2.5">
                    <Avatar name={student.name} />
                    {student.detail ? (
                      <Link
                        className="font-emphasis after:absolute after:inset-0 hover:underline"
                        href="/instructor/visualiser"
                      >
                        {student.name}
                      </Link>
                    ) : (
                      <b className="font-emphasis">{student.name}</b>
                    )}
                    <span className="text-faint text-label font-mono">
                      {student.id}
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <ProcessBars
                    base={21}
                    height={32}
                    scale={0.05}
                    steps={student.steps}
                    width={120}
                  />
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2.5 tabular-nums">
                    <CompositionBar className="w-16" traced={student.traced} />
                    {formatPercent(student.traced)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="tabular-nums">{student.caught}</span>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <DepthMeter depth={student.depth} />
                    <span className="text-muted-foreground tabular-nums">
                      {student.depth.toFixed(1)}
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  {student.flags > 0 ? (
                    <Badge variant="flag">
                      <Icon name="flag" />
                      {student.flags}
                    </Badge>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-body text-meta flex items-center gap-1.75">
                    <i
                      className={cn("block size-1.5 rounded-full", status.dot)}
                    />
                    {status.label}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-muted-foreground text-label font-mono">
                    {student.submitted}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {rows.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No submissions match “{query}”.
        </p>
      ) : null}
    </section>
  );
};
