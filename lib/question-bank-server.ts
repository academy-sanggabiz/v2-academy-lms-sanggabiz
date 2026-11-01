import { createClient } from "@/lib/supabase/server"
import { dbErrorMessage } from "@/lib/db-error-message"
import type { AuthorableQuestionType } from "@/lib/courses"

/**
 * Bank soal: soal yang sudah ditulis, disimpan lepas dari kuis mana pun
 * supaya bisa dipakai lagi.
 *
 * Soal dari bank **disalin** ke kuis, bukan dirujuk. Merujuk akan membuat
 * penyuntingan satu soal mengubah kuis yang sudah dikerjakan orang, dan
 * riwayat nilai jadi bercerita hal yang berbeda dari yang sebenarnya
 * dikerjakan peserta. Alasan lengkapnya ada di migrasi
 * 20261101140000_question_bank.sql.
 */

export type BankOption = {
  text: string
  is_correct: boolean
  match_key: string | null
  position: number
}

export type BankItem = {
  id: string
  type: AuthorableQuestionType
  prompt: string
  allow_multiple: boolean
  case_sensitive: boolean
  explanation: string
  tags: string[]
  createdAt: string
  options: BankOption[]
}

type BankRow = {
  id: string
  type: string
  prompt: string
  allow_multiple: boolean
  case_sensitive: boolean
  explanation: string
  tags: string[] | null
  created_at: string
  options: BankOption[] | null
}

const SELECT =
  "id, type, prompt, allow_multiple, case_sensitive, explanation, tags, created_at, options:question_bank_options(text, is_correct, match_key, position)"

function toItem(row: BankRow): BankItem {
  return {
    id: row.id,
    type: row.type as AuthorableQuestionType,
    prompt: row.prompt,
    allow_multiple: row.allow_multiple,
    case_sensitive: row.case_sensitive,
    explanation: row.explanation ?? "",
    tags: row.tags ?? [],
    createdAt: row.created_at,
    options: [...(row.options ?? [])].sort((a, b) => a.position - b.position),
  }
}

export type BankListResult = {
  items: BankItem[]
  /** False bila tabelnya belum ada -- migrasi proyek ini dijalankan tangan. */
  ready: boolean
}

/** Penyaringan kepemilikan ada di RLS; `search` hanya mempersempit. */
export async function listBankItems(search?: string): Promise<BankListResult> {
  const supabase = await createClient()
  let query = supabase
    .from("question_bank_items")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(200)

  const term = search?.trim()
  if (term) {
    // Dicari di teks soalnya maupun di labelnya: penyusun mengingat soal
    // lewat salah satu dari keduanya, tidak selalu yang sama.
    query = query.or(`prompt.ilike.%${term.replaceAll("%", "")}%,tags.cs.{${term.replaceAll(",", "")}}`)
  }

  const { data, error } = await query
  if (error) {
    console.error("listBankItems failed:", error.message)
    return { items: [], ready: false }
  }
  return { items: (data as unknown as BankRow[]).map(toItem), ready: true }
}

export type NewBankItem = {
  type: AuthorableQuestionType
  prompt: string
  allow_multiple: boolean
  case_sensitive: boolean
  explanation: string
  tags: string[]
  sourceCourseId: string | null
  options: { text: string; is_correct: boolean; match_key?: string | null }[]
}

export async function addBankItems(
  items: NewBankItem[]
): Promise<{ error: string } | { error: null; added: number }> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub as string | undefined
  if (!userId) return { error: "Anda belum masuk" }

  const { data: inserted, error } = await supabase
    .from("question_bank_items")
    .insert(
      items.map((i) => ({
        created_by: userId,
        type: i.type,
        prompt: i.prompt,
        allow_multiple: i.allow_multiple,
        case_sensitive: i.case_sensitive,
        explanation: i.explanation,
        tags: i.tags,
        source_course_id: i.sourceCourseId,
      }))
    )
    .select("id")

  if (error || !inserted) {
    console.error("addBankItems failed:", error?.message)
    return { error: dbErrorMessage(error?.message ?? "") }
  }

  // Pilihan jawaban ditulis setelah soalnya punya id. Urutan baris yang
  // dikembalikan `insert ... returning` mengikuti urutan yang dikirim, jadi
  // pasangannya ditentukan berdasarkan indeks.
  const optionRows = inserted.flatMap((row, index) =>
    items[index].options.map((o, position) => ({
      item_id: row.id,
      text: o.text,
      is_correct: o.is_correct,
      match_key: o.match_key ?? null,
      position,
    }))
  )

  if (optionRows.length > 0) {
    const { error: optionError } = await supabase.from("question_bank_options").insert(optionRows)
    if (optionError) {
      console.error("addBankItems options failed:", optionError.message)
      return { error: dbErrorMessage(optionError.message) }
    }
  }

  return { error: null, added: inserted.length }
}

export async function deleteBankItem(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from("question_bank_items").delete().eq("id", id)
  if (error) {
    console.error("deleteBankItem failed:", error.message)
    return { error: dbErrorMessage(error.message) }
  }
  return { error: null }
}
