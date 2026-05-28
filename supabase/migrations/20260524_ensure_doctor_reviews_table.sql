-- Safety net when the initial migration was not applied to a remote project.
create table if not exists public.doctor_reviews (
  id bigserial primary key,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  review_text text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (doctor_id, patient_id)
);

alter table public.doctor_reviews enable row level security;
