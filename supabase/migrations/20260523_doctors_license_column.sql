-- Align live Supabase with app registration (license + approval flag)

alter table public.doctors
  add column if not exists license_number text;

alter table public.doctors
  add column if not exists is_approved boolean not null default false;

update public.doctors
set is_approved = true
where status = 'approved' and is_approved = false;

comment on column public.doctors.license_number is
  'Medical license identifier submitted at registration.';
