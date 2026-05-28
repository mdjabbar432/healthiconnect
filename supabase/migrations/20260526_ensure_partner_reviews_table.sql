-- Safety net when the partner review table is missing in a remote project.
create table if not exists public.partner_reviews (
  id bigserial primary key,
  partner_id bigint not null references public.partners(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  review_text text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (partner_id, patient_id)
);

alter table public.partner_reviews enable row level security;
