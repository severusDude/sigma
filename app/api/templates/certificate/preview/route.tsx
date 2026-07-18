import { renderToBuffer } from "@react-pdf/renderer";
import { InternshipCertificate } from "@/features/hr/components/document/templates/certificates";

export async function GET() {
  const buffer = await renderToBuffer(
    <InternshipCertificate
      recipientName="Nama Peserta Magang"
      organization="Badan Pusat Statistik Provinsi Jawa Timur"
      dateRange="1 Januari — 31 Desember 2026"
      signerTitle={["Kepala Badan Pusat Statistik", "Provinsi Jawa Timur"]}
      signerName="Dr. Ir. Zulkipli, M.Si."
    />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"template-preview.pdf\"",
    },
  });
}
