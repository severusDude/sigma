"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ActionOption } from "./column-helpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BatchActionBarProps<TData> {
  selectedRows: TData[];
  batchActions: ActionOption<TData>[];
  onClearSelection: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BatchActionBar<TData>({
  selectedRows,
  batchActions,
  onClearSelection,
}: BatchActionBarProps<TData>) {
  const count = selectedRows.length;
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/50 px-3 py-2">
      {/* Left: selection count + clear */}
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onClearSelection}
          aria-label="Clear selection"
        >
          <X className="size-3.5" />
        </Button>
        <span className="text-muted-foreground leading-tight">
          {count} {count === 1 ? "item" : "item"} dipilih
        </span>
      </div>

      {/* Right: batch action buttons */}
      <div className="flex items-center gap-1">
        {batchActions.map((action, i) => (
          <Button
            key={i}
            size="sm"
            variant={action.destructive ? "destructive" : "outline"}
            className="flex items-center h-8 gap-2"
            onClick={() => action.onClick(selectedRows)}
          >
            {action.icon && (
              <span className="size-4 shrink-0">{action.icon}</span>
            )}
            <span className="hidden md:block">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
