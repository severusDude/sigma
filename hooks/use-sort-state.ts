import { useMemo, useState } from "react";

import { SortingState } from "@tanstack/react-table";
import { ActiveSort, SortDirection } from "@/lib/types/sort";

export function useSortState<TData>() {
  const [activeSort, setActiveSort] = useState<ActiveSort<TData> | null>(null);

  // Converts ActiveSort → TanStack SortingState for useReactTable
  const sorting = useMemo<SortingState>(() => {
    if (!activeSort) return [];
    return [
      {
        id: String(activeSort.columnId),
        desc: activeSort.direction === "desc",
      },
    ];
  }, [activeSort]);

  return { activeSort, sorting, onSortChange: setActiveSort };
}
