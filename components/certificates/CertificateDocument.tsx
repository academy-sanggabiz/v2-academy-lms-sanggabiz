import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"

// Matches app/globals.css brand tokens (--primary / --ring / --brand-gradient).
const PRIMARY = "#1a7f91"
const RING = "#35b5c6"

const styles = StyleSheet.create({
  page: {
    position: "relative",
    fontFamily: "Helvetica",
  },
  templateBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  defaultBackground: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  modernBand: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 26,
    backgroundColor: PRIMARY,
  },
  formalBorder: {
    position: "absolute",
    top: 30,
    left: 30,
    right: 30,
    bottom: 30,
    borderWidth: 1,
    borderColor: "#143740",
  },
  contentModern: {
    paddingLeft: 96,
    paddingRight: 70,
  },
  footerFormal: {
    justifyContent: "center",
  },
  signatureBlockFormal: {
    alignItems: "center",
  },
  defaultBackgroundInner: {
    position: "absolute",
    top: 32,
    left: 32,
    right: 32,
    bottom: 32,
    borderWidth: 1,
    borderColor: RING,
  },
  content: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 70,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 3,
    color: RING,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 30,
    color: PRIMARY,
    marginBottom: 22,
    textAlign: "center",
  },
  presented: {
    fontSize: 11,
    color: "#666666",
    marginBottom: 8,
  },
  name: {
    fontFamily: "Helvetica-Bold",
    fontSize: 26,
    color: "#143740",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 12,
    color: "#333333",
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 1.5,
    marginBottom: 12,
  },
  additionalText: {
    fontSize: 9.5,
    color: "#666666",
    textAlign: "center",
    maxWidth: 420,
    marginTop: 10,
  },
  footer: {
    position: "absolute",
    bottom: 48,
    left: 70,
    right: 70,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signatureBlock: {
    alignItems: "center",
    minWidth: 170,
  },
  signatureImage: {
    height: 36,
    marginBottom: 4,
    objectFit: "contain",
  },
  signatureImageSpacer: {
    height: 36,
    marginBottom: 4,
  },
  signatureLine: {
    width: 170,
    borderTopWidth: 1,
    borderTopColor: "#999999",
    marginBottom: 5,
  },
  signerName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
  },
  signerTitle: {
    fontSize: 9,
    color: "#666666",
  },
  meta: {
    alignItems: "flex-end",
  },
  metaText: {
    fontSize: 8,
    color: "#999999",
  },
})

/**
 * Tiga tata letak, bukan tiga puluh.
 *
 * Masing-masing menjawab keperluan yang berbeda, bukan sekadar selera:
 * - `klasik`  bingkai ganda, semua rata tengah -- bentuk sertifikat yang
 *             paling dikenali orang Indonesia.
 * - `modern`  pita warna di tepi kiri, teks rata kiri -- cocok untuk
 *             perusahaan yang dokumennya memang bergaya begitu.
 * - `formal`  garis tipis tunggal, penanda tangan di tengah bawah -- bentuk
 *             yang biasa dipakai dokumen resmi dan kerja sama antarlembaga.
 *
 * Menambah tata letak berarti menambah satu entri di sini DAN satu nilai di
 * check constraint migrasi 20261101120000. Keduanya, bukan salah satu.
 */
export const CERTIFICATE_LAYOUTS = ["klasik", "modern", "formal"] as const
export type CertificateLayout = (typeof CERTIFICATE_LAYOUTS)[number]

const CERTIFICATE_COPY: Record<string, { title: string; verb: string }> = {
  completion: { title: "Sertifikat Kelulusan", verb: "telah berhasil menyelesaikan" },
  participation: { title: "Sertifikat Partisipasi", verb: "telah berpartisipasi dalam" },
  achievement: { title: "Sertifikat Prestasi", verb: "telah berhasil meraih" },
  custom: { title: "Sertifikat", verb: "telah berhasil menyelesaikan" },
}

export type CertificateDocumentProps = {
  learnerName: string
  courseTitle: string
  certificateType: string
  customTitle: string | null
  description: string | null
  signerName: string | null
  signerTitle: string | null
  signatureUrl: string | null
  templateUrl: string | null
  layout?: CertificateLayout | null
  serial: string
  issuedAt: string
  additionalText: string | null
}

export function CertificateDocument({
  learnerName,
  courseTitle,
  certificateType,
  customTitle,
  description,
  signerName,
  signerTitle,
  signatureUrl,
  templateUrl,
  layout,
  serial,
  issuedAt,
  additionalText,
}: CertificateDocumentProps) {
  const copy = CERTIFICATE_COPY[certificateType] ?? CERTIFICATE_COPY.completion
  const headline = certificateType === "custom" && customTitle ? customTitle : copy.title
  const issuedDate = new Date(issuedAt).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const used: CertificateLayout = layout ?? "klasik"
  // Teks rata kiri pada tata letak modern; dua lainnya rata tengah.
  const align = used === "modern" ? ({ alignItems: "flex-start" } as const) : null
  const textAlign = used === "modern" ? ({ textAlign: "left" } as const) : null

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {templateUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image, not an HTML <img>
          <Image src={templateUrl} style={styles.templateBackground} />
        ) : used === "modern" ? (
          <View style={styles.modernBand} />
        ) : used === "formal" ? (
          <View style={styles.formalBorder} />
        ) : (
          <>
            <View style={styles.defaultBackground} />
            <View style={styles.defaultBackgroundInner} />
          </>
        )}

        <View style={[styles.content, used === "modern" ? styles.contentModern : {}, align ?? {}]}>
          <Text style={[styles.eyebrow, textAlign ?? {}]}>Sanggabiz Academy</Text>
          <Text style={[styles.title, textAlign ?? {}]}>{headline}</Text>
          <Text style={styles.presented}>Dengan ini menyatakan bahwa</Text>
          <Text style={[styles.name, textAlign ?? {}]}>{learnerName}</Text>
          <Text style={[styles.description, textAlign ?? {}]}>
            {description || `${copy.verb} ${courseTitle}.`}
          </Text>
          {additionalText ? <Text style={styles.additionalText}>{additionalText}</Text> : null}
        </View>

        <View style={[styles.footer, used === "formal" ? styles.footerFormal : {}]}>
          <View style={[styles.signatureBlock, used === "formal" ? styles.signatureBlockFormal : {}]}>
            {signatureUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image, not an HTML <img>
              <Image src={signatureUrl} style={styles.signatureImage} />
            ) : (
              <View style={styles.signatureImageSpacer} />
            )}
            <View style={styles.signatureLine} />
            {signerName ? <Text style={styles.signerName}>{signerName}</Text> : null}
            {signerTitle ? <Text style={styles.signerTitle}>{signerTitle}</Text> : null}
          </View>

          <View style={styles.meta}>
            <Text style={styles.metaText}>Sertifikat No. {serial}</Text>
            <Text style={styles.metaText}>Diterbitkan {issuedDate}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
