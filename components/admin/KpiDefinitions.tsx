/**
 * Definisi KPI, satu blok penyingkap di bawah kisi angkanya.
 *
 * Standar platform butir I1: sebuah KPI punya nama, definisi (apa persisnya
 * yang dihitung), dan target. Tanpa definisi, dua orang membaca angka yang
 * sama dan membayangkan hitungan yang berbeda -- "peserta" bisa berarti orang,
 * bisa berarti pendaftaran, dan keduanya pernah benar di dasbor ini.
 *
 * Bentuknya `details` asli, bukan tooltip: tooltip tidak bisa dibuka di layar
 * sentuh dan hilang sebelum selesai dibaca. Tertutup secara bawaan supaya
 * dasbornya tetap ringkas; yang butuh definisinya membukanya sekali dan
 * selesai.
 *
 * Target sengaja TIDAK diisi dari kode. Target adalah keputusan bisnis milik
 * pemilik, dan baris penutupnya mengatakan itu terus terang -- angka target
 * karangan lebih buruk daripada pengakuan bahwa targetnya belum ada.
 */
export function KpiDefinitions({
  title,
  items,
  noTarget,
}: {
  title: string
  items: { label: string; definition: string }[]
  noTarget: string
}) {
  return (
    <details className="group mt-3 rounded-xl border border-border bg-card px-4 py-3">
      <summary className="cursor-pointer text-xs font-semibold text-muted-foreground select-none group-open:text-foreground">
        {title}
      </summary>
      <dl className="mt-3 space-y-2.5">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs font-semibold">{item.label}</dt>
            <dd className="mt-0.5 text-xs text-muted-foreground">{item.definition}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 border-t border-border pt-2.5 text-xs text-muted-foreground italic">
        {noTarget}
      </p>
    </details>
  )
}
