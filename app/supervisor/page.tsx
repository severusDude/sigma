import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import { fetchSupervisorProfileId } from "@/features/supervisor/data/assessment-data";
import { fetchSupervisorDashboardData } from "@/features/supervisor/data/dashboard-data";
import DashboardPage from "@/features/supervisor/pages/dashboard-page";

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.supervisor]);

  const supervisorProfileId = await fetchSupervisorProfileId(user.id);

  if (!supervisorProfileId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Profil supervisor tidak ditemukan.
        </p>
      </div>
    );
  }

  const data = await fetchSupervisorDashboardData(supervisorProfileId);

  return <DashboardPage data={data} />;
}
