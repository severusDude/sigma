import type { Metadata } from "next";
import LandingPage from "@/features/landing/landing-page";

export const metadata: Metadata = {
  title: "Sistem Informasi Management Magang BPS Kota Tasikmalaya",
  description:
    "Platform digital untuk mengelola program magang di BPS Kota Tasikmalaya — dari penempatan, logbook, presensi QR code, penilaian, hingga sertifikat. Zero paper, real-time monitoring.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <LandingPage />;
}
