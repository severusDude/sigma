import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import localFont from "next/font/local";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReactQueryProvider from "@/providers/react-query-provider";
import { Plus_Jakarta_Sans } from "next/font/google";

import {
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_URL,
  LOCALE,
  OG_IMAGE,
} from "@/lib/seo/metadata";
import {
  organizationSchema,
  webApplicationSchema,
  jsonLdScript,
} from "@/lib/seo/json-ld";

import "./globals.css";

const fontSans = localFont({
  src: "../public/fonts/Inter.ttf",
  variable: "--font-sans",
});

const fontSerif = localFont({
  src: "../public/fonts/LibreBaskerville.ttf",
  variable: "--font-serif",
});

const fontMono = localFont({
  src: "../public/fonts/Inter.ttf",
  variable: "--font-mono",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s — SIGMA",
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: LOCALE,
    siteName: "SIGMA",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "SIGMA — Sistem Informasi Management Magang",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        plusJakartaSans.variable,
        fontSerif.variable,
        "font-sans",
        fontMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(webApplicationSchema),
          }}
        />
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
