create extension if not exists "pgcrypto";

create type public.user_role as enum ('patient', 'doctor', 'agent', 'admin');
create type public.doctor_status as enum ('pending', 'approved', 'rejected');
create type public.partner_type as enum ('lab', 'pharmacy', 'radiology', 'other');
create type public.subscription_status as enum ('inactive', 'active', 'past_due', 'canceled');
create type public.commission_status as enum ('pending', 'approved', 'paid', 'void');
create type public.commission_type as enum ('first_payment', 'recurring');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table public.doctor_applications (
  id bigserial primary key,
  full_name text not null,
  email text not null,
  slug text not null unique,
  license_number text not null,
  bio text,
  credentials text,
  specialties text[] not null default '{}',
  languages text[] not null default '{}',
  city text,
  country text,
  status public.doctor_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.doctors (
  id uuid primary key references public.profiles(id) on delete cascade,
  slug text unique not null,
  email text not null,
  photo_url text,
  bio text,
  license_number text not null,
  credentials text,
  languages text[] default '{}',
  city text,
  country text,
  status public.doctor_status not null default 'pending',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.specialties (
  id bigserial primary key,
  name text unique not null
);

create table public.doctor_specialties (
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  specialty_id bigint not null references public.specialties(id) on delete restrict,
  primary key (doctor_id, specialty_id)
);

create table public.agents (
  id uuid primary key references public.profiles(id) on delete cascade,
  referral_code text unique not null,
  government_id text,
  commission_first_payment_cents int not null default 1000,
  commission_recurring_cents int not null default 500,
  created_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key references public.profiles(id) on delete cascade,
  chosen_doctor_id uuid references public.doctors(id),
  referral_agent_id uuid references public.agents(id),
  created_at timestamptz not null default now()
);

create table public.membership_plans (
  id bigserial primary key,
  name text not null,
  description text,
  price_cents int not null check (price_cents > 0),
  currency text not null default 'usd',
  interval text not null default 'month' check (interval in ('month', 'year')),
  stripe_price_id text unique not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.patient_memberships (
  id bigserial primary key,
  patient_id uuid not null references public.patients(id) on delete cascade,
  plan_id bigint not null references public.membership_plans(id),
  stripe_customer_id text not null,
  stripe_subscription_id text unique,
  status public.subscription_status not null default 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id bigserial primary key,
  patient_membership_id bigint not null references public.patient_memberships(id) on delete cascade,
  stripe_invoice_id text unique,
  stripe_payment_intent_id text unique,
  amount_cents int not null,
  currency text not null default 'usd',
  paid_at timestamptz,
  status text not null,
  created_at timestamptz not null default now()
);

create table public.referrals (
  id bigserial primary key,
  patient_id uuid not null references public.patients(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete restrict,
  referred_at timestamptz not null default now(),
  unique (patient_id)
);

create table public.commission_payouts (
  id bigserial primary key,
  agent_id uuid not null references public.agents(id) on delete cascade,
  total_cents int not null check (total_cents >= 0),
  period_start date not null,
  period_end date not null,
  paid_at timestamptz,
  notes text
);

create table public.commissions (
  id bigserial primary key,
  agent_id uuid not null references public.agents(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  payment_id bigint not null references public.payments(id) on delete cascade,
  commission_type public.commission_type not null,
  amount_cents int not null check (amount_cents >= 0),
  status public.commission_status not null default 'pending',
  payout_batch_id bigint references public.commission_payouts(id),
  created_at timestamptz not null default now()
);

create table public.partners (
  id bigserial primary key,
  name text not null,
  type public.partner_type not null default 'other',
  address text,
  city text,
  country text,
  services text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.doctor_reviews (
  id bigserial primary key,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  review_text text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (doctor_id, patient_id)
);

create table public.partner_reviews (
  id bigserial primary key,
  partner_id bigint not null references public.partners(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  review_text text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (partner_id, patient_id)
);

create index idx_doctors_status on public.doctors(status);
create index idx_doctors_city on public.doctors(city);
create index idx_doctors_languages on public.doctors using gin(languages);
create index idx_doctor_specialties_specialty on public.doctor_specialties(specialty_id);
create index idx_partners_type on public.partners(type);
create index idx_referrals_agent on public.referrals(agent_id);
create index idx_commissions_agent_status on public.commissions(agent_id, status);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger doctors_updated_at
before update on public.doctors
for each row execute procedure public.handle_updated_at();

create trigger memberships_updated_at
before update on public.patient_memberships
for each row execute procedure public.handle_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.doctor_applications enable row level security;
alter table public.doctors enable row level security;
alter table public.specialties enable row level security;
alter table public.doctor_specialties enable row level security;
alter table public.agents enable row level security;
alter table public.patients enable row level security;
alter table public.membership_plans enable row level security;
alter table public.patient_memberships enable row level security;
alter table public.payments enable row level security;
alter table public.referrals enable row level security;
alter table public.commissions enable row level security;
alter table public.commission_payouts enable row level security;
alter table public.partners enable row level security;
alter table public.doctor_reviews enable row level security;
alter table public.partner_reviews enable row level security;

create policy profiles_self_select on public.profiles
for select using (id = auth.uid());

create policy profiles_self_update on public.profiles
for update using (id = auth.uid());

create policy admin_all_profiles on public.profiles
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy public_can_view_approved_doctors on public.doctors
for select using (status = 'approved');

create policy doctor_can_view_own_record on public.doctors
for select using (id = auth.uid());

create policy doctor_can_update_own_record on public.doctors
for update using (id = auth.uid());

create policy admin_manage_doctors on public.doctors
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy public_can_view_specialties on public.specialties
for select using (true);

create policy public_can_view_doctor_specialties on public.doctor_specialties
for select using (true);

create policy public_can_view_active_plans on public.membership_plans
for select using (is_active = true);

create policy admin_manage_plans on public.membership_plans
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy patient_own_row on public.patients
for all using (id = auth.uid())
with check (id = auth.uid());

create policy doctor_can_view_chosen_patients on public.patients
for select using (chosen_doctor_id = auth.uid());

create policy agent_can_view_referred_patients on public.patients
for select using (referral_agent_id = auth.uid());

create policy admin_manage_patients on public.patients
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy agent_self_access on public.agents
for all using (id = auth.uid())
with check (id = auth.uid());

create policy admin_manage_agents on public.agents
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy patient_membership_self on public.patient_memberships
for select using (patient_id = auth.uid());

create policy admin_manage_patient_memberships on public.patient_memberships
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy patient_view_own_payments on public.payments
for select using (
  exists (
    select 1
    from public.patient_memberships pm
    where pm.id = patient_membership_id
      and pm.patient_id = auth.uid()
  )
);

create policy admin_manage_payments on public.payments
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy agent_view_own_referrals on public.referrals
for select using (agent_id = auth.uid());

create policy admin_manage_referrals on public.referrals
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy public_view_active_partners on public.partners
for select using (is_active = true);

create policy admin_manage_partners on public.partners
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy public_view_visible_doctor_reviews on public.doctor_reviews
for select using (is_visible = true);

create policy patient_insert_own_doctor_reviews on public.doctor_reviews
for insert with check (patient_id = auth.uid());

create policy patient_update_own_doctor_reviews on public.doctor_reviews
for update using (patient_id = auth.uid());

create policy doctor_view_own_reviews on public.doctor_reviews
for select using (doctor_id = auth.uid());

create policy admin_manage_doctor_reviews on public.doctor_reviews
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy public_view_visible_partner_reviews on public.partner_reviews
for select using (is_visible = true);

create policy patient_insert_own_partner_reviews on public.partner_reviews
for insert with check (patient_id = auth.uid());

create policy patient_update_own_partner_reviews on public.partner_reviews
for update using (patient_id = auth.uid());

create policy admin_manage_partner_reviews on public.partner_reviews
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy agent_view_own_commissions on public.commissions
for select using (agent_id = auth.uid());

create policy admin_manage_commissions on public.commissions
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy agent_view_own_payouts on public.commission_payouts
for select using (agent_id = auth.uid());

create policy admin_manage_payouts on public.commission_payouts
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy doctor_application_submit on public.doctor_applications
for insert with check (true);

create policy admin_review_doctor_applications on public.doctor_applications
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
