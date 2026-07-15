import { Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActiveFilter, FilterCategory } from "@/lib/types/filter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FilterDropdownProps<TData> = {
  filterCategories: FilterCategory<TData>[];
  activeFilters: ActiveFilter<TData>[];
  onAddFilter: (filter: ActiveFilter<TData>) => void;
};

function FilterDropdown<TData>({
  filterCategories,
  activeFilters,
  onAddFilter,
}: FilterDropdownProps<TData>) {
  const isOptionActive = (catId: keyof TData, value: string) =>
    activeFilters.some((f) => f.categoryId === catId && f.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1.5 text-sm",
              activeFilters.length > 0 && "border-primary/50 text-primary",
            )}
          >
            <Filter size={16} />
            <span className="hidden md:block">Filter</span>
            {activeFilters.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-0.5 h-4 min-w-4 rounded-full px-1 text-[10px]"
              >
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Tambah Filter
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {filterCategories.map((cat) => (
          <DropdownMenuSub key={String(cat.id)}>
            <DropdownMenuSubTrigger className="text-sm">
              {cat.label}
            </DropdownMenuSubTrigger>

            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-44">
                <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {cat.label}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {cat.options.map((opt) => {
                  const active = isOptionActive(cat.id, opt.value);

                  return (
                    <DropdownMenuItem
                      key={opt.value}
                      disabled={active}
                      className={cn(
                        "gap-2 text-sm",
                        active && "font-medium opacity-60",
                      )}
                      onSelect={() => {
                        if (!active) {
                          onAddFilter({
                            categoryId: cat.id,
                            categoryLabel: cat.label,
                            value: opt.value,
                            valueLabel: opt.label,
                          });
                        }
                      }}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                      {active && (
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          Aktif
                        </span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default FilterDropdown;
