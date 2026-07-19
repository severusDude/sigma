"use client";

import type { ReactNode } from "react";

interface WeekGroupProps {
  label: string;
  children: ReactNode;
}

export function WeekGroup({ label, children }: WeekGroupProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
