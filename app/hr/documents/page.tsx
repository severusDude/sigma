import DocumentPage from "@/features/hr/pages/document-page";
import { fetchInternsForDocuments } from "@/features/hr/data/document-data";

export default async function Page() {
  const interns = await fetchInternsForDocuments();

  return <DocumentPage interns={interns} />;
}
