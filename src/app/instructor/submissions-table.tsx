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
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { useId } from "react";

import { CHECK_STATE } from "@/app/instructor/check-state";
import { Icon } from "@/components/icon";
import { CompositionBar } from "@/components/process/metrics";
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
import {
  ToggleGroup,
  ToggleGroupItem,
  ToggleGroupThumb,
} from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { critiqueOrder } from "@/lib/process";
import { attention, isUnfinished } from "@/lib/submission-rows";
import type { SubmissionRow } from "@/lib/submission-rows";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

const SORTABLE = [
  "student",
  "steps",
  "unmatched",
  "critique",
  "review",
  "submitted",
] as const;

const SORT_LABEL: Record<(typeof SORTABLE)[number], string> = {
  critique: "Critique score",
  review: "Status",
  steps: "Steps",
  student: "Student",
  submitted: "Submitted",
  unmatched: "Not from logged AI",
};

/* Columns whose values line up on the right. */
const NUMERIC = new Set(["steps", "submitted"]);

const SHOWN = ["flagged", "unfinished", "clear"] as const;

const shownIn = (show: (typeof SHOWN)[number], row: SubmissionRow) => {
  if (show === "flagged") {
    return row.state === "flagged";
  }
  if (show === "unfinished") {
    return isUnfinished(row);
  }
  return row.state !== "flagged" && !isUnfinished(row);
};

const FILTERS = [
  { label: "Needs review", value: "flagged" },
  { label: "Waiting", value: "unfinished" },
  { label: "Done", value: "clear" },
] as const;

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

/* One pill per row: where the check stands, with the flags that still need a decision or went into feedback. */
const statusText = (row: SubmissionRow) => {
  const { label } = CHECK_STATE[row.state];
  if (row.openFlags > 0) {
    return `${label} · ${plural(row.openFlags, "flag")}`;
  }
  return row.feedbackFlags > 0
    ? `${label} · ${row.feedbackFlags} in feedback`
    : label;
};

const submittedFormat = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  weekday: "short",
});

/* Search, the filter, sort and page live in the URL, so Back from a student restores the same view. */
const viewParams = {
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(""),
  show: parseAsStringLiteral(SHOWN),
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

const helper = createColumnHelper<typeof features, SubmissionRow>();

const columns = helper.columns([
  helper.accessor((row) => `${row.name} ${row.email}`, {
    cell: ({ row }) => (
      <span className="flex items-center gap-2.5">
        <Avatar name={row.original.name} />
        <Link
          className="font-emphasis after:absolute after:inset-0 hover:underline"
          href={`/instructor/visualiser?project=${row.original.id}`}
          title={row.original.email}
        >
          {row.original.name}
        </Link>
      </span>
    ),
    header: "Student",
    id: "student",
    sortFn: "text",
  }),
  helper.accessor("stepCount", {
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.stepCount}</span>
    ),
    header: "Steps",
    id: "steps",
    sortDescFirst: true,
    sortFn: "basic",
  }),
  helper.accessor((row) => row.unmatchedPercent ?? -1, {
    cell: ({ row }) =>
      row.original.unmatchedPercent === null ? (
        <span className="text-faint">No final text</span>
      ) : (
        <span className="flex items-center gap-2.5 tabular-nums">
          <CompositionBar
            className="w-16"
            traced={1 - row.original.unmatchedPercent / 100}
          />
          {row.original.unmatchedPercent}%
        </span>
      ),
    header: "Not from logged AI",
    id: "unmatched",
    sortDescFirst: true,
    sortFn: "basic",
  }),
  helper.accessor("critiqueAverage", {
    cell: ({ row }) => (
      <span className="text-body tabular-nums">
        {row.original.critiqueAverage.toFixed(1)}
        <span className="text-faint"> / {critiqueOrder.length}</span>
      </span>
    ),
    header: "Critique score",
    id: "critique",
    sortFn: "basic",
  }),
  helper.accessor(attention, {
    cell: ({ row }) => (
      <Badge variant={CHECK_STATE[row.original.state].tone}>
        {statusText(row.original)}
      </Badge>
    ),
    filterFn: (row, _columnId, show) => shownIn(show, row.original),
    header: "Status",
    id: "review",
    sortDescFirst: true,
    sortFn: "basic",
  }),
  helper.accessor((row) => Date.parse(row.submittedAt), {
    cell: ({ row }) => (
      <time
        className="text-muted-foreground"
        dateTime={row.original.submittedAt}
        suppressHydrationWarning
      >
        {submittedFormat.format(new Date(row.original.submittedAt))}
      </time>
    ),
    header: "Submitted",
    id: "submitted",
    sortDescFirst: true,
    sortFn: "basic",
  }),
]);

export const SubmissionsTable = ({ rows: data }: { rows: SubmissionRow[] }) => {
  const [view, setView] = useQueryStates(viewParams);
  const searchId = useId();
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
        page: null,
        sort: id ?? null,
      });
    },
    state: {
      columnFilters: view.show ? [{ id: "review", value: view.show }] : [],
      globalFilter: view.q,
      sorting,
    },
  });

  const { rows } = table.getRowModel();
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(Math.max(view.page, 1), pageCount);
  const first = (page - 1) * PAGE_SIZE;
  const visible = rows.slice(first, first + PAGE_SIZE);
  const counts = Object.fromEntries(
    SHOWN.map((show) => [show, data.filter((row) => shownIn(show, row)).length])
  );
  const goTo = (target: number) => {
    setView({ page: target > 1 ? target : null });
    document.querySelector("#submissions")?.scrollIntoView();
  };

  return (
    <section
      aria-label="Submissions"
      className="px-6 pb-6 max-md:px-4"
      id="submissions"
    >
      <div className="flex flex-wrap items-center gap-2 pt-4 pb-2.5">
        <div className="relative w-65 max-sm:w-full">
          <label className="sr-only" htmlFor={searchId}>
            Filter by name or email
          </label>
          <Icon
            className="text-faint pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
            name="search"
          />
          <Input
            density="compact"
            id={searchId}
            inset="icon"
            onChange={(event) =>
              setView({ page: null, q: event.target.value || null })
            }
            placeholder="Filter by name or email"
            type="search"
            value={view.q}
          />
        </div>
        <ToggleGroup
          aria-label="Show submissions"
          onValueChange={([next]) => {
            if (next) {
              setView({
                page: null,
                show: SHOWN.find((shown) => shown === next) ?? null,
              });
            }
          }}
          value={[view.show ?? "all"]}
        >
          <ToggleGroupThumb>
            <ToggleGroupItem tone="thumb" value="all">
              All
              <span className="text-faint tabular-nums">{data.length}</span>
            </ToggleGroupItem>
            {FILTERS.map(({ label, value }) => (
              <ToggleGroupItem key={value} tone="thumb" value={value}>
                {label}
                <span className="text-faint tabular-nums">{counts[value]}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroupThumb>
        </ToggleGroup>
        <span
          aria-live="polite"
          className="text-muted-foreground text-meta ml-auto flex items-center gap-1.5"
        >
          {rows.length === data.length
            ? `${data.length} ${data.length === 1 ? "submission" : "submissions"}`
            : `${rows.length} of ${data.length}`}
          <span aria-hidden="true">·</span>
          {view.sort ? (
            <>
              Sorted by {SORT_LABEL[view.sort]}
              <Button
                onClick={() => setView({ order: null, page: null, sort: null })}
                size="sm"
                variant="ghost"
              >
                Needs review first
              </Button>
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              <Icon name="sort" />
              Needs review first
            </span>
          )}
        </span>
      </div>
      <TooltipProvider>
        <Table className="min-w-230">
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const numeric = NUMERIC.has(header.column.id);
                  return (
                    <TableHead
                      aria-sort={(sorted && `${sorted}ending`) || "none"}
                      className={numeric ? "text-right" : undefined}
                      key={header.id}
                    >
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
                      {header.column.id === "unmatched" ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                aria-label="What “not from logged AI” means"
                                className="-my-1 ml-0.5 align-middle"
                                size="icon-sm"
                                variant="ghost"
                              />
                            }
                          >
                            <Icon className="size-3.5" name="info" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-64">
                            The share of the essay that matches no logged AI
                            answer. It shows where to look, not who wrote it.
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow className="relative" key={row.id}>
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
      </TooltipProvider>
      {rows.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-8">
          <p>No submissions match this view.</p>
          <Button
            onClick={() => setView({ page: null, q: null, show: null })}
            size="sm"
            variant="outline"
          >
            Clear search and filter
          </Button>
        </div>
      ) : null}
      {pageCount > 1 ? (
        <nav
          aria-label="Pagination"
          className="flex items-center gap-2 pt-3 tabular-nums"
        >
          <span className="text-muted-foreground text-meta mr-auto">
            {first + 1}–{first + visible.length} of {rows.length}
          </span>
          <Button
            disabled={page === 1}
            onClick={() => goTo(page - 1)}
            size="sm"
            variant="outline"
          >
            <Icon name="left" />
            Previous
          </Button>
          <span className="text-muted-foreground text-meta">
            Page {page} of {pageCount}
          </span>
          <Button
            disabled={page === pageCount}
            onClick={() => goTo(page + 1)}
            size="sm"
            variant="outline"
          >
            Next
            <Icon name="right" />
          </Button>
        </nav>
      ) : null}
    </section>
  );
};
