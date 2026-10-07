export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "GovernmentOrganization",
  name: "BPS Kota Tasikmalaya",
  url: "https://bpstasikmalaya.go.id",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Jln. Sukarindik No. 71",
    addressLocality: "Tasikmalaya",
    postalCode: "46151",
    addressCountry: "ID",
  },
  description: "Badan Pusat Statistik Kota Tasikmalaya",
};

export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SIGMA — Sistem Informasi Management Magang",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Platform digital manajemen magang BPS Kota Tasikmalaya — kelola logbook, presensi, penilaian, dan sertifikat.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
  },
  author: {
    "@type": "GovernmentOrganization",
    name: "BPS Kota Tasikmalaya",
  },
};

export function jsonLdScript(schema: Record<string, unknown>): string {
  return JSON.stringify(schema);
}
