-- Pengaturan sertifikat tingkat perusahaan, dan lapisan "ikut pengaturan
-- utama" untuk setiap kursus.
--
-- Sebelum ini setiap kursus harus mengisi sendiri nama penanda tangan,
-- jabatan, dan gambar tanda tangannya. Untuk kursus perusahaan sendiri itu
-- pekerjaan berulang yang sama persis setiap kali, dan setiap salinan adalah
-- satu kesempatan salah ketik. Saat bekerja sama dengan perusahaan lain,
-- barulah kursus perlu penanda tangan sendiri.
--
-- Karena itu: NULL pada kolom kursus berarti "ikut pengaturan utama", bukan
-- "kosongkan". Kursus yang memang ingin berbeda cukup mengisinya.

create table if not exists public.certificate_defaults (
  id boolean primary key default true check (id),
  certificate_type text not null default 'completion'
    check (certificate_type in ('completion', 'participation', 'achievement', 'custom')),
  custom_title text,
  description text,
  signature_url text,
  signer_name text,
  signer_title text,
  additional_text text,
  template_url text,
  layout text not null default 'klasik'
    check (layout in ('klasik', 'modern', 'formal')),
  updated_at timestamptz not null default now()
);

-- Ditulis terpisah supaya berkas ini tetap aman dijalankan ulang pada basis
-- data yang sudah memakai versi sebelumnya.
alter table public.certificate_defaults
  add column if not exists layout text not null default 'klasik';

alter table public.certificate_defaults
  drop constraint if exists certificate_defaults_layout_check;
alter table public.certificate_defaults
  add constraint certificate_defaults_layout_check
  check (layout in ('klasik', 'modern', 'formal'));

alter table public.certificate_defaults enable row level security;

-- Dibaca anon dan authenticated dengan sengaja. Penerbitan sertifikat
-- (lib/certificates.ts) membaca pengaturan memakai klien milik PESERTA, jadi
-- kalau tabel ini hanya bisa dibaca pengelola, setiap sertifikat yang
-- mewarisi pengaturan utama akan terbit tanpa penanda tangan. Isinya memang
-- tampil di muka sertifikat yang dibagikan, jadi tidak ada yang rahasia.
drop policy if exists "public can read certificate defaults" on public.certificate_defaults;
create policy "public can read certificate defaults" on public.certificate_defaults
  for select to anon, authenticated
  using (true);

-- Hanya superadmin yang boleh mengubah. Ini wajah perusahaan di dokumen
-- resmi; mentor mengatur sertifikat kursusnya sendiri, bukan milik semua
-- orang. docs/STANDAR-PERAN.md §2.
drop policy if exists "superadmins can insert certificate defaults" on public.certificate_defaults;
create policy "superadmins can insert certificate defaults" on public.certificate_defaults
  for insert to authenticated
  with check (public.is_superadmin());

drop policy if exists "superadmins can update certificate defaults" on public.certificate_defaults;
create policy "superadmins can update certificate defaults" on public.certificate_defaults
  for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

grant select on public.certificate_defaults to anon, authenticated;
grant insert, update on public.certificate_defaults to authenticated;

insert into public.certificate_defaults (id) values (true) on conflict (id) do nothing;

-- NULL kini berarti "ikut pengaturan utama". Kolomnya semula not null dengan
-- bawaan 'completion', jadi baris yang sudah ada tetap 'completion' secara
-- eksplisit -- tidak ada kursus yang berubah perilakunya karena migrasi ini.
alter table public.course_certificate_settings
  alter column certificate_type drop not null,
  alter column certificate_type drop default;

-- NULL = ikut pengaturan utama, sama seperti ruas sertifikat lainnya.
alter table public.course_certificate_settings
  add column if not exists layout text;

alter table public.course_certificate_settings
  drop constraint if exists course_certificate_settings_layout_check;
alter table public.course_certificate_settings
  add constraint course_certificate_settings_layout_check
  check (layout is null or layout in ('klasik', 'modern', 'formal'));
