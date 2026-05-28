# HealthiConnect Webapp Starter

Starter scaffold for a medical membership platform with patient, doctor, agent, and admin features.

## Included

- Next.js App Router structure for public + role dashboards
- API route stubs for checkout, Stripe webhook, doctor application, and reviews
- Supabase SQL migration with:
  - full core schema
  - indexes and updated-at triggers
  - row-level security policies
- Seed SQL for plans and specialties

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy environment template:

```bash
cp .env.example .env.local
```

3. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`.

4. Run migration + seed in Supabase SQL editor:
   - `supabase/migrations/20260501_initial_schema.sql`
   - `supabase/seed.sql`

5. Start app:

```bash
npm run dev
```

## Notes

- `app/api/checkout/create-session/route.ts` currently uses `price_placeholder`. Replace with `membership_plans.stripe_price_id` lookup.
- API routes use service role for scaffolding speed; for production, move writes to trusted server paths with stronger auth checks.
