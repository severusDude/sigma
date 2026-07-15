export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface FilterCategory<TData = Record<string, unknown>> {
  id: keyof TData;
  label: string;
  options: FilterOption[];
}

export interface ActiveFilter<TData = Record<string, unknown>> {
  categoryId: keyof TData;
  categoryLabel: string;
  value: string;
  valueLabel: string;
}
