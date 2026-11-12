-- Mengambil antrean webhook dengan jam BASIS DATA, bukan jam aplikasi.
--
-- == Bug yang diperbaiki ==
--
-- Pengirim menyaring `next_attempt_at <= <waktu>` dengan nilai yang dihitung
-- di Node. `next_attempt_at` sendiri ditulis `now()` oleh Postgres. Kedua jam
-- itu tidak pernah persis sama, dan ketika jam Node tertinggal sepersekian
-- detik, baris yang baru saja terantre LEWAT dari pengambilan pertama --
-- lalu terkirim pada pengambilan berikutnya.
--
-- Terlihat sebagai "webhook telat satu menit" yang sesekali muncul: bukan
-- kesalahan jaringan, melainkan dua jam yang dibandingkan satu sama lain.
-- Perbandingan waktu harus terjadi di tempat waktunya ditulis.
--
-- Fungsi ini juga memindahkan tiga syarat lain (belum terkirim, percobaan
-- belum habis, urutan terlama dulu) ke satu tempat, sehingga pemanggil tidak
-- bisa lupa salah satunya.

create or replace function public.webhook_antrean_siap(p_limit int default 25)
returns table (
  id uuid,
  endpoint_id uuid,
  event text,
  payload jsonb,
  attempt int
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id, d.endpoint_id, d.event, d.payload, d.attempt
  from public.webhook_deliveries d
  where d.delivered_at is null
    and d.attempt < 5
    and d.next_attempt_at <= now()
  order by d.next_attempt_at
  limit greatest(1, least(p_limit, 100));
$$;

revoke all on function public.webhook_antrean_siap(int) from public, anon, authenticated;
