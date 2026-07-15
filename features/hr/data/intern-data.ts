import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";

export async function fetchInterns(query?: string) {
  "use cache";
  cacheTag("interns");

  return prisma.user.findMany({
    where: {
      internProfile: { is: { deletedAt: null } },
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              {
                internProfile: {
                  nik: { contains: query, mode: "insensitive" },
                },
              },
              {
                internProfile: {
                  institution: { contains: query, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    },
    include: { internProfile: true },
    orderBy: { createdAt: "desc" },
  });
}
