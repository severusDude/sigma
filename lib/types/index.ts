export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface SelectItemType<T> {
  value: T | string;
  label: string;
}
