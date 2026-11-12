import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { daftarKunci } from "@/lib/api-keys-server"
import type { Endpoint, KunciApi, Pengiriman } from "@/lib/api-keys"

/** Semua yang dibutuhkan layar /admin/integrations, dalam satu bacaan. */
export type Integrasi = {
  kunci: KunciApi[]
  endpoint: Endpoint[]
  pengiriman: Pengiriman[]
  tertunda: number
}

export async function getIntegrasi(): Promise<Integrasi> {
  const admin = createAdminClient()

  const [kunci, ep, kirim, tertunda] = await Promise.all([
    daftarKunci(),
    admin
      .from("webhook_endpoints")
      .select("id, url, description, events, active, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("webhook_deliveries")
      .select("id, endpoint_id, event, status_code, error, attempt, delivered_at, created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    admin
      .from("webhook_deliveries")
      .select("id", { count: "exact", head: true })
      .is("delivered_at", null),
  ])

  type BE = { id: string; url: string; description: string | null; events: string[]; active: boolean; created_at: string }
  type BK = {
    id: string
    endpoint_id: string
    event: string
    status_code: number | null
    error: string | null
    attempt: number
    delivered_at: string | null
    created_at: string
  }

  return {
    kunci,
    endpoint: ((ep.data ?? []) as BE[]).map((e) => ({
      id: e.id,
      url: e.url,
      keterangan: e.description,
      kejadian: e.events ?? [],
      aktif: e.active,
      dibuatPada: e.created_at,
    })),
    pengiriman: ((kirim.data ?? []) as BK[]).map((d) => ({
      id: d.id,
      endpointId: d.endpoint_id,
      kejadian: d.event,
      statusCode: d.status_code,
      galat: d.error,
      percobaan: d.attempt,
      terkirimPada: d.delivered_at,
      dibuatPada: d.created_at,
    })),
    tertunda: tertunda.count ?? 0,
  }
}
