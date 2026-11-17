import { NextResponse } from "next/server"

import { dokumenOpenApi } from "@/lib/openapi"
import { alamatKanonik } from "@/lib/site-url"

/**
 * Dokumen OpenAPI, terbuka tanpa kunci.
 *
 * Berbeda dengan koleksi Postman yang dibatasi superadmin: koleksi itu sebuah
 * UNDUHAN di dalam layar pengelola, sedangkan ini adalah dokumentasinya
 * sendiri. Menutupnya berarti tim IT pelanggan harus meminta berkas lewat
 * surel sebelum bisa membaca nama satu ruas pun -- dan dokumentasi yang harus
 * diminta dulu adalah dokumentasi yang tidak dibaca.
 *
 * Yang dibuka di sini hanya BENTUK API-nya, bukan isinya. Tidak ada satu
 * baris data pun di dalam dokumen ini, dan setiap rute /api/v1 tetap menjawab
 * 401 tanpa kunci yang sah. Lihat juga app/api/public/stats.
 *
 * CORS dibuka supaya perkakas pembuat kode klien (dan Swagger yang dijalankan
 * di tempat lain) bisa membacanya langsung.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function GET() {
  return NextResponse.json(dokumenOpenApi(alamatKanonik()), {
    headers: {
      ...CORS_HEADERS,
      // Boleh disinggahi: isinya sama untuk semua orang dan tidak bergantung
      // pada siapa yang meminta.
      "Cache-Control": "public, max-age=300",
    },
  })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
