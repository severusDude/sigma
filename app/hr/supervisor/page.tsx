import SupervisorPage from "@/features/hr/pages/supervisor-page";
import {
  fetchSupervisors,
  fetchUnassignedInterns,
  fetchActiveSupervisorOptions,
} from "@/features/hr/data/supervisor-data";

export default async function Page() {
  const [supervisors, unassignedInterns, activeSupervisors] =
    await Promise.all([
      fetchSupervisors(),
      fetchUnassignedInterns(),
      fetchActiveSupervisorOptions(),
    ]);

  return (
    <SupervisorPage
      supervisors={supervisors}
      unassignedInterns={unassignedInterns}
      activeSupervisors={activeSupervisors}
    />
  );
}
