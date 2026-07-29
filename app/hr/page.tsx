import type { Metadata } from "next";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import { fetchDashboardData } from "@/features/hr/data/dashboard-data";
import DashboardPage from "@/features/hr/pages/dashboard-page";

export const metadata: Metadata = {
  title: "Dashboard HR",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requireAuth([Role.admin, Role.hr]);

  const data = await fetchDashboardData();

  return <DashboardPage data={data} />;
}
