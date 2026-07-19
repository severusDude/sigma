import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";

import { logbookInclude } from "../types/logbook-types";
import type { LogbookStatus } from "@/generated/prisma/enums";

export async function fetchLogbooks(
  internProfileId: string,
  query?: {
    status?: LogbookStatus;
    from?: Date;
    to?: Date;
  },
) {
  "use cache";
  cacheTag("logbook");

  return prisma.logbook.findMany({
    where: {
      internProfileId,
      deletedAt: null,
      ...(query?.status ? { status: query.status } : {}),
      ...(query?.from || query?.to
        ? {
            date: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    },
    include: logbookInclude,
    orderBy: { date: "desc" },
  });
}
