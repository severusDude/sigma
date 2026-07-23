import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";

export async function fetchTemplates() {
  "use cache";
  cacheTag("document-templates");

  return prisma.documentTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });
}
