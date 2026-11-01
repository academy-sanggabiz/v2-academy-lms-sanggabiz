-- Bank soal: soal yang sudah ditulis bisa dipakai lagi di kuis lain.
--
-- Keputusan rancangan yang paling menentukan: soal dari bank **disalin** ke
-- kuis, bukan dirujuk.
--
-- Merujuk terlihat lebih rapi -- satu soal, banyak kuis, sekali perbaiki
-- selesai. Tetapi soal yang dirujuk berarti menyunting satu soal mengubah
-- kuis yang sudah dikerjakan orang. Jawaban peserta tersimpan sebagai
-- `quiz_responses` yang menunjuk `question_options`; mengubah soalnya
-- membuat riwayat penilaian bercerita hal yang berbeda dari yang sebenarnya
-- dikerjakan peserta, dan nilai lama jadi tidak bisa dipertanggungjawabkan.
--
-- Menyalin membuat tiap kuis berdiri sendiri. Harganya: memperbaiki salah
-- ketik di bank tidak ikut memperbaiki salinan yang sudah terlanjur dipakai.
-- Itu harga yang jauh lebih murah daripada riwayat nilai yang berubah
-- sendiri.

create table if not exists public.question_bank_items (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  type public.question_type not null,
  prompt text not null,
  points int not null default 1,
  allow_multiple boolean not null default false,
  case_sensitive boolean not null default false,
  explanation text not null default '' check (char_length(explanation) <= 5000),
  -- Label bebas untuk menyaring. Tanpa ini bank berisi 300 soal hanya bisa
  -- ditelusuri dengan menggulir, dan fitur pakai-ulangnya jadi sia-sia.
  tags text[] not null default '{}',
  /** Dari kursus mana soal ini berasal, sekadar sebagai jejak asal. Sengaja
      `on delete set null`: menghapus kursus tidak boleh ikut menghapus soal
      yang sudah masuk bank. */
  source_course_id uuid references public.courses (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.question_bank_options (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.question_bank_items (id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  match_key text,
  position int not null default 0
);

create index if not exists question_bank_items_created_by_idx
  on public.question_bank_items (created_by);
create index if not exists question_bank_options_item_idx
  on public.question_bank_options (item_id);

alter table public.question_bank_items enable row level security;
alter table public.question_bank_options enable row level security;

-- Bank adalah milik penulisnya; superadmin melihat semuanya, sejalan dengan
-- perannya yang memang bisa membantu mentor mengelola kursusnya
-- (docs/STANDAR-PERAN.md §2). Peserta tidak pernah menyentuh tabel ini:
-- soal yang dikerjakan peserta selalu salinan di `questions`.
create or replace function public.owns_bank_item(item uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.question_bank_items i
    where i.id = item
      and (i.created_by = (select auth.uid()) or public.is_superadmin())
  );
$$;

drop policy if exists "authors read own bank items" on public.question_bank_items;
create policy "authors read own bank items" on public.question_bank_items
  for select to authenticated
  using (created_by = (select auth.uid()) or public.is_superadmin());

drop policy if exists "authors insert own bank items" on public.question_bank_items;
create policy "authors insert own bank items" on public.question_bank_items
  for insert to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists "authors update own bank items" on public.question_bank_items;
create policy "authors update own bank items" on public.question_bank_items
  for update to authenticated
  using (created_by = (select auth.uid()) or public.is_superadmin())
  with check (created_by = (select auth.uid()) or public.is_superadmin());

drop policy if exists "authors delete own bank items" on public.question_bank_items;
create policy "authors delete own bank items" on public.question_bank_items
  for delete to authenticated
  using (created_by = (select auth.uid()) or public.is_superadmin());

drop policy if exists "authors read own bank options" on public.question_bank_options;
create policy "authors read own bank options" on public.question_bank_options
  for select to authenticated
  using (public.owns_bank_item(item_id));

drop policy if exists "authors insert own bank options" on public.question_bank_options;
create policy "authors insert own bank options" on public.question_bank_options
  for insert to authenticated
  with check (public.owns_bank_item(item_id));

drop policy if exists "authors update own bank options" on public.question_bank_options;
create policy "authors update own bank options" on public.question_bank_options
  for update to authenticated
  using (public.owns_bank_item(item_id))
  with check (public.owns_bank_item(item_id));

drop policy if exists "authors delete own bank options" on public.question_bank_options;
create policy "authors delete own bank options" on public.question_bank_options
  for delete to authenticated
  using (public.owns_bank_item(item_id));

revoke all on function public.owns_bank_item(uuid) from public, anon;
grant execute on function public.owns_bank_item(uuid) to authenticated;

grant select, insert, update, delete on public.question_bank_items to authenticated;
grant select, insert, update, delete on public.question_bank_options to authenticated;
