import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProfilePage from "@/features/intern/pages/profile-page";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Profil Intern",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.intern]);

  const profile = await prisma.internProfile.findUnique({
    where: { userId: user.id },
    include: { team: true },
  });

  return <ProfilePage user={user} profile={profile} />;
}
