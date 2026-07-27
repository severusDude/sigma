import { prisma } from "@/lib/prisma";
import ProfilePage from "@/features/intern/pages/profile-page";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.intern]);

  const profile = await prisma.internProfile.findUnique({
    where: { userId: user.id },
    include: { department: true },
  });

  return <ProfilePage user={user} profile={profile} />;
}
