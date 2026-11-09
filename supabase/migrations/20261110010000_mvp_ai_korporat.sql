-- MVP LMS korporat: struktur organisasi, jalur kursus per jabatan, dan
-- penyimpanan hasil AI.
--
-- SELURUHNYA PENAMBAHAN. Tidak satu pun tabel, kolom, policy, atau grant yang
-- sudah ada diubah atau dicabut. Fitur v2 yang berjalan hari ini tidak
-- menyentuh apa pun di berkas ini.
--
-- Satu catatan yang paling mudah terlewat: `profiles` mendapat tiga kolom
-- baru, dan `grant update (...)` yang ada di migrasi 20261101060000 menyebut
-- kolomnya satu per satu. Karena itu peserta TIDAK otomatis boleh mengubah
-- jabatannya sendiri -- dan berkas ini sengaja tidak menerbitkan grant update
-- baru apa pun pada `profiles`. Menambahkan `grant update on public.profiles`
-- tanpa daftar kolom akan membuka seluruh tabel, termasuk `role`.

-- ============================================================
-- 1. Struktur organisasi (F6)
-- ============================================================
--
-- Satu perusahaan per instalasi (keputusan pemilik, 10 Nov 2026), jadi tidak
-- ada kolom `company_id` di mana pun. Multi-perusahaan masuk daftar "setelah
-- MVP"; menambahkannya nanti berarti satu kolom di dua tabel ini, bukan
-- pembongkaran.

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists departments_name_unik
  on public.departments (lower(name));

create table if not exists public.job_titles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references public.departments (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists job_titles_name_unik
  on public.job_titles (lower(name));

-- `on delete set null` di kedua kolom: menghapus satu jabatan tidak boleh
-- menghapus orangnya. Pola yang sama dengan `courses.category_id`.
alter table public.profiles
  add column if not exists job_title_id uuid references public.job_titles (id) on delete set null,
  add column if not exists department_id uuid references public.departments (id) on delete set null,
  -- ID karyawan di sistem HRIS perusahaan. Unik supaya API integrasi (F2)
  -- bisa memperbarui orang yang sama tanpa menebak lewat email -- email
  -- karyawan berubah, nomor induknya tidak.
  add column if not exists external_id text;

create unique index if not exists profiles_external_id_unik
  on public.profiles (external_id) where external_id is not null;

comment on column public.profiles.job_title_id is
  'Jabatan. Menentukan kursus wajib dan disarankan (F6). Diisi pengelola atau API, tidak pernah oleh peserta sendiri.';
comment on column public.profiles.department_id is
  'Departemen. Dipakai laporan agregat per departemen (F3), tidak pernah untuk memeringkat orang.';

alter table public.departments enable row level security;
alter table public.job_titles enable row level security;

-- Dibaca semua yang sudah masuk, bukan hanya pengelola: peserta harus melihat
-- nama jabatannya sendiri di dasbor ("Wajib untuk Staf Gudang"). Isinya nama
-- jabatan dan departemen, bukan data pribadi siapa pun.
drop policy if exists "pengguna membaca departemen" on public.departments;
create policy "pengguna membaca departemen" on public.departments
  for select to authenticated using (true);

drop policy if exists "superadmin mengelola departemen" on public.departments;
create policy "superadmin mengelola departemen" on public.departments
  for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

drop policy if exists "pengguna membaca jabatan" on public.job_titles;
create policy "pengguna membaca jabatan" on public.job_titles
  for select to authenticated using (true);

drop policy if exists "superadmin mengelola jabatan" on public.job_titles;
create policy "superadmin mengelola jabatan" on public.job_titles
  for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

-- ============================================================
-- 2. Kursus per jabatan (F6)
-- ============================================================

do $$ begin
  create type public.job_course_requirement as enum ('wajib', 'disarankan');
exception when duplicate_object then null; end $$;

create table if not exists public.job_title_courses (
  id uuid primary key default gen_random_uuid(),
  job_title_id uuid not null references public.job_titles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  requirement public.job_course_requirement not null default 'wajib',
  -- Hari sejak orang itu terdaftar, bukan tanggal tetap: satu jalur dipakai
  -- karyawan yang masuk di bulan berbeda.
  due_days integer check (due_days is null or due_days > 0),
  position integer not null default 0,
  -- Mendaftarkan sendiri saat jabatan diberikan. Bawaannya mati: mendaftarkan
  -- orang ke kursus tanpa diminta adalah keputusan pemilik, bukan bawaan.
  auto_enroll boolean not null default false,
  created_at timestamptz not null default now(),
  unique (job_title_id, course_id)
);

alter table public.job_title_courses enable row level security;

-- Peserta perlu membacanya untuk kartu "Untuk jabatan Anda". Isinya pasangan
-- jabatan-kursus; kursus yang tidak boleh ia lihat tetap tersaring oleh
-- `can_read_course()` saat kursusnya sendiri dibaca.
drop policy if exists "pengguna membaca jalur jabatan" on public.job_title_courses;
create policy "pengguna membaca jalur jabatan" on public.job_title_courses
  for select to authenticated using (true);

drop policy if exists "superadmin mengelola jalur jabatan" on public.job_title_courses;
create policy "superadmin mengelola jalur jabatan" on public.job_title_courses
  for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

-- Tenggat per pendaftaran, dihitung saat didaftarkan. Hanya ditampilkan --
-- tidak memengaruhi nilai, kelulusan, atau penerbitan sertifikat.
alter table public.enrollments
  add column if not exists due_at timestamptz,
  add column if not exists source text;

comment on column public.enrollments.due_at is
  'Tenggat tampilan dari jalur jabatan. Tidak memengaruhi nilai maupun sertifikat.';
comment on column public.enrollments.source is
  'Asal pendaftaran: null (seperti sebelumnya), ''jabatan'', atau ''api''.';

-- ============================================================
-- 3. Penyimpanan hasil AI (F1, F3, F4, F5) dan pemakaiannya
-- ============================================================

-- Catatan pemakaian. Dasar batas harian per orang dan satu-satunya tempat
-- biaya bisa dihitung. Tidak menyimpan isi prompt: yang dibutuhkan jumlahnya,
-- dan menyimpan isi berarti menyimpan pertanyaan pribadi peserta dua kali.
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feature text not null,
  tokens integer not null default 0,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_hari_idx
  on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

-- Tidak ada policy insert untuk siapa pun: barisnya hanya ditulis server
-- action lewat service role, seperti `notifications` yang hanya ditulis
-- trigger. Pemiliknya boleh membacanya supaya layar bisa memberi tahu sisa
-- jatah harian.
drop policy if exists "orang membaca pemakaian ai sendiri" on public.ai_usage;
create policy "orang membaca pemakaian ai sendiri" on public.ai_usage
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "superadmin membaca pemakaian ai" on public.ai_usage;
create policy "superadmin membaca pemakaian ai" on public.ai_usage
  for select to authenticated using (public.is_superadmin());

-- Pembahasan kuis (F5). Kunci utamanya attempt_id, bukan id sendiri: satu
-- percobaan hanya punya satu pembahasan, dan itu yang membuat membuka ulang
-- hasil tidak memanggil AI lagi.
create table if not exists public.ai_quiz_feedback (
  attempt_id uuid primary key references public.quiz_attempts (id) on delete cascade,
  items jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

alter table public.ai_quiz_feedback enable row level security;

drop policy if exists "pemilik percobaan membaca pembahasan" on public.ai_quiz_feedback;
create policy "pemilik percobaan membaca pembahasan" on public.ai_quiz_feedback
  for select to authenticated
  using (exists (
    select 1 from public.quiz_attempts qa
    where qa.id = ai_quiz_feedback.attempt_id and qa.learner_id = auth.uid()
  ));

-- Percakapan asisten (F4). Privat seperti `lesson_notes`, dan dengan alasan
-- yang sama: ini bahan belajar pribadi, bukan bukti penilaian. Keputusan
-- pemilik 10 Nov 2026: HR tidak boleh membacanya. Karena itu TIDAK ADA policy
-- baca untuk pengelola maupun superadmin -- menambahkannya nanti adalah
-- keputusan produk dan privasi, bukan penyesuaian teknis.
create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_learner_lesson_idx
  on public.ai_chat_messages (learner_id, lesson_id, created_at);

alter table public.ai_chat_messages enable row level security;

drop policy if exists "orang membaca percakapannya sendiri" on public.ai_chat_messages;
create policy "orang membaca percakapannya sendiri" on public.ai_chat_messages
  for select to authenticated using (learner_id = auth.uid());

drop policy if exists "orang menghapus percakapannya sendiri" on public.ai_chat_messages;
create policy "orang menghapus percakapannya sendiri" on public.ai_chat_messages
  for delete to authenticated using (learner_id = auth.uid());

-- Ringkasan laporan (F3). Hanya superadmin, sama dengan layar yang menampilkannya.
create table if not exists public.ai_report_summaries (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  summary text not null,
  -- Angka yang dipakai saat ringkasan dibuat, supaya bisa diperiksa ulang
  -- apakah ringkasannya masih cocok dengan keadaan sekarang.
  figures jsonb,
  model text,
  created_at timestamptz not null default now()
);

alter table public.ai_report_summaries enable row level security;

drop policy if exists "superadmin membaca ringkasan laporan" on public.ai_report_summaries;
create policy "superadmin membaca ringkasan laporan" on public.ai_report_summaries
  for select to authenticated using (public.is_superadmin());

-- Pembuatan kursus dari dokumen (F1).
create table if not exists public.ai_course_generations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  source_name text,
  context jsonb,
  outline jsonb,
  markdown text,
  status text not null default 'draft',
  model text,
  created_at timestamptz not null default now()
);

alter table public.ai_course_generations enable row level security;

drop policy if exists "pembuat membaca generasi kursusnya" on public.ai_course_generations;
create policy "pembuat membaca generasi kursusnya" on public.ai_course_generations
  for select to authenticated
  using (created_by = auth.uid() or public.is_superadmin());

-- ============================================================
-- 4. Integrasi: kunci API dan webhook (F2)
-- ============================================================

create table if not exists public.integration_api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Delapan aksara pertama, untuk dikenali di layar. Kunci penuhnya hanya
  -- pernah ditampilkan sekali, saat dibuat.
  prefix text not null,
  -- SHA-256 dari kunci penuh. Tidak pernah ada kunci polos di basis data --
  -- aturan yang sama dengan kata sandi.
  key_hash text not null unique,
  scopes text[] not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  -- Rahasia penanda tangan HMAC. Penerima memakainya untuk membuktikan
  -- kiriman benar dari LMS ini dan bukan dari orang lain yang menebak URL-nya.
  secret text not null,
  events text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.webhook_endpoints (id) on delete cascade,
  event text not null,
  payload jsonb not null,
  status_code integer,
  error text,
  attempt integer not null default 1,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists webhook_deliveries_waktu_idx
  on public.webhook_deliveries (created_at desc);

alter table public.integration_api_keys enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;

-- Ketiganya: hanya superadmin, dan tidak ada akses anon sama sekali. Rute
-- /api/v1/* memvalidasi kuncinya lebih dulu lalu bekerja dengan service role
-- -- jadi tidak ada satu pun jalur tempat anon menyentuh tabel ini.
drop policy if exists "superadmin mengelola kunci api" on public.integration_api_keys;
create policy "superadmin mengelola kunci api" on public.integration_api_keys
  for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

drop policy if exists "superadmin mengelola webhook" on public.webhook_endpoints;
create policy "superadmin mengelola webhook" on public.webhook_endpoints
  for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

drop policy if exists "superadmin membaca log webhook" on public.webhook_deliveries;
create policy "superadmin membaca log webhook" on public.webhook_deliveries
  for select to authenticated using (public.is_superadmin());
