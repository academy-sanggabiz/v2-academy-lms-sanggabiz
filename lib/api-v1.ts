import "server-only"

import { NextResponse } from "next/server"

import { periksaKunci, type Pemegang } from "@/lib/api-keys-server"
import type { Lingkup } from "@/lib/api-keys"

/**
 * Perkakas bersama untuk seluruh rute `/api/v1/*`.
 *
 * == Kenapa bahasa Inggris di sini ==
 *
 * Nama ruas JSON, pesan galat, dan nama parameter di API ini memakai bahasa
 * Inggris, berbeda dari seluruh antarmuka yang berbahasa Indonesia. Itu
 * disengaja: pembacanya bukan manusia yang sedang belajar, melainkan kode di
 * sistem lain, dan ruas yang namanya berubah bahasa adalah perubahan yang
 * merusak. Aturan dwibahasa berlaku untuk antarmuka, bukan untuk kontrak
 * mesin -- sama dengan tajuk CSV penilaian yang juga tetap Inggris.
 *
 * == Kenapa bukan sekadar anon key ==
 *
 * Supabase sudah punya REST sendiri, dan anon key bersifat publik. Yang
 * dibutuhkan tim IT pelanggan adalah kredensial yang bisa DICABUT satu per
 * satu tanpa mengganggu yang lain, yang bisa dibatasi haknya (baca saja), dan
 * yang pemakaiannya terlihat. Itu yang diberikan lapisan ini.
 */

export const MAKS_LIMIT = 200
export const LIMIT_BAWAAN = 50

type Galat = { error: string; message: string }

export function galat(status: number, error: string, message: string): NextResponse<Galat> {
  return NextResponse.json({ error, message }, { status })
}

/**
 * Memeriksa kunci dan haknya. Mengembalikan `Response` bila ditolak, supaya
 * pemanggil cukup menulis satu baris penjagaan.
 */
export async function jagaApi(
  request: Request,
  perlu: Lingkup
): Promise<{ pemegang: Pemegang } | { tolak: NextResponse }> {
  const pemegang = await periksaKunci(request.headers.get("authorization"))

  if (!pemegang) {
    return {
      tolak: galat(
        401,
        "unauthorized",
        "Provide a valid API key as `Authorization: Bearer sgb_...`."
      ),
    }
  }

  if (!pemegang.lingkup.includes(perlu)) {
    return {
      tolak: galat(
        403,
        "forbidden",
        `This key does not have the \`${perlu}\` scope.`
      ),
    }
  }

  return { pemegang }
}

export type Halaman = { limit: number; offset: number }

export function halaman(request: Request): Halaman {
  const url = new URL(request.url)
  const limitMentah = Number(url.searchParams.get("limit") ?? LIMIT_BAWAAN)
  const offsetMentah = Number(url.searchParams.get("offset") ?? 0)

  // Dijepit, bukan ditolak. Permintaan `limit=10000` jelas maksudnya "sebanyak
  // mungkin"; menjawabnya dengan 400 hanya memaksa penulis kode menebak
  // batasnya, sementara menjepit memberi jawaban yang berguna sekaligus
  // melindungi server.
  const limit = Number.isFinite(limitMentah) ? Math.min(Math.max(1, Math.floor(limitMentah)), MAKS_LIMIT) : LIMIT_BAWAAN
  const offset = Number.isFinite(offsetMentah) ? Math.max(0, Math.floor(offsetMentah)) : 0
  return { limit, offset }
}

export function jawab<T>(data: T[], h: Halaman, total: number | null): NextResponse {
  return NextResponse.json(
    {
      data,
      pagination: { limit: h.limit, offset: h.offset, total },
    },
    {
      headers: {
        // Tanpa singgahan: jawaban berisi data per-organisasi di balik
        // kredensial, dan satu jawaban yang tersimpan di perantara bisa
        // sampai ke pemegang kunci yang lain.
        "Cache-Control": "no-store",
      },
    }
  )
}
