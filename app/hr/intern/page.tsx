import { prisma } from "@/lib/prisma";
import InternPage from "@/features/hr/pages/intern-page";
import { getInterns } from "@/features/hr/actions/intern-actions";

export default async function Page() {
  const result = await getInterns();

  if (!result.success) {
    throw new Error(result.error);
  }

  const interns = result.data!;

  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <InternPage interns={interns} departments={departments} />;
}
