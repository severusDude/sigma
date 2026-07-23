"use client";

import { useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SortOption } from "@/lib/types/sort";
import { Button } from "@/components/ui/button";
import { FilterCategory } from "@/lib/types/filter";
import { useSortState } from "@/hooks/use-sort-state";
import { useFilterState } from "@/hooks/use-filter-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowSelectionState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import FilterChips from "./filter-chips";
import SortDropdown from "./sort-dropdown";
import FilterDropdown from "./filter-dropdown";
import { ActionOption } from "./column-helpers";
import { BatchActionBar } from "./batch-action-bar";
import { MobileFilterSort } from "./mobile-filter-sort";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../../ui/input-group";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterCategories?: FilterCategory<TData>[];
  sortOptions?: SortOption<TData>[];
  /** Batch actions shown in the toolbar when one or more rows are selected */
  batchActions?: ActionOption<TData>[];
  /** Optional row click handler — tr shifts to cursor-pointer when set */
  onRowClick?: (row: TData) => void;
}

// ─── DataTable ────────────────────────────────────────────────────────────────
export function DataTable<TData, TValue>({
  columns,
  data,
  filterCategories = [],
  sortOptions = [],
  batchActions = [],
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Filter and sort hooks
  const { activeFilters, columnFilters, addFilter, removeFilter, clearAll } =
    useFilterState<TData>();
  const { activeSort, sorting, onSortChange } = useSortState<TData>();

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      globalFilter,
      sorting,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  // Pagination
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const pageSize = table.getState().pagination.pageSize;

  const totalRows = table.getRowCount();

  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  const getPages = () => {
    const pages: (number | "...")[] = [];

    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => i);
    }

    pages.push(0);

    if (pageIndex > 2) {
      pages.push("...");
    }

    const start = Math.max(1, pageIndex - 1);
    const end = Math.min(pageCount - 2, pageIndex + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (pageIndex < pageCount - 3) {
      pages.push("...");
    }

    pages.push(pageCount - 1);

    return pages;
  };

  // Selected rows data (original TData objects)
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  const hasBatchActions = batchActions.length > 0 && selectedRows.length > 0;

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <header className="flex flex-col w-full gap-2">
        {/* Desktop view */}
        <div className="flex-row items-center justify-between hidden gap-3 md:flex">
          {/* Search input */}
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Search className="opacity-50 size-4 shrink-0" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Cari nama, "
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </InputGroup>

          {/* Filter and sort actions */}
          <div className="flex flex-row items-center justify-between gap-1">
            <FilterDropdown
              filterCategories={filterCategories}
              activeFilters={activeFilters}
              onAddFilter={addFilter}
            />

            <SortDropdown
              sortOptions={sortOptions}
              activeSort={activeSort}
              onSortChange={onSortChange}
            />
          </div>
        </div>

        {/* Mobile view */}
        <div className="flex flex-row items-center justify-between gap-3 md:hidden">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Search className="opacity-50 size-4 shrink-0" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Cari nama, "
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </InputGroup>

          <MobileFilterSort
            filterCategories={filterCategories}
            activeFilters={activeFilters}
            onAddFilter={addFilter}
            onRemoveFilter={removeFilter}
            onClearAllFilters={clearAll}
            sortOptions={sortOptions}
            activeSort={activeSort}
            onSortChange={onSortChange}
          />
        </div>

        <div className="hidden w-full md:block">
          <FilterChips
            filterCategories={filterCategories}
            activeFilters={activeFilters}
            onRemoveFilter={removeFilter}
            onClearAll={clearAll}
          />
        </div>

        {/* Batch action bar — visible when rows are selected */}
        {hasBatchActions && (
          <BatchActionBar
            selectedRows={selectedRows}
            batchActions={batchActions}
            onClearSelection={() => table.resetRowSelection()}
          />
        )}
      </header>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "hover:bg-muted/50",
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada data ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Select
              value={String(pageSize)}
              onValueChange={(val) => table.setPageSize(Number(val))}
            >
              <SelectTrigger className="w-24 h-9">
                <SelectValue />
              </SelectTrigger>

              <SelectContent align="start" side="bottom">
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} items
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="text-sm text-muted-foreground">
            Showing {start}-{end} of {totalRows} entries
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {getPages().map((page, index) =>
            page === "..." ? (
              <Button
                key={`ellipsis-${index}`}
                variant="ghost"
                size="icon"
                disabled
                className="h-9 w-9"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                key={page}
                variant="ghost"
                size="icon"
                onClick={() => table.setPageIndex(page)}
                className={cn(
                  "h-9 w-9",
                  page === pageIndex &&
                    "bg-primary text-primary-foreground hover:bg-primary",
                )}
              >
                {page + 1}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
