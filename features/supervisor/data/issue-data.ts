import { prisma } from "@/lib/prisma";
import { issueInclude } from "../types/issue-types";
import type { IssueStatus } from "@/generated/prisma/enums";

export async function fetchIssues(
  supervisorProfileId: string,
  query?: {
    status?: IssueStatus;
    internProfileId?: string;
    from?: Date;
    to?: Date;
  },
) {
  return prisma.issue.findMany({
    where: {
      supervisorProfileId,
      deletedAt: null,
      ...(query?.status ? { status: query.status } : {}),
      ...(query?.internProfileId
        ? { internProfileId: query.internProfileId }
        : {}),
      ...(query?.from || query?.to
        ? {
            createdAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    },
    include: issueInclude,
    orderBy: { createdAt: "desc" },
  });
}
