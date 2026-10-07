import type { Metadata } from "next";

export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dashboardTitle = (page: string): string =>
  `${page} — SIGMA`;
