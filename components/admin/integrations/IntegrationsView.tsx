"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Copy, ExternalLink, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusMessage } from "@/components/ui/status-message"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { KEJADIAN_WEBHOOK, type Lingkup } from "@/lib/api-keys"
import type { Integrasi } from "@/lib/integrations-server"
import {
  buatEndpointAction,
  buatKunciAction,
  cabutKunciAction,
  hapusEndpointAction,
  kirimSekarangAction,
} from "@/app/admin/integrations/actions"

/**
 * Kunci API dan webhook, untuk superadmin.
 *
 * Dua rahasia pernah lewat layar ini -- kunci API dan kunci tanda tangan
 * webhook -- dan keduanya hanya ditampilkan SEKALI, di kotak yang mengatakan
 * demikian. Yang tersimpan di basis data cuma hash kunci API; kunci tanda
 * tangan memang harus tersimpan utuh karena dipakai menandatangani tiap
 * kiriman, tetapi tidak pernah dibacakan lagi ke layar.
 */
export function IntegrationsView({ data }: { data: Integrasi }) {
  const { t, locale } = useI18n()
  const [pending, startTransition] = useTransition()

  const [nama, setNama] = useState("")
  const [lingkup, setLingkup] = useState<Lingkup[]>(["read"])
  const [kunciBaru, setKunciBaru] = useState<string | null>(null)

  const [url, setUrl] = useState("")
  const [keterangan, setKeterangan] = useState("")
  const [kejadian, setKejadian] = useState<string[]>([...KEJADIAN_WEBHOOK])
  const [rahasiaBaru, setRahasiaBaru] = useState<string | null>(null)

  const [galat, setGalat] = useState<string | null>(null)

  const tanggal = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

  async function salin(teks: string) {
    try {
      await navigator.clipboard.writeText(teks)
      toast.success(t.integrasi.copied)
    } catch {
      // Peramban bisa menolak papan klip tanpa izin. Kuncinya tetap terlihat
      // di layar, jadi menyalin manual selalu mungkin -- tidak perlu galat.
      toast.error(t.integrasi.copy)
    }
  }

  function buat() {
    setGalat(null)
    startTransition(async () => {
      const r = await buatKunciAction(nama, lingkup)
      if (!r.ok) {
        setGalat(r.error)
        return
      }
      setKunciBaru(r.data.rahasia)
      setNama("")
    })
  }

  function tambahEndpoint() {
    setGalat(null)
    startTransition(async () => {
      const r = await buatEndpointAction(url, keterangan, kejadian)
      if (!r.ok) {
        setGalat(r.error)
        return
      }
      setRahasiaBaru(r.data.secret)
      setUrl("")
      setKeterangan("")
    })
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">{t.integrasi.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.integrasi.subtitle}</p>

      <StatusMessage className="mt-3">{galat}</StatusMessage>

      <Card className="mt-6">
        <CardContent>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">{t.integrasi.docsTitle}</h2>
            <Button variant="outline" size="sm" render={<Link href="/admin/integrations/petunjuk" />} nativeButton={false}>
              <ExternalLink className="size-4" aria-hidden />
              {t.integrasi.openDocs}
            </Button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t.integrasi.docsDesc}</p>
        </CardContent>
      </Card>

      {/* ---------- kunci API ---------- */}
      <h2 className="mt-8 text-lg font-bold">{t.integrasi.keysTitle}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{t.integrasi.keysDesc}</p>

      {kunciBaru && (
        <div className="mt-3 rounded-lg border border-ring/40 bg-secondary/40 p-3">
          <p className="text-sm font-semibold">{t.integrasi.shownOnce}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-card px-2.5 py-1.5 text-xs">
              {kunciBaru}
            </code>
            <Button size="sm" variant="outline" onClick={() => salin(kunciBaru)}>
              <Copy className="size-3.5" aria-hidden />
              {t.integrasi.copy}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setKunciBaru(null)}>
              {t.common.close}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="nama-kunci">{t.integrasi.keyName}</Label>
          <Input
            id="nama-kunci"
            className="h-9"
            placeholder={t.integrasi.keyNamePh}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
        </div>
        <fieldset className="space-y-1.5">
          {/* "Hak akses", bukan "Baca": legenda yang memakai nama salah satu
              pilihannya membuat kata yang sama muncul dua kali berturut-turut
              dan tidak memberi tahu apa pun tentang kelompoknya. */}
          <legend className="text-sm font-medium">{t.integrasi.scopeLabel}</legend>
          <div className="flex gap-3">
            {(["read", "write"] as Lingkup[]).map((l) => (
              <label key={l} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={lingkup.includes(l)}
                  onChange={(e) =>
                    setLingkup((v) => (e.target.checked ? [...v, l] : v.filter((x) => x !== l)))
                  }
                />
                {l === "read" ? t.integrasi.scopeRead : t.integrasi.scopeWrite}
              </label>
            ))}
          </div>
        </fieldset>
        <Button pending={pending} pendingLabel={t.integrasi.creating} onClick={buat} disabled={!nama.trim()}>
          <Plus className="size-4" aria-hidden />
          {t.integrasi.create}
        </Button>
      </div>

      {data.kunci.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t.integrasi.noKeys}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {data.kunci.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">
                  {k.nama}{" "}
                  <code className="text-xs text-muted-foreground">sgb_{k.awalan}_…</code>
                </div>
                <div className="text-xs text-muted-foreground">
                  {k.lingkup.join(", ")} ·{" "}
                  {k.terakhirDipakai
                    ? t.integrasi.lastUsed.replace("{tanggal}", tanggal(k.terakhirDipakai))
                    : t.integrasi.neverUsed}
                </div>
              </div>
              {k.dicabutPada ? (
                <span className="text-xs text-muted-foreground">{t.integrasi.revoked}</span>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startTransition(async () => void (await cabutKunciAction(k.id)))}
                >
                  {t.integrasi.revoke}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ---------- webhook ---------- */}
      <h2 className="mt-8 text-lg font-bold">{t.integrasi.hooksTitle}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{t.integrasi.hooksDesc}</p>
      <p className="mt-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        {t.integrasi.privacyWarn}
      </p>

      {rahasiaBaru && (
        <div className="mt-3 rounded-lg border border-ring/40 bg-secondary/40 p-3">
          <p className="text-sm font-semibold">{t.integrasi.secretShown}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-card px-2.5 py-1.5 text-xs">
              {rahasiaBaru}
            </code>
            <Button size="sm" variant="outline" onClick={() => salin(rahasiaBaru)}>
              <Copy className="size-3.5" aria-hidden />
              {t.integrasi.copy}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRahasiaBaru(null)}>
              {t.common.close}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-3 rounded-lg border border-border p-3">
        <div className="space-y-1.5">
          <Label htmlFor="url-hook">{t.integrasi.hookUrl}</Label>
          <Input
            id="url-hook"
            className="h-9"
            placeholder="https://contoh.co.id/webhook/sanggabiz"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ket-hook">{t.integrasi.hookNote}</Label>
          <Input
            id="ket-hook"
            className="h-9"
            placeholder={t.integrasi.hookNotePh}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
          />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">{t.integrasi.hookEvents}</legend>
          <div className="mt-1.5 flex flex-wrap gap-3">
            {KEJADIAN_WEBHOOK.map((k) => (
              <label key={k} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={kejadian.includes(k)}
                  onChange={(e) =>
                    setKejadian((v) => (e.target.checked ? [...v, k] : v.filter((x) => x !== k)))
                  }
                />
                <code className="text-xs">{k}</code>
              </label>
            ))}
          </div>
        </fieldset>
        <Button
          pending={pending}
          pendingLabel={t.integrasi.creating}
          onClick={tambahEndpoint}
          disabled={!url.trim()}
        >
          <Plus className="size-4" aria-hidden />
          {t.integrasi.addHook}
        </Button>
      </div>

      {data.endpoint.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t.integrasi.noHooks}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {data.endpoint.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{e.url}</div>
                <div className="text-xs text-muted-foreground">
                  {e.keterangan ? `${e.keterangan} · ` : ""}
                  {e.kejadian.join(", ")}
                </div>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`${t.integrasi.deleteHook} ${e.url}`}
                onClick={() => startTransition(async () => void (await hapusEndpointAction(e.id)))}
              >
                <Trash2 className="size-3.5 text-destructive" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* ---------- jejak ---------- */}
      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{t.integrasi.logTitle}</h2>
        <div className="flex items-center gap-2.5">
          {data.tertunda > 0 && (
            <span className="text-sm text-muted-foreground">
              {t.integrasi.pendingCount.replace("{n}", String(data.tertunda))}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            pending={pending}
            pendingLabel={t.integrasi.sending}
            onClick={() =>
              startTransition(async () => {
                const r = await kirimSekarangAction()
                if (r.ok) {
                  toast.success(
                    t.integrasi.sendResult
                      .replace("{terkirim}", String(r.data.terkirim))
                      .replace("{gagal}", String(r.data.gagal))
                  )
                }
              })
            }
          >
            {t.integrasi.sendNow}
          </Button>
        </div>
      </div>

      {data.pengiriman.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t.integrasi.noLog}</p>
      ) : (
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
          {data.pengiriman.map((d) => (
            <li key={d.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-3 py-2">
              {/* Keadaan ditulis dengan kata, bukan hanya warna (WCAG 1.4.1). */}
              <span className="text-xs font-semibold">
                {d.terkirimPada
                  ? t.integrasi.delivered
                  : d.galat
                    ? t.integrasi.failed
                    : t.integrasi.waiting}
              </span>
              <code className="text-xs">{d.kejadian}</code>
              <span className="text-xs text-muted-foreground">
                {d.statusCode ? `HTTP ${d.statusCode}` : ""} {d.galat ?? ""}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">{tanggal(d.dibuatPada)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
