import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import LogbookPage from "@/features/intern/pages/logbook-page";

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.intern]);

  const internProfile = await prisma.internProfile.findUnique({
    where: { userId: user.id },
    include: {
      supervisorAssignments: {
        where: { endedAt: null },
        select: {
          supervisorProfileId: true,
        },
      },
    },
  });

  const supervisorIssues = await prisma.issue.findMany({
    where: {
      supervisorProfileId:
        internProfile?.supervisorAssignments[0]?.supervisorProfileId,
      status: "active",
    },
    select: {
      id: true,
      title: true,
    },
  });

  return (
    <LogbookPage
      issueOptions={supervisorIssues}
      periodStart={internProfile?.periodStart ?? undefined}
      periodEnd={internProfile?.periodEnd ?? undefined}
      internName={user.name}
    />
  );
}
