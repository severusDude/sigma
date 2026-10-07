import type { Metadata } from "next";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import { fetchSupervisorProfileId } from "@/features/supervisor/data/assessment-data";
import { fetchSupervisorInterns } from "@/features/supervisor/data/intern-data";
import InternPage from "@/features/supervisor/pages/intern-page";

export const metadata: Metadata = {
  title: "Intern Bimbingan",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.supervisor]);

  const supervisorProfileId = await fetchSupervisorProfileId(user.id);

  if (!supervisorProfileId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Akun Anda tidak memiliki profil supervisor. Hubungi HR untuk
          penempatan bimbingan.
        </p>
      </div>
    );
  }

  const { active, history } = await fetchSupervisorInterns(supervisorProfileId);

  return <InternPage active={active} history={history} />;
}
