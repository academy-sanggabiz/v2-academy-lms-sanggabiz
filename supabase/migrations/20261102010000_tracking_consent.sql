-- Pelacakan perilaku: persetujuan dulu, baru pengumpulan.
--
-- Dasarnya UU PDP 27/2022 Pasal 20 ayat (2) huruf a. Lama membuka halaman,
-- jam belajar, dan "sedang membuka apa" BUKAN keperluan menyampaikan kursus,
-- jadi ia tidak bisa menumpang dasar huruf b seperti `lesson_progress`.
-- Syarat minimumnya ada di docs/STANDAR-PELACAKAN.md §4, dan empat di
-- antaranya ditegakkan di sini, bukan hanya dijanjikan di layar.

-- -----------------------------------------------------------------------------
-- 1. Catatan persetujuan -- hanya bertambah, tidak pernah ditimpa
-- -----------------------------------------------------------------------------
--
-- Dibuat sebagai catatan berurut, bukan satu kolom boolean di profiles.
-- Kalau suatu saat dipersoalkan, yang harus bisa ditunjukkan bukan "sekarang
-- dia setuju" melainkan "dia menyetujui versi pemberitahuan ini, pada tanggal
-- ini, lalu menariknya pada tanggal itu". Kolom boolean menghapus riwayat itu
-- setiap kali diubah.
create table if not exists public.tracking_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  granted boolean not null,
  -- Versi teks pemberitahuan yang dibaca saat memutuskan. Pemberitahuan yang
  -- berubah berarti persetujuan lama tidak lagi mencakup yang baru.
  notice_version text not null,
  decided_at timestamptz not null default now()
);

create index if not exists tracking_consents_user_idx
  on public.tracking_consents (user_id, decided_at desc);

alter table public.tracking_consents enable row level security;

-- Peserta melihat dan menulis catatannya sendiri. Tidak ada policy UPDATE
-- maupun DELETE sama sekali: catatan persetujuan yang bisa disunting bukan
-- bukti apa-apa.
drop policy if exists "orang melihat persetujuannya sendiri" on public.tracking_consents;
create policy "orang melihat persetujuannya sendiri" on public.tracking_consents
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_superadmin());

drop policy if exists "orang mencatat keputusannya sendiri" on public.tracking_consents;
create policy "orang mencatat keputusannya sendiri" on public.tracking_consents
  for insert to authenticated
  with check (user_id = (select auth.uid()));

grant select, insert on public.tracking_consents to authenticated;

-- Keputusan terakhir seseorang. Dipakai policy di bawah dan oleh layar.
create or replace function public.has_tracking_consent(p_user uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select c.granted
       from public.tracking_consents c
      where c.user_id = p_user
      order by c.decided_at desc, c.id desc
      limit 1),
    false
  );
$$;

revoke all on function public.has_tracking_consent(uuid) from public, anon;
grant execute on function public.has_tracking_consent(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Peristiwa belajar -- hanya boleh masuk bila persetujuannya masih berlaku
-- -----------------------------------------------------------------------------
create table if not exists public.learning_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid references public.courses (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete set null,
  -- 'lesson_view' sejauh ini; disediakan sebagai teks supaya jenis baru tidak
  -- memerlukan migrasi enum.
  event_type text not null,
  -- Lama membuka, dalam detik. Dibatasi di bawah supaya tab yang ditinggal
  -- terbuka semalaman tidak tercatat sebagai dua belas jam belajar.
  duration_seconds int not null default 0
    check (duration_seconds >= 0 and duration_seconds <= 3600),
  occurred_at timestamptz not null default now()
);

create index if not exists learning_events_user_idx
  on public.learning_events (user_id, occurred_at desc);
create index if not exists learning_events_course_idx
  on public.learning_events (course_id, occurred_at desc);

alter table public.learning_events enable row level security;

-- Penegakan persetujuan ada DI SINI, bukan hanya di kode aplikasi. Rute API
-- bisa salah, lupa diperiksa, atau dilewati sama sekali; policy ini tidak.
drop policy if exists "peristiwa hanya masuk dengan persetujuan" on public.learning_events;
create policy "peristiwa hanya masuk dengan persetujuan" on public.learning_events
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.has_tracking_consent((select auth.uid()))
  );

-- Peserta berhak melihat data tentang dirinya sendiri (UU PDP Pasal 5).
drop policy if exists "orang melihat peristiwanya sendiri" on public.learning_events;
create policy "orang melihat peristiwanya sendiri" on public.learning_events
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_superadmin());

-- Menarik persetujuan harus benar-benar menghentikan pemrosesan, bukan
-- sekadar menghentikan penambahan. Peserta boleh menghapus datanya sendiri.
drop policy if exists "orang menghapus peristiwanya sendiri" on public.learning_events;
create policy "orang menghapus peristiwanya sendiri" on public.learning_events
  for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.learning_events to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Batas simpan -- ditentukan di awal, bukan "selamanya"
-- -----------------------------------------------------------------------------
--
-- Dua belas bulan. Cukup untuk membandingkan satu angkatan dengan angkatan
-- berikutnya, dan tidak lebih lama dari itu. Dijalankan terjadwal atau manual;
-- yang penting angkanya tertulis di satu tempat dan bisa diperiksa.
create or replace function public.purge_old_learning_events()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dihapus int;
begin
  delete from public.learning_events
  where occurred_at < now() - interval '12 months';
  get diagnostics v_dihapus = row_count;
  return v_dihapus;
end;
$$;

revoke all on function public.purge_old_learning_events() from public, anon, authenticated;
-- Ringkasan perilaku untuk superadmin.
--
-- Hanya membaca `learning_events`, yang isinya hanya bisa masuk bila
-- pesertanya menyetujui. Dijaga is_superadmin(): ini data perilaku per orang,
-- bukan data penyampaian kursus, jadi tidak ikut dibuka untuk mentor.
create or replace function public.admin_behavior_summary()
returns table (
  course_id uuid,
  course_title text,
  peserta int,
  total_detik bigint,
  rata_detik_per_peserta int,
  terakhir timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    c.id as course_id,
    c.title as course_title,
    count(distinct e.user_id)::int as peserta,
    sum(e.duration_seconds)::bigint as total_detik,
    (sum(e.duration_seconds) / nullif(count(distinct e.user_id), 0))::int as rata_detik_per_peserta,
    max(e.occurred_at) as terakhir
  from public.learning_events e
  join public.courses c on c.id = e.course_id
  where public.is_superadmin()
  group by c.id, c.title
  order by sum(e.duration_seconds) desc;
$$;

revoke all on function public.admin_behavior_summary() from public, anon;
grant execute on function public.admin_behavior_summary() to authenticated;

-- Berapa peserta yang menyetujui -- supaya angka di atas bisa dibaca dengan
-- jujur. "Rata-rata 40 menit" dari 3 orang yang menyetujui bukan gambaran
-- seluruh peserta, dan layarnya harus bisa mengatakannya.
create or replace function public.admin_consent_counts()
returns table (menyetujui int, menolak int, belum_memutuskan int)
language sql
security definer
set search_path = ''
stable
as $$
  with terakhir as (
    select distinct on (user_id) user_id, granted
    from public.tracking_consents
    order by user_id, decided_at desc, id desc
  )
  select
    count(*) filter (where t.granted)::int,
    count(*) filter (where t.granted is false)::int,
    (select count(*) from public.profiles p
      where p.role = 'learner'
        and not exists (select 1 from terakhir x where x.user_id = p.id))::int
  from terakhir t
  where public.is_superadmin();
$$;

revoke all on function public.admin_consent_counts() from public, anon;
grant execute on function public.admin_consent_counts() to authenticated;
