import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import IssuePage from "@/features/supervisor/pages/issue-page";

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.supervisor]);

  const supervisorProfile = await prisma.supervisorProfile.findUnique({
    where: { userId: user.id },
  });

  const internOptions: { id: string; name: string }[] = [];

  if (supervisorProfile) {
    const assignments = await prisma.internSupervisor.findMany({
      where: { supervisorProfileId: supervisorProfile.id },
      include: {
        internProfile: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    for (const a of assignments) {
      internOptions.push({
        id: a.internProfile.id,
        name: a.internProfile.user.name,
      });
    }
  }

  return <IssuePage internOptions={internOptions} />;
}
