import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";

import { supervisorInclude } from "../types/supervisor-types";

export async function fetchSupervisors(query?: string) {
  "use cache";
  cacheTag("supervisors");

  return prisma.user.findMany({
    where: {
      supervisorProfile: { is: { deletedAt: null } },
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              {
                supervisorProfile: {
                  nip: { contains: query, mode: "insensitive" },
                },
              },
              {
                supervisorProfile: {
                  field: { contains: query, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    },
    include: supervisorInclude,
    orderBy: { createdAt: "desc" },
  });
}
