-- Doctor dashboard (B.2): read chosen patients, their profiles, and active memberships.

create policy doctor_view_chosen_patient_profiles on public.profiles
for select using (
  id in (
    select p.id
    from public.patients p
    where p.chosen_doctor_id = auth.uid()
  )
);

create policy doctor_view_chosen_patient_memberships on public.patient_memberships
for select using (
  patient_id in (
    select p.id
    from public.patients p
    where p.chosen_doctor_id = auth.uid()
  )
);

create policy doctor_manage_own_specialties on public.doctor_specialties
for all using (doctor_id = auth.uid())
with check (doctor_id = auth.uid());
