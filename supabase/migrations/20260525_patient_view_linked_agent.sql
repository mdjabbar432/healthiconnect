-- Allow patients to read the referral code of their linked insurance agent.
create policy patient_view_linked_agent on public.agents
for select using (
  id in (
    select referral_agent_id
    from public.patients
    where id = auth.uid()
      and referral_agent_id is not null
  )
);

-- Allow patients to read their own referral row (fallback for dashboard).
create policy patient_view_own_referral on public.referrals
for select using (patient_id = auth.uid());
