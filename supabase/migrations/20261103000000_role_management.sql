-- Mengangkat peserta menjadi mentor, dan mencatat siapa mengangkat siapa.
--
-- Sebelum ini satu-satunya cara membuat mentor adalah menjalankan SQL
-- langsung. Itu berarti setiap orang baru yang mau jadi mentor menunggu
-- seseorang yang punya akses basis data -- dan perubahannya tidak tercatat
-- di mana pun.
--
-- KENAPA LEWAT FUNGSI, BUKAN POLICY
--
-- Kolom `profiles.role` sengaja TIDAK bisa ditulis pengguna biasa; sudah
-- diuji, peserta yang mencoba menaikkan perannya sendiri lewat REST ditolak
-- 42501. Melonggarkan itu dengan policy UPDATE akan membuka celah naik-peran
-- yang sekarang tertutup rapat. Fungsi SECURITY DEFINER di bawah adalah satu
-- pintu sempit yang memeriksa kewenangan di dalamnya, sehingga kolomnya tetap
-- tidak bisa disentuh lewat jalur lain mana pun.

-- -----------------------------------------------------------------------------
-- 1. Jejak perubahan peran -- hanya bertambah
-- -----------------------------------------------------------------------------
--
-- Mentor dan superadmin adalah posisi kepercayaan: mereka melihat data peserta
-- dan membuat kursus. Kalau suatu saat dipersoalkan, yang harus bisa
-- ditunjukkan bukan "dia sekarang mentor" melainkan "dia diangkat oleh siapa,
-- kapan, dari peran apa". Kolom di tabel profiles menghapus riwayat itu setiap
-- kali diubah.
create table if not exists public.role_changes (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references public.profiles (id) on delete cascade,
  changed_by uuid not null references public.profiles (id) on delete restrict,
  from_role public.user_role not null,
  to_role public.user_role not null,
  changed_at timestamptz not null default now()
);

create index if not exists role_changes_target_idx
  on public.role_changes (target_user_id, changed_at desc);

alter table public.role_changes enable row level security;

-- Hanya superadmin yang membacanya. Tidak ada policy INSERT, UPDATE, maupun
-- DELETE untuk siapa pun: barisnya hanya ditulis fungsi di bawah, yang
-- berjalan sebagai pemilik tabel. Jejak yang bisa disunting bukan jejak.
drop policy if exists "superadmin membaca jejak peran" on public.role_changes;
create policy "superadmin membaca jejak peran" on public.role_changes
  for select to authenticated
  using (public.is_superadmin());

grant select on public.role_changes to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Satu pintu untuk mengubah peran
-- -----------------------------------------------------------------------------
create or replace function public.set_user_role(p_user uuid, p_role public.user_role)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_aktor uuid := (select auth.uid());
  v_lama public.user_role;
  v_sisa int;
begin
  if v_aktor is null then
    raise exception 'Anda belum masuk';
  end if;

  if not public.is_superadmin() then
    raise exception 'Hanya superadmin yang dapat mengubah peran';
  end if;

  -- Mengubah peran sendiri tidak pernah diperlukan, dan sekali salah klik
  -- superadmin bisa mengunci dirinya keluar dari seluruh sistem.
  if p_user = v_aktor then
    raise exception 'Peran sendiri tidak dapat diubah dari sini';
  end if;

  select role into v_lama from public.profiles where id = p_user;
  if v_lama is null then
    raise exception 'Pengguna tidak ditemukan';
  end if;

  if v_lama = p_role then
    return jsonb_build_object('changed', false, 'role', p_role::text);
  end if;

  -- Penjaga terakhir: sistem tanpa satu pun superadmin tidak bisa dipulihkan
  -- lewat antarmuka mana pun -- hanya lewat akses basis data langsung.
  if v_lama = 'superadmin' and p_role <> 'superadmin' then
    select count(*) into v_sisa from public.profiles
      where role = 'superadmin' and id <> p_user;
    if v_sisa = 0 then
      raise exception 'Tidak bisa menurunkan superadmin terakhir';
    end if;
  end if;

  update public.profiles set role = p_role where id = p_user;

  insert into public.role_changes (target_user_id, changed_by, from_role, to_role)
  values (p_user, v_aktor, v_lama, p_role);

  return jsonb_build_object('changed', true, 'from', v_lama::text, 'to', p_role::text);
end;
$$;

revoke all on function public.set_user_role(uuid, public.user_role) from public, anon;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;
