import { readFileSync, writeFileSync } from "node:fs"
import { bersihkanMateriInteraktif } from "@/lib/sanitize-interactive"
for (const n of process.argv.slice(2)) {
  const h = bersihkanMateriInteraktif(readFileSync(`/tmp/kursus/${n}.html`, "utf8"))
  writeFileSync(`/tmp/kursus/${n}.bersih.html`, h.html)
  console.log(`${n}: dibuang=[${h.dibuang.join(", ") || "tidak ada"}] peringatan=[${h.peringatan.filter(p=>!/diarahkan ke kotak materi/.test(p)).join(" | ") || "tidak ada"}] ${h.html.length} karakter`)
}
