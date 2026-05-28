-- Optional anonymous display + patient read access for own reviews (A.4)
alter table public.doctor_reviews
  add column if not exists is_anonymous boolean not null default false;

drop policy if exists patient_select_own_doctor_reviews on public.doctor_reviews;

create policy patient_select_own_doctor_reviews on public.doctor_reviews
for select using (patient_id = auth.uid());
