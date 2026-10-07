import type { Metadata } from "next";
import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Role } from "@/generated/prisma/enums";
import { getRoleHome } from "@/helpers/role-home";
import SignInPage from "@/features/auth/pages/sign-in-page";
import { getSafeRedirectPath } from "@/helpers/safe-redirect";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke dashboard SIGMA — Sistem Informasi Management Magang BPS Kota Tasikmalaya.",
  robots: { index: false, follow: false },
};

// Halaman bergantung sesi per-request — hentikan prerender di sini
// (pengganti "force-dynamic" pada cacheComponents; lihat docs connection()).
// Ini juga menghindari error prerender dari useSearchParams internal
// ProgressProvider yang tidak terbungkus Suspense.

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  await connection();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { redirect: rawRedirect } = await searchParams;
  const redirectParam =
    typeof rawRedirect === "string" ? rawRedirect : undefined;

  if (session) {
    // Sudah login: langsung ke dashboard sesuai role (bukan landing /).
    // Hormati ?redirect= hanya bila lolos sanitasi same-origin.
    const roleHome = getRoleHome(session.user.role as Role);
    redirect(
      redirectParam ? getSafeRedirectPath(redirectParam, roleHome) : roleHome,
    );
  }

  return <SignInPage redirectTo={redirectParam} />;
}
