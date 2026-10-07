import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import SupervisorPage from "@/features/hr/pages/supervisor-page";
import {
  fetchSupervisors,
  fetchUnassignedInterns,
  fetchActiveSupervisorOptions,
} from "@/features/hr/data/supervisor-data";

export const metadata: Metadata = {
  title: "Manajemen Supervisor",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const [supervisors, unassignedInterns, activeSupervisors, teams] =
    await Promise.all([
      fetchSupervisors(),
      fetchUnassignedInterns(),
      fetchActiveSupervisorOptions(),
      prisma.team.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  return (
    <SupervisorPage
      supervisors={supervisors}
      unassignedInterns={unassignedInterns}
      activeSupervisors={activeSupervisors}
      teams={teams}
    />
  );
}
