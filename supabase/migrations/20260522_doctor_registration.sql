-- Doctor registration (B.1): approval flag and directory specialty alignment

alter table public.doctors
  add column if not exists is_approved boolean not null default false;

-- Keep is_approved in sync with legacy status for existing rows
update public.doctors
set is_approved = true
where status = 'approved' and is_approved = false;

insert into public.specialties (name)
values
  ('Cardiology'),
  ('Pediatrics'),
  ('Dental'),
  ('Neurology'),
  ('Orthopedics'),
  ('Dermatology'),
  ('Ophthalmology'),
  ('Psychiatry')
on conflict (name) do nothing;

comment on column public.doctors.is_approved is
  'When false, doctor profile is hidden from public directory until admin approval.';
