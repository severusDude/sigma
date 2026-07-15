import { prisma } from "@/lib/prisma";
import { InternClientPage } from "../components/intern/intern-page-client";

export default async function InternPage() {
  const departments = await prisma.department.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <InternClientPage departments={departments} />;
}
