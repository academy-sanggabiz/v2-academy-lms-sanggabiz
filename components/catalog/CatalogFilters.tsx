"use client"

import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/components/i18n/LocaleProvider"
import { useDebouncedParam, useListParams } from "@/hooks/use-list-params"
import type { CatalogFacets } from "@/lib/catalog-server"

/**
 * Saringan katalog publik.
 *
 * Seluruh keadaannya hidup di alamat URL, bukan di state komponen: hasil
 * saringan jadi bisa dibagikan, dibuka di tab baru, dan ditekan tombol
 * "kembali" tanpa kehilangan pilihan. Itu juga yang membuat halamannya tetap
 * dirender di server -- daftar kelas tidak perlu menunggu JavaScript.
 *
 * Jumlah hasil ditempel pada tiap pilihan tingkat dan akses. Saringan yang
 * membawa ke halaman kosong adalah jalan buntu yang baru terlihat setelah
 * ditekan; dengan angkanya di depan, pengunjung tahu lebih dulu.
 */
export function CatalogFilters({ facets }: { facets: CatalogFacets }) {
  const { t } = useI18n()
  const { get, setParams, isPending } = useListParams()
  const { value: cari, setValue: setCari, isPending: mencari } = useDebouncedParam("cari")

  const level = get("tingkat")
  const kategori = get("kategori")
  const akses = get("akses")
  const durasi = get("durasi")
  const urut = get("urut") || "terbaru"

  const adaSaringan = Boolean(cari || level || kategori || akses || durasi || get("urut"))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          {mencari ? (
            <Spinner className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          ) : (
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={t.catalog.searchPlaceholder}
            aria-label={t.catalog.searchPlaceholder}
            aria-busy={mencari || undefined}
            className="bg-card pl-9"
          />
        </div>

        {facets.categories.length > 0 && (
          <Select
            items={[
              { value: "", label: t.catalog.allCategories },
              ...facets.categories.map((k) => ({
                value: k.category.slug,
                label: `${k.category.name} (${k.count})`,
              })),
            ]}
            value={kategori}
            onValueChange={(v) => setParams({ kategori: v ?? "" })}
          >
            <SelectTrigger aria-label={t.catalog.filterCategory} className="min-w-[170px] bg-card">
              <SelectValue placeholder={t.catalog.allCategories} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t.catalog.allCategories}</SelectItem>
              {facets.categories.map((k) => (
                <SelectItem key={k.category.id} value={k.category.slug}>
                  {k.category.name} ({k.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          items={[
            { value: "", label: t.catalog.allLevels },
            { value: "beginner", label: `${t.editor.levelBeginner} (${facets.perLevel.beginner})` },
            { value: "intermediate", label: `${t.editor.levelIntermediate} (${facets.perLevel.intermediate})` },
            { value: "advanced", label: `${t.editor.levelAdvanced} (${facets.perLevel.advanced})` },
          ]}
          value={level}
          onValueChange={(v) => setParams({ tingkat: v ?? "" })}
        >
          <SelectTrigger aria-label={t.catalog.filterLevel} className="min-w-[150px] bg-card">
            <SelectValue placeholder={t.catalog.allLevels} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t.catalog.allLevels}</SelectItem>
            <SelectItem value="beginner">
              {t.editor.levelBeginner} ({facets.perLevel.beginner})
            </SelectItem>
            <SelectItem value="intermediate">
              {t.editor.levelIntermediate} ({facets.perLevel.intermediate})
            </SelectItem>
            <SelectItem value="advanced">
              {t.editor.levelAdvanced} ({facets.perLevel.advanced})
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          items={[
            { value: "", label: t.catalog.allAccess },
            { value: "gratis", label: `${t.catalog.accessFree} (${facets.gratis})` },
            { value: "berbayar", label: `${t.catalog.accessPaid} (${facets.berbayar})` },
          ]}
          value={akses}
          onValueChange={(v) => setParams({ akses: v ?? "" })}
        >
          <SelectTrigger aria-label={t.catalog.filterAccess} className="min-w-[140px] bg-card">
            <SelectValue placeholder={t.catalog.allAccess} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t.catalog.allAccess}</SelectItem>
            <SelectItem value="gratis">
              {t.catalog.accessFree} ({facets.gratis})
            </SelectItem>
            <SelectItem value="berbayar">
              {t.catalog.accessPaid} ({facets.berbayar})
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          items={[
            { value: "", label: t.catalog.allDurations },
            { value: "pendek", label: t.catalog.durationShort },
            { value: "sedang", label: t.catalog.durationMedium },
            { value: "panjang", label: t.catalog.durationLong },
          ]}
          value={durasi}
          onValueChange={(v) => setParams({ durasi: v ?? "" })}
        >
          <SelectTrigger aria-label={t.catalog.filterDuration} className="min-w-[150px] bg-card">
            <SelectValue placeholder={t.catalog.allDurations} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t.catalog.allDurations}</SelectItem>
            <SelectItem value="pendek">{t.catalog.durationShort}</SelectItem>
            <SelectItem value="sedang">{t.catalog.durationMedium}</SelectItem>
            <SelectItem value="panjang">{t.catalog.durationLong}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          items={[
            { value: "terbaru", label: t.catalog.sortNewest },
            { value: "judul", label: t.catalog.sortTitle },
            { value: "tersingkat", label: t.catalog.sortShortest },
            { value: "terpanjang", label: t.catalog.sortLongest },
          ]}
          value={urut}
          onValueChange={(v) => setParams({ urut: v === "terbaru" ? "" : (v ?? "") })}
        >
          <SelectTrigger aria-label={t.catalog.sortLabel} className="min-w-[170px] bg-card">
            <SelectValue placeholder={t.catalog.sortNewest} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="terbaru">{t.catalog.sortNewest}</SelectItem>
            <SelectItem value="judul">{t.catalog.sortTitle}</SelectItem>
            <SelectItem value="tersingkat">{t.catalog.sortShortest}</SelectItem>
            <SelectItem value="terpanjang">{t.catalog.sortLongest}</SelectItem>
          </SelectContent>
        </Select>

        {adaSaringan && (
          <Button
            variant="ghost"
            onClick={() => {
              setCari("")
              setParams({ tingkat: "", kategori: "", akses: "", durasi: "", urut: "", cari: "" })
            }}
          >
            <X className="size-4" aria-hidden />
            {t.catalog.resetFilters}
          </Button>
        )}
      </div>

      {/*
        Perubahan saringan mengganti isi daftar di bawah tanpa memindahkan
        fokus. Tanpa pengumuman ini, pengguna pembaca layar tidak tahu
        daftarnya sudah berganti (STANDAR-UMPAN-BALIK-UI.md R1).
      */}
      <span role="status" aria-live="polite" className="sr-only">
        {isPending || mencari ? t.editor.loadingShort : ""}
      </span>
    </div>
  )
}
