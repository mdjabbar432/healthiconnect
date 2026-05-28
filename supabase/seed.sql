insert into public.membership_plans (name, description, price_cents, currency, interval, stripe_price_id, is_active)
values
  ('Basic', 'General access to doctor directory and member dashboard', 2999, 'usd', 'month', 'price_basic_placeholder', true),
  ('Premium', 'Enhanced plan with premium partner discounts', 5999, 'usd', 'month', 'price_premium_placeholder', true);

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
