"use client";

import { useState } from "react";

import { AlertTriangleIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";

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
      className={cn("flex items-center justify-between gap-3 p-4", className)}
    >
      <AlertTriangleIcon className="mt-0.5 size-5 shrink-0" />
      <AlertDescription className="flex-1 text-sm not-first:mt-0">
        {message}
      </AlertDescription>
      <div className="flex items-center gap-2">
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
        <Button variant="ghost" size="icon" onClick={() => setDismissed(true)}>
          <XIcon className="size-4" />
        </Button>
      </div>
    </Alert>
  );
}
