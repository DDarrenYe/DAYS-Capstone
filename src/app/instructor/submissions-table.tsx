"use client";

import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  functionalUpdate,
  globalFilteringFeature,
  rowSortingFeature,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import Link from "next/link";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { useId, useMemo } from "react";

import { Icon } from "@/components/icon";
import { CompositionBar, DepthMeter } from "@/components/process/metrics";
import { ProcessBars } from "@/components/process/process-bars";
import { Avatar } from "@/components/shell/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatPercent, wordsAxis } from "@/lib/process";
import { useReviewed } from "@/lib/review-state";
import { cn } from "@/lib/utils";

const STATUS = {
  done: { dot: "bg-success", label: "Reviewed", rank: 0 },
  flagged: {
    dot: "bg-flag ring-3 ring-flag-soft",
    label: "Needs review",
    rank: 2,
  },
  review: {
    dot: "bg-review ring-3 ring-review-soft",
    label: "Needs review",
    rank: 1,
  },
};

const statusOf = (student: CohortStudent) =>
  student.status === "review" && student.flags > 0 ? "flagged" : student.status;

/* With no sort chosen, rows keep this order: open flags, then work waiting for review, then the most AI-traced. */
const lookCloserFirst = (a: CohortStudent, b: CohortStudent) =>
  b.flags - a.flags ||
  STATUS[statusOf(b)].rank - STATUS[statusOf(a)].rank ||
  b.traced - a.traced;

const SORTABLE = [
  "student",
  "traced",
  "caught",
  "depth",
  "flags",
  "status",
  "submitted",
] as const;

const SORT_LABEL: Record<(typeof SORTABLE)[number], string> = {
  caught: "Errors caught",
  depth: "Critique depth",
  flags: "Flags",
  status: "Status",
  student: "Student",
  submitted: "Submitted",
  traced: "Traced to logged AI",
};

/* Columns whose values line up on the right. */
const NUMERIC = new Set(["caught", "submitted"]);

/* Search, the flagged filter and sort live in the URL, so Back from a student restores the same view. */
const viewParams = {
  flagged: parseAsBoolean.withDefault(false),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  q: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(SORTABLE),
};

const features = tableFeatures({
  columnFilteringFeature,
  filterFns: { includesString: filterFn_includesString },
  filteredRowModel: createFilteredRowModel(),
  globalFilteringFeature,
  rowSortingFeature,
  sortFns: { basic: sortFn_basic, text: sortFn_text },
  sortedRowModel: createSortedRowModel(),
});

const helper = createColumnHelper<typeof features, CohortStudent>();

/* axis is the shared words maximum, so every row's process bars use the same scale and compare fairly. */
const columnsFor = (axis: number) =>
  helper.columns([
    helper.accessor((row) => `${row.name} ${row.id}`, {
      cell: ({ row }) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={row.original.name} />
          {row.original.detail ? (
            <Link
              className="font-emphasis after:absolute after:inset-0 hover:underline"
              href="/instructor/visualiser"
            >
              {row.original.name}
            </Link>
          ) : (
            <b className="font-emphasis">{row.original.name}</b>
          )}
          <span className="text-faint text-label font-mono">
            {row.original.id}
          </span>
        </span>
      ),
      header: "Student",
      id: "student",
      sortFn: "text",
    }),
    helper.display({
      cell: ({ row }) => (
        <ProcessBars
          base={21}
          height={32}
          max={axis}
          steps={row.original.steps}
          width={120}
        />
      ),
      header: "Process",
      id: "process",
    }),
    helper.accessor("traced", {
      cell: ({ row }) => (
        <span className="flex items-center gap-2.5 tabular-nums">
          <CompositionBar className="w-16" traced={row.original.traced} />
          {formatPercent(row.original.traced)}
        </span>
      ),
      header: "Traced to logged AI",
      sortDescFirst: true,
      sortFn: "basic",
    }),
    helper.accessor("caught", {
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.caught}</span>
      ),
      header: "Errors caught",
      sortDescFirst: true,
      sortFn: "basic",
    }),
    helper.accessor("depth", {
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <DepthMeter depth={row.original.depth} />
          <span className="text-muted-foreground tabular-nums">
            {row.original.depth.toFixed(1)}
          </span>
        </span>
      ),
      header: "Critique depth",
      sortDescFirst: false,
      sortFn: "basic",
    }),
    helper.accessor("flags", {
      cell: ({ row }) =>
        row.original.flags > 0 ? (
          <Badge variant="flag">
            <Icon name="flag" />
            {row.original.flags}
          </Badge>
        ) : (
          <span className="text-faint">—</span>
        ),
      filterFn: (row, columnId, onlyFlagged) =>
        !onlyFlagged || row.getValue<number>(columnId) > 0,
      header: "Flags",
      sortDescFirst: true,
      sortFn: "basic",
    }),
    helper.accessor((row) => STATUS[statusOf(row)].rank, {
      cell: ({ row }) => {
        const status = STATUS[statusOf(row.original)];
        return (
          <span className="text-body text-meta flex items-center gap-1.75">
            <i className={cn("block size-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
        );
      },
      header: "Status",
      id: "status",
      sortDescFirst: true,
      sortFn: "basic",
    }),
    helper.accessor("submittedAt", {
      cell: ({ row }) => (
        <span className="text-muted-foreground text-label font-mono">
          {row.original.submitted}
        </span>
      ),
      header: "Submitted",
      id: "submitted",
      sortDescFirst: true,
      sortFn: "basic",
    }),
  ]);

export const SubmissionsTable = ({
  students,
}: {
  students: readonly CohortStudent[];
}) => {
  const [view, setView] = useQueryStates(viewParams);
  const searchId = useId();
  const { reviewed } = useReviewed();
  const data = useMemo(
    () =>
      students
        .map((student) =>
          reviewed[student.id]
            ? { ...student, status: "done" as const }
            : student
        )
        .toSorted(lookCloserFirst),
    [students, reviewed]
  );
  const columns = useMemo(
    () => columnsFor(wordsAxis(students.flatMap((student) => student.steps))),
    [students]
  );
  const sorting: SortingState = view.sort
    ? [{ desc: view.order === "desc", id: view.sort }]
    : [];

  const table = useTable({
    columns,
    data,
    enableMultiSort: false,
    features,
    getColumnCanGlobalFilter: (column) => column.id === "student",
    globalFilterFn: "includesString",
    onSortingChange: (updater) => {
      const [next] = functionalUpdate(updater, sorting);
      const id = SORTABLE.find((sortable) => sortable === next?.id);
      setView({
        order: id && next?.desc === false ? "asc" : null,
        sort: id ?? null,
      });
    },
    state: {
      columnFilters: view.flagged ? [{ id: "flags", value: true }] : [],
      globalFilter: view.q,
      sorting,
    },
  });

  const { rows } = table.getRowModel();
  const flagged = students.filter((student) => student.flags > 0).length;

  return (
    <section
      aria-label="Submissions"
      className="px-6 pb-6 max-md:px-4"
      id="submissions"
    >
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
            onChange={(event) => setView({ q: event.target.value || null })}
            placeholder="Filter by name or ID"
            type="search"
            value={view.q}
          />
        </div>
        <Toggle
          onPressedChange={(pressed) => setView({ flagged: pressed || null })}
          pressed={view.flagged}
        >
          <Icon name="flag" />
          Flagged
          <Badge variant="flag">{flagged}</Badge>
        </Toggle>
        <span
          aria-live="polite"
          className="text-muted-foreground text-meta ml-auto flex items-center gap-1.5"
        >
          {rows.length === students.length
            ? `${students.length} submissions`
            : `${rows.length} of ${students.length}`}
          <span aria-hidden="true">·</span>
          {view.sort ? (
            <>
              Sorted by {SORT_LABEL[view.sort]}
              <Button
                onClick={() => setView({ order: null, sort: null })}
                size="sm"
                variant="ghost"
              >
                Look closer first
              </Button>
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              <Icon name="sort" />
              Look closer first
            </span>
          )}
        </span>
      </div>
      <Table className="min-w-230">
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const numeric = NUMERIC.has(header.column.id);
                const sortable = header.column.getCanSort();
                return (
                  <TableHead
                    aria-sort={
                      sortable
                        ? (sorted && `${sorted}ending`) || "none"
                        : undefined
                    }
                    className={numeric ? "text-right" : undefined}
                    key={header.id}
                  >
                    {sortable ? (
                      <button
                        className={cn(
                          "hover:text-foreground -mx-1 inline-flex items-center gap-1 rounded-sm px-1",
                          sorted && "text-foreground",
                          numeric && "flex-row-reverse"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        type="button"
                      >
                        <table.FlexRender header={header} />
                        <Icon
                          className={cn(
                            "size-3.5",
                            !sorted && "invisible",
                            sorted === "asc" && "rotate-180"
                          )}
                          name="down"
                        />
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              className={row.original.detail ? "relative" : undefined}
              data-state={row.original.detail ? "selected" : undefined}
              key={row.id}
            >
              {row.getAllCells().map((cell) => (
                <TableCell
                  className={
                    NUMERIC.has(cell.column.id) ? "text-right" : undefined
                  }
                  key={cell.id}
                >
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No submissions match this view.
        </p>
      ) : null}
    </section>
  );
};
