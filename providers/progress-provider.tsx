"use client";

import React from "react";

import { ProgressProvider } from "@bprogress/next/app";

export default function NavigationProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProgressProvider
      height="3px"
      color="var(--primary)"
      options={{ showSpinner: false }}
    >
      {children}
    </ProgressProvider>
  );
}
