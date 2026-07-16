"use client";

import { ReactNode } from "react";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef, Row } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionOption<TData> {
  label: string;
  icon?: ReactNode;
  /**
   * For row actions: called with the single row's original data.
   * For batch actions: called with all selected rows' original data.
   */
  onClick: (rows: TData | TData[]) => void;
  /** Render as destructive (red) menu item */
  destructive?: boolean;
}

// ─── withSelectColumn ─────────────────────────────────────────────────────────

/**
 * Prepends a checkbox-select column to an existing columns array.
 * Enabled by default; pass `enabled = false` to skip.
 */
export function withSelectColumn<TData>(
  columns: ColumnDef<TData, unknown>[],
  enabled = true,
): ColumnDef<TData, unknown>[] {
  if (!enabled) return columns;

  const selectCol: ColumnDef<TData, unknown> = {
    id: "__select__",
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
  };

  return [selectCol, ...columns];
}

// ─── withActionColumn ─────────────────────────────────────────────────────────

/**
 * Appends a dropdown-menu action column to an existing columns array.
 * Enabled by default; pass `enabled = false` to skip.
 */
export function withActionColumn<TData>(
  columns: ColumnDef<TData, unknown>[],
  actions: ActionOption<TData>[],
  enabled = true,
): ColumnDef<TData, unknown>[] {
  if (!enabled || actions.length === 0) return columns;

  const actionCol: ColumnDef<TData, unknown> = {
    id: "__actions__",
    enableSorting: false,
    enableHiding: false,
    header: () => <span className="sr-only">Aksi</span>,
    cell: ({ row }: { row: Row<TData> }) => {
      const rowData = row.original;

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-fit cursor-pointer">
              {actions.map((action, i) => (
                <DropdownMenuItem
                  key={i}
                  variant={action.destructive ? "destructive" : "default"}
                  onClick={() => action.onClick(rowData)}
                >
                  {action.icon && (
                    <span className="mr-2 size-4 shrink-0">{action.icon}</span>
                  )}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  };

  return [...columns, actionCol];
}
