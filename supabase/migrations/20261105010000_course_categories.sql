-- Kategori kursus.
--
-- Satu-satunya saringan yang orang harapkan ada di sebuah katalog tetapi
-- belum bisa dibuat: tingkat, akses, dan durasi semuanya sudah punya kolom,
-- sedangkan "ini kursus tentang apa" tidak pernah punya tempat penyimpanan.
--
-- Bentuknya meniru `instructors`, bukan tabel milik satu admin: kategori
-- adalah daftar bersama yang dipakai lintas kursus dan lintas penyusun, jadi
-- ia bisa dibaca siapa saja (katalog publik membutuhkannya) dan ditulis
-- siapa pun yang berwenang menyusun kursus.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Dipakai di alamat URL katalog (?kategori=pemrograman) supaya tautan hasil
  -- saringan tetap terbaca orang dan tidak berubah ketika namanya disunting.
  slug text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists categories_slug_key on public.categories (lower(slug));
create unique index if not exists categories_name_key on public.categories (lower(name));

alter table public.courses
  add column if not exists category_id uuid references public.categories (id) on delete set null;

create index if not exists courses_category_idx on public.courses (category_id);

alter table public.categories enable row level security;

-- Nama kategori adalah materi pemasaran, sama seperti judul kursus dan bio
-- instruktur -- terbuka untuk dibaca siapa pun, termasuk pengunjung katalog
-- yang belum punya akun.
drop policy if exists "categories are readable" on public.categories;
create policy "categories are readable" on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "admins can insert categories" on public.categories;
create policy "admins can insert categories" on public.categories
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "admins can update categories" on public.categories;
create policy "admins can update categories" on public.categories
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins can delete categories" on public.categories;
create policy "admins can delete categories" on public.categories
  for delete to authenticated
  using (public.is_admin());

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

comment on table public.categories is
  'Daftar kategori kursus bersama (lihat instructors untuk pola yang sama). Dibaca publik untuk katalog /kelas; ditulis admin mana pun.';
