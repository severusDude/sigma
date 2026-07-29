export const SITE_NAME = "SIGMA";
export const SITE_TITLE = "SIGMA — Sistem Informasi Management Magang BPS Kota Tasikmalaya";
export const SITE_DESCRIPTION =
  "Platform digital untuk mengelola program magang di BPS Kota Tasikmalaya — dari penempatan, logbook, presensi QR code, penilaian, hingga penerbitan sertifikat, dalam satu ekosistem terpadu.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sigma.bpstasikmalaya.go.id";
export const LOCALE = "id_ID";
export const OG_IMAGE = "/og-image.png";

export const siteMetadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
};
