import { renderToFile } from "@react-pdf/renderer";
import { InternshipCertificate } from "../features/hr/components/document/templates/certificates";

const output = "./certificate-test.pdf";

async function main() {
  await renderToFile(
    <InternshipCertificate
      recipientName="Rizka Nurul Septiana Hakim"
      organization="Badan Pusat Statistik Provinsi Jawa Timur"
      dateRange="6 Februari - 31 Juli 2023"
      signerTitle={["Kepala Badan Pusat Statistik", "Provinsi Jawa Timur"]}
      signerName="Dr. Ir. Zulkipli, M.Si."
    />,
    output,
    (stream, filePath) => console.log(`PDF saved → ${filePath}`),
  );
}

main().catch(console.error);
