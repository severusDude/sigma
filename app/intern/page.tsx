import type { Metadata } from "next";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import { fetchInternDashboardData } from "@/features/intern/data/dashboard-data";
import DashboardPage from "@/features/intern/pages/dashboard-page";

export const metadata: Metadata = {
  title: "Dashboard Intern",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.intern]);

  const data = await fetchInternDashboardData(user.id);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Profil intern tidak ditemukan.
        </p>
      </div>
    );
  }

  return <DashboardPage data={data} />;
}
