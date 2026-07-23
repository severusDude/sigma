import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";

import { documentInclude } from "../types/document-types";

export async function fetchInternsForDocuments() {
  "use cache";
  cacheTag("interns");

  return prisma.user.findMany({
    where: {
      internProfile: { is: { deletedAt: null } },
    },
    include: documentInclude,
    orderBy: { createdAt: "desc" },
  });
}
