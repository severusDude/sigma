"use client";

import { AlertTriangleIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertAction } from "@/components/ui/alert";

interface AlertBannerProps {
  message: string;
  variant?: "warning" | "info";
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function AlertBanner({
  message,
  variant = "warning",
  action,
  className,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Alert
      variant={variant}
      className={cn("flex items-start gap-3 rounded-lg p-4", className)}
    >
      <AlertTriangleIcon className="mt-0.5 size-5 shrink-0" />
      <AlertDescription className="flex-1 text-sm [&:not(:first-child)]:mt-0">
        {message}
      </AlertDescription>
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            "shrink-0 text-sm font-medium underline-offset-2 hover:underline",
            variant === "warning" && "text-amber-800",
            variant === "info" && "text-blue-800",
          )}
        >
          {action.label}
        </button>
      )}
      <AlertAction className="static top-auto right-auto p-0.5 opacity-70 hover:opacity-100">
        <button onClick={() => setDismissed(true)}>
          <XIcon className="size-4" />
        </button>
      </AlertAction>
    </Alert>
  );
}
