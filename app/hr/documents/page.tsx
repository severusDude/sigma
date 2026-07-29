import type { Metadata } from "next";
import DocumentPage from "@/features/hr/pages/document-page";
import { fetchInternsForDocuments } from "@/features/hr/data/document-data";
import { fetchTemplates } from "@/features/hr/data/template-data";

export const metadata: Metadata = {
  title: "Dokumen Magang",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const [interns, templates] = await Promise.all([
    fetchInternsForDocuments(),
    fetchTemplates(),
  ]);

  const activeTemplates = templates
    .filter((t) => t.isActive)
    .map((t) => ({
      documentType: t.documentType,
      name: t.name,
      content: t.content,
      variables: t.variables as string[],
      createdAt: t.createdAt,
    }));

  return <DocumentPage interns={interns} activeTemplates={activeTemplates} />;
}
