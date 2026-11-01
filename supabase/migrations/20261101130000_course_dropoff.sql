-- Di bagian mana peserta berhenti melanjutkan.
--
-- Dasar hukumnya sama dengan wawasan belajar yang sudah ada: UU PDP 27/2022
-- Pasal 20 ayat (2) huruf b. Fungsi ini hanya MEMBACA ULANG `lesson_progress`
-- dan `enrollments` -- penyelesaian pelajaran memang harus dicatat untuk
-- menyampaikan kursus. Tidak ada satu kolom baru pun yang dikumpulkan.
--
-- Yang TIDAK ada di sini, dan sengaja: berapa lama seseorang membuka suatu
-- halaman, jam berapa ia belajar, dan apa yang sedang ia buka sekarang.
-- Ketiganya pengamatan perilaku, bukan penyampaian materi, jadi dasarnya
-- huruf a -- persetujuan eksplisit yang harus diminta SEBELUM data
-- dikumpulkan. docs/STANDAR-PELACAKAN.md §4.
--
-- Pertanyaan "di bagian mana orang paling banyak berhenti" ternyata bisa
-- dijawab penuh tanpa data itu, karena jawabannya ada pada pelajaran terjauh
-- yang diselesaikan seseorang -- yang sudah tercatat sejak awal.

create or replace function public.admin_course_dropoff(p_course_id uuid)
returns table (
  step_no int,
  lesson_id uuid,
  lesson_title text,
  section_title text,
  content_type text,
  completed int,
  stalled int,
  completed_pct int,
  total_learners int,
  not_started int
)
language sql
security definer
set search_path = ''
stable
as $$
  with ordered as (
    select
      l.id,
      l.title,
      cs.title as section_title,
      l.content_type::text as content_type,
      row_number() over (order by cs.position, l.position)::int as step_no
    from public.lessons l
    join public.course_sections cs on cs.id = l.section_id
    where cs.course_id = p_course_id
  ),
  learners as (
    select e.id, e.status
    from public.enrollments e
    where e.course_id = p_course_id
  ),
  -- Pelajaran terjauh yang diselesaikan tiap peserta. Dipakai, bukan sekadar
  -- "pelajaran terakhir yang disentuh", karena dengan navigasi bebas peserta
  -- bisa melompat: yang menandai sejauh mana ia sampai adalah titik terjauh.
  furthest as (
    select lp.enrollment_id, max(o.step_no) as step_no
    from public.lesson_progress lp
    join ordered o on o.id = lp.lesson_id
    where lp.completed
    group by lp.enrollment_id
  ),
  totals as (
    select
      (select count(*) from learners)::int as total_learners,
      -- Peserta yang belum menyelesaikan satu pelajaran pun. Ditampilkan
      -- terpisah: "berhenti di pelajaran 1" dan "belum pernah mulai" adalah
      -- dua masalah berbeda dengan dua penanganan berbeda.
      (select count(*) from learners le
        where not exists (select 1 from furthest f where f.enrollment_id = le.id))::int as not_started
  )
  select
    o.step_no,
    o.id as lesson_id,
    o.title as lesson_title,
    o.section_title,
    o.content_type,
    (select count(*)
       from public.lesson_progress lp
       where lp.lesson_id = o.id and lp.completed)::int as completed,
    -- Berhenti TEPAT di sini: titik terjauhnya pelajaran ini, dan kursusnya
    -- belum selesai. Inilah angka yang menjawab pertanyaannya; `completed`
    -- saja hanya menunjukkan corong yang menurun tanpa mengatakan di mana
    -- orang berhenti.
    (select count(*)
       from furthest f
       join learners le on le.id = f.enrollment_id
       where f.step_no = o.step_no and le.status <> 'completed')::int as stalled,
    case when t.total_learners = 0 then null
         else round(100.0 * (select count(*) from public.lesson_progress lp
                              where lp.lesson_id = o.id and lp.completed) / t.total_learners)::int
    end as completed_pct,
    t.total_learners,
    t.not_started
  from ordered o
  cross join totals t
  where public.owns_course(p_course_id)
  order by o.step_no;
$$;

revoke all on function public.admin_course_dropoff(uuid) from public, anon;
grant execute on function public.admin_course_dropoff(uuid) to authenticated;
