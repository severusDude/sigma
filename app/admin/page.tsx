import type { Metadata } from "next";
import DashboardAdmin from "@/features/admin/dashboard-page"

export const metadata: Metadata = {
  title: "Dashboard Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DashboardAdmin />
}
