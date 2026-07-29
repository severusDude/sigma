import type { Metadata } from "next";
import TemplatePage from "@/features/hr/pages/template-page";
import { fetchTemplates } from "@/features/hr/data/template-data";

export const metadata: Metadata = {
  title: "Template Dokumen",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const templates = await fetchTemplates();

  const initialTemplates = templates.map((t) => ({
    id: t.id,
    documentType: t.documentType,
    name: t.name,
    filePath: t.content,
    variables: (t.variables as string[]) ?? [],
    isActive: t.isActive,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  return <TemplatePage initialTemplates={initialTemplates} />;
}
