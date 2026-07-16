import SupervisorPage from "@/features/hr/pages/supervisor-page";
import { fetchSupervisors } from "@/features/hr/data/supervisor-data";

export default async function Page() {
  const supervisors = await fetchSupervisors();

  return <SupervisorPage supervisors={supervisors} />;
}
