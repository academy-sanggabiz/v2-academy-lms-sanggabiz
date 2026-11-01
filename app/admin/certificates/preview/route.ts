import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"

import { CertificateDocument } from "@/components/certificates/CertificateDocument"
import { requireAdmin } from "@/lib/auth/require-admin"
import { resolveCertificateSettings, type CertificateDefaults } from "@/lib/certificate-settings"
import type { CourseCertificateSettings } from "@/lib/courses-admin"

/**
 * Pratinjau sertifikat, dirender sebagai PDF sungguhan.
 *
 * Sengaja memakai `CertificateDocument` yang sama persis dengan yang dipakai
 * saat sertifikat benar-benar diterbitkan. Tiruan HTML akan lebih ringan,
 * tetapi ia menua sendiri: begitu dokumen aslinya berubah, pratinjaunya
 * berbohong -- dan pratinjau yang berbohong lebih buruk daripada tidak ada
 * pratinjau, karena orang memutuskan berdasarkan apa yang dilihatnya.
 *
 * Datanya contoh, bukan data peserta sungguhan: layar ini dibuka sebelum ada
 * sertifikat apa pun yang terbit.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Anda tidak berwenang" }, { status: 403 })
  }

  let body: { course?: Partial<CourseCertificateSettings> | null; defaults?: CertificateDefaults }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Isi permintaan tidak terbaca" }, { status: 400 })
  }

  const resolved = resolveCertificateSettings(body.course ?? null, body.defaults ?? null)

  try {
    const buffer = await renderToBuffer(
      CertificateDocument({
        learnerName: "Nama Peserta",
        courseTitle: "Judul Kursus",
        certificateType: resolved.certificate_type ?? "completion",
        customTitle: resolved.custom_title,
        description: (resolved.description ?? "")
          .replaceAll("[Nama Peserta]", "Nama Peserta")
          .replaceAll("[Nama Kursus]", "Judul Kursus") || null,
        signerName: resolved.signer_name,
        signerTitle: resolved.signer_title,
        signatureUrl: resolved.signature_url,
        templateUrl: resolved.template_url,
        layout: resolved.layout,
        serial: "CERT-2026-CONTOH1",
        issuedAt: new Date().toISOString(),
        additionalText: resolved.additional_text,
      })
    )

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        // Tidak di-cache: isinya berubah setiap kali pengaturannya diubah.
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("pratinjau sertifikat gagal:", err)
    return NextResponse.json(
      { error: "Pratinjau gagal dibuat. Periksa gambar tanda tangan dan templat yang diunggah." },
      { status: 500 }
    )
  }
}
