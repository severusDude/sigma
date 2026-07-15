import {
  ArrowDownAZ,
  ArrowUpAZ,
  CheckIcon,
  SortDesc,
  SortDescIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ActiveSort, SortDirection, SortOption } from "@/lib/types/sort";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortDropdownProps<TData> = {
  sortOptions: SortOption<TData>[];
  activeSort: ActiveSort<TData> | null;
  onSortChange: (sort: ActiveSort<TData> | null) => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DIRECTIONS: {
  value: SortDirection;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "asc",
    label: "Ascending",
    icon: <ArrowUpAZ className="h-3.5 w-3.5 text-muted-foreground" />,
  },
  {
    value: "desc",
    label: "Descending",
    icon: <ArrowDownAZ className="h-3.5 w-3.5 text-muted-foreground" />,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

function SortDropdown<TData>({
  sortOptions,
  activeSort,
  onSortChange,
}: SortDropdownProps<TData>) {
  const handleDirectionChange = (value: string) => {
    const direction = value as SortDirection;
    if (activeSort) {
      onSortChange({ ...activeSort, direction });
    } else {
      // Default to first column if none selected yet
      const first = sortOptions[0];
      if (first) {
        onSortChange({
          columnId: first.id,
          columnLabel: first.label,
          direction,
        });
      }
    }
  };

  const handleColumnSelect = (opt: SortOption<TData>) => {
    onSortChange({
      columnId: opt.id,
      columnLabel: opt.label,
      direction: activeSort?.direction ?? "asc",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1.5 text-sm",
              activeSort && "border-primary/50 text-primary",
            )}
          >
            <SortDescIcon size={16} />
            <span className="hidden md:block">Sort</span>
            {activeSort && (
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                {activeSort.columnLabel} ·{" "}
                {activeSort.direction === "asc" ? "A→Z" : "Z→A"}
              </span>
            )}
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          {/* ── Sort Order ── */}
          <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Sort Order
          </DropdownMenuLabel>

          <DropdownMenuRadioGroup
            value={activeSort?.direction ?? "asc"}
            onValueChange={handleDirectionChange}
          >
            {DIRECTIONS.map(({ value, label, icon }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                className="gap-2 text-sm"
              >
                {icon}
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          {/* ── Column ── */}
          <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Column
          </DropdownMenuLabel>

          {sortOptions.map((opt) => {
            const isActive = activeSort?.columnId === opt.id;

            return (
              <DropdownMenuItem
                key={String(opt.id)}
                className={cn("text-sm", isActive && "font-medium")}
                onClick={() => handleColumnSelect(opt)}
              >
                {opt.label}
                <CheckIcon
                  className={cn("ml-auto opacity-0", isActive && "opacity-100")}
                />
              </DropdownMenuItem>
            );
          })}

          {activeSort && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-sm text-muted-foreground"
                onClick={() => onSortChange(null)}
              >
                Hapus sort
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SortDropdown;
