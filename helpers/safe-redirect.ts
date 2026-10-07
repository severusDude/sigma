// Hanya izinkan path relatif same-origin sebagai target redirect.
// Mencegah open-redirect: input di-resolve dengan parser yang sama seperti
// browser (WHATWG URL); apa pun yang keluar dari origin dasar — URL absolut,
// protocol-relative (//evil), backslash (/\evil), atau scheme (javascript:,
// data:) — jatuh ke fallback. Kembalikan hanya path+search+hash.
const BASE_ORIGIN = "https://placeholder.invalid";

export function getSafeRedirectPath(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (!raw) {
    return fallback;
  }
  let url: URL;
  try {
    url = new URL(raw, BASE_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE_ORIGIN) {
    return fallback;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
