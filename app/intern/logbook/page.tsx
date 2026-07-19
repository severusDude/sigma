import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import LogbookPage from "@/features/intern/pages/logbook-page";

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.intern]);

  const internProfile = await prisma.internProfile.findUnique({
    where: { userId: user.id },
    select: {
      periodStart: true,
      periodEnd: true,
    },
  });

  return (
    <LogbookPage
      periodStart={internProfile?.periodStart ?? undefined}
      periodEnd={internProfile?.periodEnd ?? undefined}
      internName={user.name}
    />
  );
}
