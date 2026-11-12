-- Webhook: kejadian diantrekan oleh basis data, dikirim oleh aplikasi.
--
-- == Kenapa antrean, bukan kirim langsung ==
--
-- Postgres di proyek ini tidak punya `pg_net` maupun `http`, jadi trigger
-- tidak bisa memanggil URL sendiri. Tetapi memindahkan pengirimannya ke kode
-- aplikasi saja juga salah: pendaftaran dibuat lewat TIGA jalur berbeda
-- (peserta mendaftar sendiri, pengelola lewat layar peserta, pengelola lewat
-- tab Peserta di kursus), persis alasan `notify_on_enrollment` dibuat sebagai
-- trigger dan bukan dipanggil dari ketiganya. Memanggil webhook dari kode
-- berarti menambah jalur keempat yang bisa dilupakan.
--
-- Jadi: trigger MENCATAT kejadian ke `webhook_deliveries` dengan
-- `delivered_at` null, dan satu rute terjadwal yang mengirimkannya. Satu
-- kejadian tidak akan hilang hanya karena jaringan penerima sedang mati, dan
-- percobaan ulang jadi hal yang wajar, bukan tambalan.
--
-- == Trigger tidak boleh menjatuhkan pendaftaran ==
--
-- Ini aturan yang paling penting di berkas ini. Seluruh badan tiap trigger
-- dibungkus `exception when others then null`: masalah pada webhook -- tabel
-- terkunci, baris cacat, apa pun -- TIDAK BOLEH membuat seorang peserta gagal
-- mendaftar atau gagal menerima sertifikat. Webhook adalah kabar keluar, dan
-- kabar yang gagal terkirim tidak sepadan dengan transaksi yang dibatalkan.
--
-- Seluruhnya penambahan: dua kolom, satu indeks, tiga trigger pada tabel yang
-- belum punya trigger webhook apa pun.

-- ============================================================
-- 1. Kolom yang dibutuhkan pengirim
-- ============================================================

alter table public.webhook_endpoints
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists description text;

alter table public.webhook_deliveries
  add column if not exists next_attempt_at timestamptz not null default now();

comment on column public.webhook_deliveries.next_attempt_at is
  'Kapan baris ini boleh dicoba kirim lagi. Mundur makin jauh tiap kegagalan.';

-- Pengirim menanyakan hal yang sama berulang kali: yang belum terkirim dan
-- sudah waktunya dicoba. Indeks parsial supaya jejak kirim yang sudah berhasil
-- -- bagian yang akan terus tumbuh -- tidak ikut dipindai.
create index if not exists webhook_deliveries_tertunda_idx
  on public.webhook_deliveries (next_attempt_at)
  where delivered_at is null;

-- ============================================================
-- 2. Satu fungsi pengantre untuk semua kejadian
-- ============================================================

create or replace function public.antre_webhook(p_event text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.webhook_deliveries (endpoint_id, event, payload, attempt, next_attempt_at)
  select e.id, p_event, p_payload, 0, now()
  from public.webhook_endpoints e
  where e.active and p_event = any (e.events);
exception when others then
  -- Sengaja ditelan. Lihat catatan di kepala berkas: kabar keluar tidak
  -- sepadan dengan membatalkan pendaftaran orang.
  null;
end;
$$;

-- ============================================================
-- 3. Tiga kejadian
-- ============================================================

create or replace function public.webhook_pendaftaran_baru()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_payload jsonb;
begin
  select jsonb_build_object(
    'enrollmentId', new.id,
    'learnerId', new.learner_id,
    'learnerName', p.full_name,
    'learnerEmail', p.email,
    'courseId', new.course_id,
    'courseTitle', c.title,
    'enrolledAt', new.enrolled_at
  ) into v_payload
  from public.profiles p, public.courses c
  where p.id = new.learner_id and c.id = new.course_id;

  perform public.antre_webhook('enrollment.created', v_payload);
  return null;
exception when others then
  return null;
end;
$$;

create or replace function public.webhook_kursus_selesai()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_payload jsonb;
begin
  -- Hanya saat BERUBAH menjadi completed. Tanpa syarat ini, setiap penulisan
  -- ulang baris yang sudah completed mengirim kabar yang sama lagi.
  if new.status is distinct from 'completed' or old.status = 'completed' then
    return null;
  end if;

  select jsonb_build_object(
    'enrollmentId', new.id,
    'learnerId', new.learner_id,
    'learnerName', p.full_name,
    'learnerEmail', p.email,
    'courseId', new.course_id,
    'courseTitle', c.title,
    'completedAt', new.completed_at
  ) into v_payload
  from public.profiles p, public.courses c
  where p.id = new.learner_id and c.id = new.course_id;

  perform public.antre_webhook('course.completed', v_payload);
  return null;
exception when others then
  return null;
end;
$$;

create or replace function public.webhook_sertifikat_terbit()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_payload jsonb;
begin
  select jsonb_build_object(
    'certificateId', new.id,
    'serial', new.serial,
    'enrollmentId', new.enrollment_id,
    'learnerId', e.learner_id,
    'learnerName', p.full_name,
    'learnerEmail', p.email,
    'courseId', e.course_id,
    'courseTitle', c.title,
    'issuedAt', new.issued_at
  ) into v_payload
  from public.enrollments e
  join public.profiles p on p.id = e.learner_id
  join public.courses c on c.id = e.course_id
  where e.id = new.enrollment_id;

  perform public.antre_webhook('certificate.issued', v_payload);
  return null;
exception when others then
  return null;
end;
$$;

drop trigger if exists webhook_pendaftaran_baru_trg on public.enrollments;
create trigger webhook_pendaftaran_baru_trg
  after insert on public.enrollments
  for each row execute function public.webhook_pendaftaran_baru();

drop trigger if exists webhook_kursus_selesai_trg on public.enrollments;
create trigger webhook_kursus_selesai_trg
  after update of status on public.enrollments
  for each row execute function public.webhook_kursus_selesai();

drop trigger if exists webhook_sertifikat_terbit_trg on public.certificates;
create trigger webhook_sertifikat_terbit_trg
  after insert on public.certificates
  for each row execute function public.webhook_sertifikat_terbit();
