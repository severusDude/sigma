/**
 * SertifikatMagang.jsx
 * ---------------------------------------------------------------------------
 * React PDF (@react-pdf/renderer) port of the original HTML/Tailwind
 * certificate. Built against @react-pdf/renderer v3.x (current stable).
 * ---------------------------------------------------------------------------
 */

import {
  Document,
  Page,
  View,
  Text,
  Svg,
  Polygon,
  Image as PDFImage,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

/* ---------------------------------------------------------------------------
 * 1. FONT REGISTRATION
 * ------------------------------------------------------------------------ */
Font.register({
  family: "Libre Baskerville",
  fonts: [
    { src: "./public/fonts/LibreBaskerville.ttf", fontWeight: 400 },
    {
      src: "./public/fonts/LibreBaskerville-Italic.ttf",
      fontWeight: 400,
      fontStyle: "italic",
    },
    { src: "./public/fonts/LibreBaskerville.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "Inter",
  fonts: [
    { src: "./public/fonts/Inter.ttf", fontWeight: 400 },
    { src: "./public/fonts/Inter.ttf", fontWeight: 600 },
    { src: "./public/fonts/Inter.ttf", fontWeight: 400, fontStyle: "italic" },
  ],
});

Font.registerHyphenationCallback((word) => [word]);

/* ---------------------------------------------------------------------------
 * 2. PAGE CONSTANTS
 * ------------------------------------------------------------------------ */
const PAGE_W = 297; // mm, A4 landscape
const PAGE_H = 210; // mm

const COLORS = {
  navy: "#1e3a8a",
  gold: "#f59e0b",
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate400: "#94a3b8",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray100: "#f3f4f6",
  gray400: "#9ca3af",
};

/* ---------------------------------------------------------------------------
 * 3. STYLES
 * ------------------------------------------------------------------------ */
const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    padding: "0",
    backgroundColor: "#ffffff",
    position: "relative",
  },
  // Absolute overlay covering 100% of the page to isolate text rendering order
  containerInner: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  // --- Header -------------------------------------------------------------
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  bpsLogoGroup: {
    marginTop: 50,
    marginLeft: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  logoPlaceholder: {
    width: 34,
    height: 34,
    backgroundColor: COLORS.gray200,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderStyle: "solid",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  logoPlaceholderText: {
    fontSize: 5,
    textAlign: "center",
    textTransform: "uppercase",
    fontWeight: 700,
    color: COLORS.gray400,
  },
  bpsTextCol: { flexDirection: "column" },
  bpsLine1: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.navy,
    letterSpacing: -0.2,
  },
  bpsLine2: { fontSize: 9, fontWeight: 600, color: COLORS.navy },

  pojokGroup: {
    marginTop: 50,
    marginRight: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  pojokTextCol: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginRight: 8,
  },
  pojokTitle: {
    fontSize: 18,
    fontWeight: 700,
    fontStyle: "italic",
    color: COLORS.navy,
    letterSpacing: -0.4,
  },
  pojokSubtitle: {
    fontSize: 7,
    fontWeight: 700,
    color: COLORS.navy,
    letterSpacing: 1.4,
  },
  pojokLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderStyle: "solid",
    alignItems: "center",
    justifyContent: "center",
  },
  pojokLogoText: { fontSize: 4, textAlign: "center", color: COLORS.gray400 },

  // --- Main content ---------------------------------------------------------
  main: {
    flexGrow: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  title: {
    fontFamily: "Libre Baskerville",
    fontSize: 34,
    fontWeight: 700,
    color: COLORS.slate800,
    letterSpacing: 1.5,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    fontStyle: "italic",
    color: COLORS.slate600,
    marginBottom: 20,
  },
  nameWrap: { marginBottom: 16 },
  name: {
    fontFamily: "Libre Baskerville",
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.slate800,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.slate800,
    borderBottomStyle: "solid",
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  body: {
    fontSize: 11,
    lineHeight: 1.6,
    color: COLORS.slate700,
    textAlign: "center",
    maxWidth: 480,
  },
  bodyBold: { fontWeight: 600 },

  // --- Footer / signature ----------------------------------------------------
  footer: {
    marginTop: 0,
    marginBottom: 90,
    flexDirection: "column",
    alignItems: "center",
  },
  footerLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.slate800,
    marginBottom: 2,
    textAlign: "center",
  },
  signatureArea: {
    height: 68,
    width: 200,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 4,
    position: "relative",
  },
  stampWrap: {
    position: "absolute",
    left: 10,
    opacity: 0.2,
    transform: "rotate(-12deg)",
  },
  stampOuter: {
    width: 68,
    height: 68,
    borderWidth: 3,
    borderColor: COLORS.navy,
    borderStyle: "solid",
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  stampInner: {
    width: "100%",
    height: "100%",
    borderWidth: 1.5,
    borderColor: COLORS.navy,
    borderStyle: "solid",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  stampInnerText: {
    fontSize: 4,
    fontWeight: 700,
    color: COLORS.navy,
    textAlign: "center",
    textTransform: "uppercase",
  },
  signaturePlaceholder: {
    fontFamily: "Libre Baskerville",
    fontStyle: "italic",
    fontSize: 16,
    color: COLORS.navy,
    opacity: 0.4,
  },
  signatureNameWrap: {
    borderTopWidth: 1,
    borderTopColor: COLORS.slate400,
    borderTopStyle: "solid",
    paddingTop: 3,
  },
  signatureName: { fontSize: 11, fontWeight: 700, color: COLORS.slate800 },
});

/* ---------------------------------------------------------------------------
 * 4. DECORATIVE CORNER ACCENTS
 * ------------------------------------------------------------------------ */
function CornerAccents() {
  return (
    <Svg
      style={{ position: "absolute", top: 0, left: 0 }}
      width={`${PAGE_W}mm`}
      height={`${PAGE_H}mm`}
      viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}
    >
      {/* accent-tl-navy: top-left */}
      <Polygon points="0,0 130,0 150,8 0,8" fill={COLORS.navy} />
      <Polygon points="160,0 297,0 297,8 180,8" fill={COLORS.navy} />

      {/* accent-tl-gold: top-left */}
      <Polygon points="0,0 0,5 60,5 75,0" fill={COLORS.gold} />

      {/* FIX: Removed '0,0' typo closing paths across the header region */}
      {/* accent-tr-gold: top-right plain rectangle */}
      <Polygon points="297,0 297,50 240,0 0,0" fill={COLORS.gold} />
      {/* accent-tr-navy: top-right clean corner triangle */}
      <Polygon points="260,0 297,0 297,35" fill={COLORS.navy} />

      {/* accent-br-navy: bottom-right */}
      <Polygon points="0,210 180,210 160,202 0,202" fill={COLORS.navy} />
      <Polygon points="190,202 297,202 297,210 210,210" fill={COLORS.navy} />

      {/* accent-bl-gold */}
      <Polygon points="0,160 50,217 0,210" fill={COLORS.gold} />
      {/* accent-bl-navy */}
      <Polygon points="0,175 30,210 0,210" fill={COLORS.navy} />
    </Svg>
  );
}

/* ---------------------------------------------------------------------------
 * 5. CERTIFICATE COMPONENT
 * ------------------------------------------------------------------------ */
interface Props {
  recipientName: string;
  organization: string;
  dateRange: string;
  signerTitle: string[];
  signerName: string;
  bpsLogoSrc?: string;
  pojokLogoSrc?: string;
}

export function InternshipCertificate({
  recipientName = "Rizka Nurul Septiana Hakim",
  organization = "Badan Pusat Statistik",
  dateRange = "6 Februari - 31 Juli 2023",
  signerTitle = ["Kepala Badan Pusat Statistik", "Kota Tasikmalaya"],
  signerName = "Dr. Ir. Zulkipli, M.Si.",
  bpsLogoSrc,
  pojokLogoSrc,
}: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Layer 1: Rendered at the bottom background */}
        <CornerAccents />

        {/* Layer 2: Rendered after the canvas -> Always visually on top */}
        <View style={styles.containerInner}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.bpsLogoGroup}>
              <View style={styles.logoPlaceholder}>
                {bpsLogoSrc ? (
                  <PDFImage
                    src={bpsLogoSrc}
                    style={{ width: "100%", height: "100%", borderRadius: 14 }}
                  />
                ) : (
                  <Text style={styles.logoPlaceholderText}>BPS LOGO</Text>
                )}
              </View>
              <View style={styles.bpsTextCol}>
                <Text style={styles.bpsLine1}>BADAN PUSAT STATISTIK</Text>
                <Text style={styles.bpsLine2}>KOTA TASIKMALAYA</Text>
              </View>
            </View>

            <View style={styles.pojokGroup}>
              <View style={styles.pojokTextCol}>
                <Text style={styles.pojokTitle}>pojok.</Text>
                <Text style={styles.pojokSubtitle}>STATISTIK</Text>
              </View>
              <View style={styles.pojokLogoCircle}>
                {pojokLogoSrc ? (
                  <PDFImage
                    src={pojokLogoSrc}
                    style={{ width: "100%", height: "100%", borderRadius: 14 }}
                  />
                ) : (
                  <Text style={styles.pojokLogoText}>LOGO</Text>
                )}
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.main}>
            <Text style={styles.title}>SERTIFIKAT MAGANG</Text>
            <Text style={styles.subtitle}>diberikan kepada</Text>

            <View style={styles.nameWrap}>
              <Text style={styles.name}>{recipientName}</Text>
            </View>

            <Text style={styles.body}>
              karena telah mengikuti Magang di {organization}
              {"\n"}
              pada tanggal <Text style={styles.bodyBold}>{dateRange}</Text>
            </Text>
          </View>

          {/* Footer / Signature Area */}
          <View style={styles.footer}>
            {signerTitle.map((line, i) => (
              <Text key={i} style={styles.footerLabel}>
                {line}
              </Text>
            ))}

            <View style={styles.signatureArea}>
              <View style={styles.stampWrap}>
                <View style={styles.stampOuter}>
                  <View style={styles.stampInner}>
                    <Text style={styles.stampInnerText}>
                      Badan Pusat Statistik{"\n"}Provinsi Jawa Timur
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.signaturePlaceholder}>(Tanda Tangan)</Text>
            </View>

            <View style={styles.signatureNameWrap}>
              <Text style={styles.signatureName}>{signerName}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default InternshipCertificate;
