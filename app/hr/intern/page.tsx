import { prisma } from "@/lib/prisma";
import InternPage from "@/features/hr/pages/intern-page";
import { Role } from "@/generated/prisma/enums";

export default async function Page() {
  const interns = await prisma.user.findMany({
    where: { role: Role.intern, internProfile: { is: { deletedAt: null } } },
    include: {
      internProfile: true,
    },
  });

  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <InternPage interns={interns} departments={departments} />;
}
