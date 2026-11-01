"use server"

import { requireAdmin } from "@/lib/auth/require-admin"
import {
  addBankItems,
  deleteBankItem,
  listBankItems,
  type BankItem,
  type NewBankItem,
} from "@/lib/question-bank-server"

import type { ActionResult } from "@/app/admin/courses/actions"

/**
 * Semua aksi di sini diperiksa `requireAdmin()` DAN dibatasi RLS. Server
 * action bisa dipanggil langsung lewat jaringan, jadi tombol yang tidak
 * tampil bukan penjaga.
 */

export async function listBankItemsAction(
  search?: string
): Promise<ActionResult<{ items: BankItem[]; ready: boolean }>> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await listBankItems(search)
  return { ok: true, data: result }
}

export async function addBankItemsAction(items: NewBankItem[]): Promise<ActionResult<{ added: number }>> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  if (items.length === 0) return { ok: false, error: "Tidak ada soal yang dipilih" }
  if (items.length > 100) return { ok: false, error: "Maksimal 100 soal sekaligus" }

  const kosong = items.find((i) => !i.prompt.trim())
  if (kosong) return { ok: false, error: "Ada soal yang teksnya masih kosong" }

  const result = await addBankItems(items)
  if (result.error !== null) return { ok: false, error: result.error }
  return { ok: true, data: { added: result.added } }
}

export async function deleteBankItemAction(id: string): Promise<ActionResult<undefined>> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "Anda tidak berwenang" }
  }

  const result = await deleteBankItem(id)
  if (result.error) return { ok: false, error: result.error }
  return { ok: true, data: undefined }
}
