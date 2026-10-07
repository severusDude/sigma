"use client";

import React, { Suspense } from "react";

import { ProgressProvider } from "@bprogress/next/app";

export default function NavigationProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // BProgress memakai useSearchParams internal — wajib di bawah Suspense
  // agar prerender tidak gagal (docs Next: use-search-params).
  // Fallback null: bar hanya hidup saat interaksi client.
  return (
    <Suspense fallback={null}>
      <ProgressProvider
        height="3px"
        color="var(--primary)"
        options={{ showSpinner: false }}
      >
        {children}
      </ProgressProvider>
    </Suspense>
  );
}
