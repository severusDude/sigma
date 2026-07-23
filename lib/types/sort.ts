export type SortDirection = "asc" | "desc";

export interface SortOption<TData = Record<string, unknown>> {
  id: keyof TData;
  label: string;
}

export interface ActiveSort<TData = Record<string, unknown>> {
  columnId: keyof TData;
  columnLabel: string;
  direction: SortDirection;
}
