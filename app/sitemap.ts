import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo/metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const certificates = await prisma.document.findMany({
    where: { documentType: "certificate", deletedAt: null },
    select: { id: true, updatedAt: true },
  });

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/sign-in`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...certificates.map((doc) => ({
      url: `${SITE_URL}/certificates/${doc.id}`,
      lastModified: doc.updatedAt ?? new Date(),
      changeFrequency: "never" as const,
      priority: 0.1,
    })),
  ];
}
