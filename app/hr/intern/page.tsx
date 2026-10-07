import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import InternPage from "@/features/hr/pages/intern-page";
import { fetchInterns } from "@/features/hr/data/intern-data";

export const metadata: Metadata = {
  title: "Manajemen Intern",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const interns = await fetchInterns();

  const teams = await prisma.team.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <InternPage interns={interns} teams={teams} />;
}
