import "server-only"

import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

import { createAdminClient } from "@/lib/supabase/admin"
import { AWALAN_KUNCI, type KunciApi, type Lingkup } from "@/lib/api-keys"

/**
 * Membuat, memeriksa, dan mencabut kunci API.
 *
 * Seluruhnya memakai service role. Tabel `integration_api_keys` tidak punya
 * policy untuk siapa pun -- ia hanya boleh disentuh kode server, dan
 * penjaganya `requireSuperAdmin()` di layar pemanggil, bukan RLS. Kunci API
 * adalah kredensial; tidak ada peran peramban yang perlu membacanya.
 */

function hash(kunci: string): string {
  return createHash("sha256").update(kunci).digest("hex")
}

export type KunciBaru = { kunci: KunciApi; rahasia: string }

/**
 * Membuat kunci baru. `rahasia` adalah SATU-SATUNYA kali kunci utuh ada;
 * sesudah ini hanya hash-nya yang tersimpan.
 */
export async function buatKunci(
  nama: string,
  lingkup: Lingkup[],
  olehUserId: string
): Promise<KunciBaru | { error: string }> {
  const bersih = nama.trim()
  if (!bersih) return { error: "Beri nama kuncinya, supaya nanti bisa dikenali." }
  if (bersih.length > 80) return { error: "Namanya terlalu panjang." }
  if (lingkup.length === 0) return { error: "Pilih minimal satu hak akses." }

  const awalan = randomBytes(4).toString("hex")
  const rahasia = randomBytes(24).toString("hex")
  const utuh = `${AWALAN_KUNCI}_${awalan}_${rahasia}`

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("integration_api_keys")
    .insert({
      name: bersih,
      prefix: awalan,
      key_hash: hash(utuh),
      scopes: lingkup,
      created_by: olehUserId,
    })
    .select("id, name, prefix, scopes, created_at, last_used_at, revoked_at")
    .single()

  if (error || !data) {
    console.error("buatKunci gagal:", error?.message)
    return { error: "Gagal membuat kunci. Coba lagi." }
  }

  return { kunci: keKunci(data), rahasia: utuh }
}

type BarisKunci = {
  id: string
  name: string
  prefix: string
  scopes: string[]
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

function keKunci(b: BarisKunci): KunciApi {
  return {
    id: b.id,
    nama: b.name,
    awalan: b.prefix,
    lingkup: (b.scopes ?? []).filter((s): s is Lingkup => s === "read" || s === "write"),
    dibuatPada: b.created_at,
    terakhirDipakai: b.last_used_at,
    dicabutPada: b.revoked_at,
  }
}

export async function daftarKunci(): Promise<KunciApi[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("integration_api_keys")
    .select("id, name, prefix, scopes, created_at, last_used_at, revoked_at")
    .order("created_at", { ascending: false })
  return ((data ?? []) as BarisKunci[]).map(keKunci)
}

export async function cabutKunci(id: string): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from("integration_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null)

  if (error) {
    console.error("cabutKunci gagal:", error.message)
    return { error: "Gagal mencabut kunci. Coba lagi." }
  }
  return {}
}

export type Pemegang = { id: string; nama: string; lingkup: Lingkup[] }

/**
 * Memeriksa header `Authorization: Bearer <kunci>`.
 *
 * Perbandingan hash memakai `timingSafeEqual`, bukan `===`. Perbandingan
 * string biasa berhenti pada huruf pertama yang berbeda, sehingga lama
 * pemeriksaan membocorkan berapa banyak huruf awal yang sudah benar --
 * cukup untuk menebak kunci satu huruf demi satu huruf bila penyerang bisa
 * mengukur waktu jawaban. Awalan tetap dicari dengan `eq` biasa: ia memang
 * bukan rahasia dan ikut terlihat di layar pengelola.
 */
export async function periksaKunci(header: string | null): Promise<Pemegang | null> {
  if (!header?.startsWith("Bearer ")) return null
  const utuh = header.slice(7).trim()

  const bagian = utuh.split("_")
  if (bagian.length !== 3 || bagian[0] !== AWALAN_KUNCI) return null
  const awalan = bagian[1]

  const admin = createAdminClient()
  const { data } = await admin
    .from("integration_api_keys")
    .select("id, name, key_hash, scopes, revoked_at")
    .eq("prefix", awalan)
    .is("revoked_at", null)
    .maybeSingle<{ id: string; name: string; key_hash: string; scopes: string[]; revoked_at: string | null }>()

  if (!data) return null

  const diberikan = Buffer.from(hash(utuh), "hex")
  const tersimpan = Buffer.from(data.key_hash, "hex")
  if (diberikan.length !== tersimpan.length || !timingSafeEqual(diberikan, tersimpan)) return null

  /*
   * `last_used_at` ditulis tanpa ditunggu.
   *
   * Pencatatan pemakaian tidak boleh menambah satu perjalanan ke basis data
   * pada setiap permintaan API. Kalau penulisannya gagal, yang hilang cuma
   * ketepatan satu tanggal di layar -- bukan jawaban yang sedang diminta.
   */
  void admin
    .from("integration_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(undefined, () => {})

  return {
    id: data.id,
    nama: data.name,
    lingkup: (data.scopes ?? []).filter((s): s is Lingkup => s === "read" || s === "write"),
  }
}
