import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResponse } from "@/lib/types";

function useStorageToast() {
  const router = useRouter();

  const execute = useCallback(
    async <T>(
      action: () => Promise<ActionResponse<T>>,
      options: {
        loading?: string;
        success?: string;
        fallbackError?: string;
        onSuccess?: (data: T) => void;
      },
    ): Promise<boolean> => {
      const toastId = options.loading
        ? toast.loading(options.loading)
        : undefined;

      const run = async (attempt: number = 1): Promise<boolean> => {
        let res: ActionResponse<T>;

        try {
          res = await action();
        } catch (thrown) {
          // `useMutation` callers throw the ActionResponse on failure.
          // Normal callers never throw — they return { success: false }.
          if (thrown && typeof thrown === "object" && "success" in (thrown as object)) {
            res = thrown as ActionResponse<T>;
          } else {
            const msg =
              thrown instanceof Error
                ? thrown.message
                : options.fallbackError || "Terjadi kesalahan";
            if (toastId) toast.error(msg, { id: toastId });
            else toast.error(msg);
            return false;
          }
        }

        if (!res.success) {
          if (res.retryable && attempt < 2) {
            if (toastId) toast.dismiss(toastId);
            return new Promise<boolean>((resolve) => {
              toast.error(res.error, {
                action: {
                  label: "Coba Lagi",
                  onClick: async () => {
                    const ok = await run(attempt + 1);
                    resolve(ok);
                  },
                },
              });
            });
          }
          if (toastId) {
            toast.error(res.error, { id: toastId });
          } else {
            toast.error(res.error || options.fallbackError || "Terjadi kesalahan");
          }
          return false;
        }
        if (options.success) {
          toast.success(options.success, { id: toastId });
        } else if (toastId) {
          toast.dismiss(toastId);
        }
        options.onSuccess?.(res.data!);
        router.refresh();
        return true;
      };

      return run();
    },
    [router],
  );

  return { execute };
}

export { useStorageToast };
