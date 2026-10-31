-- Dua pemberitahuan terakhir yang masih berbahasa Inggris.
--
-- Teks notifikasi ditulis oleh trigger, bukan oleh aplikasi, jadi penerjemahan
-- UI di sisi React tidak pernah menyentuhnya. 20261028100000 sudah
-- menerjemahkan notifikasi pendaftaran; dua ini terlewat, dan peserta demo
-- melihat "Your certificate is ready" di tengah layar berbahasa Indonesia.

create or replace function public.notify_on_certificate_issued()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  select
    e.learner_id,
    'certificate',
    'Sertifikat Anda sudah terbit',
    c.title,
    '/learner/profile?tab=certificates'
  from public.enrollments e
  join public.courses c on c.id = e.course_id
  where e.id = new.enrollment_id;

  return new;
end;
$$;

create or replace function public.notify_on_course_feedback()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  select
    c.created_by,
    'course_feedback',
    'Ulasan baru dari peserta',
    coalesce(nullif(p.full_name, ''), p.email, 'Seorang peserta')
      || ' memberi nilai ' || new.rating || '/5 untuk ' || c.title,
    '/admin/courses/preview/' || c.id
  from public.courses c
  join public.profiles p on p.id = new.learner_id
  where c.id = new.course_id;

  return new;
end;
$$;

-- Baris lama tetap berbahasa Inggris di riwayat peserta kalau tidak ikut
-- diperbarui. Judulnya pasti, jadi aman dicocokkan persis.
update public.notifications
set title = 'Sertifikat Anda sudah terbit'
where type = 'certificate' and title = 'Your certificate is ready';

update public.notifications
set title = 'Ulasan baru dari peserta'
where type = 'course_feedback' and title = 'New course feedback received';
