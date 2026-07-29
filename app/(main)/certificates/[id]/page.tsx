import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentPreview } from "@/components/shared/document";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id, documentType: "certificate" },
    include: {
      internProfile: { include: { user: true } },
    },
  });

  if (!doc || doc.deletedAt) {
    return { title: "Sertifikat Tidak Ditemukan" };
  }

  return {
    title: `Verifikasi Sertifikat — ${doc.title}`,
    description: `Verifikasi sertifikat magang ${doc.title} an. ${doc.internProfile.user.name} — BPS Kota Tasikmalaya.`,
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/certificates/${id}`,
    },
  };
}

export default function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-[calc(100vh-12rem)] animate-pulse rounded bg-muted" />
        </div>
      }
    >
      {params.then(({ id }) => (
        <CertificateContent id={id} />
      ))}
    </Suspense>
  );
}

async function CertificateContent({ id }: { id: string }) {
  "use cache";
  cacheLife("days");

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
