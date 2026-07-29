import type { Metadata } from "next";
import SignInPage from "@/features/auth/pages/sign-in-page";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke dashboard SIGMA — Sistem Informasi Management Magang BPS Kota Tasikmalaya.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SignInPage />;
}
