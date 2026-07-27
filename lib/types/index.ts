export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  retryable?: boolean;
};

export interface SelectItemType<T> {
  value: T | string;
  label: string;
}
