import { prisma } from "@/lib/prisma";
import ProfilePage from "@/features/supervisor/pages/profile-page";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.supervisor]);

  const profile = await prisma.supervisorProfile.findUnique({
    where: { userId: user.id },
  });

  return <ProfilePage user={user} profile={profile} />;
}
