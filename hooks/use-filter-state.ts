import { useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import type { ActiveFilter } from "@/lib/types/filter";

export function useFilterState<TData>() {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter<TData>[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const sync = (filters: ActiveFilter<TData>[]) => {
    setColumnFilters(
      filters.map((f) => ({ id: f.categoryId as string, value: f.value })),
    );
  };

  const addFilter = (filter: ActiveFilter<TData>) => {
    const next = [
      ...activeFilters.filter((f) => f.categoryId !== filter.categoryId),
      filter,
    ];
    setActiveFilters(next);
    sync(next);
  };

  const removeFilter = (categoryId: keyof TData) => {
    const next = activeFilters.filter((f) => f.categoryId !== categoryId);
    setActiveFilters(next);
    sync(next);
  };

  const clearAll = () => {
    setActiveFilters([]);
    setColumnFilters([]);
  };

  return { activeFilters, columnFilters, addFilter, removeFilter, clearAll };
}
