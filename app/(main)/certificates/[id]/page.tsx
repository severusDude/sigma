import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentPreview } from "@/components/shared/document";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  "use cache";
  cacheLife("days");

  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id, documentType: "certificate" },
    include: {
      internProfile: {
        include: { user: true },
      },
    },
  });

  if (!document || document.deletedAt) notFound();

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{document.title}</h1>
          <p className="text-sm text-muted-foreground">
            {document.internProfile.user.name} — {document.documentNumber}
          </p>
        </div>
      </div>
      <DocumentPreview docId={document.id} size="full" />
    </div>
  );
}
