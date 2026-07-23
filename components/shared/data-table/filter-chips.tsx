import { ActiveFilter, FilterCategory } from "@/lib/types/filter";
import { X } from "lucide-react";

type FilterChipProps<TData> = {
  filterCategories: FilterCategory<TData>[];
  filter: ActiveFilter<TData>;
  onRemove: () => void;
};

function FilterChip<TData>({
  filterCategories,
  filter,
  onRemove,
}: FilterChipProps<TData>) {
  const category = filterCategories.find((c) => c.id === filter.categoryId);
  const option = category?.options.find((o) => o.value === filter.value);

  return (
    <div className="flex items-center overflow-hidden text-xs border rounded-md shadow-sm h-7 bg-background">
      <span className="px-2 py-1 font-medium border-r bg-muted text-muted-foreground">
        {filter.categoryLabel}
      </span>

      <span className="flex items-center gap-1.5 px-2 py-1 font-medium">
        {option?.icon}
        {filter.valueLabel}
      </span>

      <button
        onClick={onRemove}
        className="flex h-full items-center border-l px-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Hapus filter ${filter.categoryLabel}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

interface FilterChipsProps<TData> {
  filterCategories: FilterCategory<TData>[];
  activeFilters: ActiveFilter<TData>[];
  onRemoveFilter: (categoryId: keyof TData) => void;
  onClearAll: () => void;
}

export function FilterChips<TData>({
  filterCategories,
  activeFilters,
  onRemoveFilter,
  onClearAll,
}: FilterChipsProps<TData>) {
  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeFilters.map((filter) => (
        <FilterChip
          key={filter.categoryId as string}
          filter={filter}
          filterCategories={filterCategories}
          onRemove={() => onRemoveFilter(filter.categoryId)}
        />
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Hapus semua
      </button>
    </div>
  );
}

export default FilterChips;
