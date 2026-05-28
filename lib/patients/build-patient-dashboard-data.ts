import type { SupabaseClient } from "@supabase/supabase-js";
import type { PatientDashboardData } from "@/lib/patients/fetch-patient-dashboard-data";
import { resolveChosenDoctorDisplay } from "@/lib/patients/resolve-chosen-doctor-display";

async function resolveAgentReferralCode(
  admin: SupabaseClient,
  userId: string,
  referralAgentId: string | null,
): Promise<string | null> {
  if (referralAgentId) {
    const { data: agent, error } = await admin
      .from("agents")
      .select("referral_code")
      .eq("id", referralAgentId)
      .maybeSingle();

    if (!error && agent?.referral_code) {
      return agent.referral_code;
    }
  }

  const { data: referral, error: referralError } = await admin
    .from("referrals")
    .select("agent_id")
    .eq("patient_id", userId)
    .maybeSingle();

  if (referralError || !referral?.agent_id) {
    return null;
  }

  const { data: agentFromReferral, error: agentError } = await admin
    .from("agents")
    .select("referral_code")
    .eq("id", referral.agent_id)
    .maybeSingle();

  if (agentError || !agentFromReferral?.referral_code) {
    return null;
  }

  return agentFromReferral.referral_code;
}

export async function buildPatientDashboardData(
  admin: SupabaseClient,
  userId: string,
): Promise<PatientDashboardData | null> {
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "patient") return null;

  const { data: patient } = await admin
    .from("patients")
    .select("chosen_doctor_id, referral_agent_id")
    .eq("id", userId)
    .maybeSingle();

  if (!patient) return null;

  const { data: membership } = await admin
    .from("patient_memberships")
    .select("status, plan_id")
    .eq("patient_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let planName: string | null = null;
  if (membership?.plan_id) {
    const { data: plan } = await admin
      .from("membership_plans")
      .select("name")
      .eq("id", membership.plan_id)
      .maybeSingle();
    planName = plan?.name ?? null;
  }

  const agentReferralCode = await resolveAgentReferralCode(
    admin,
    userId,
    patient.referral_agent_id,
  );

  const chosenDoctor = await resolveChosenDoctorDisplay(
    admin,
    patient.chosen_doctor_id,
  );

  return {
    fullName: profile.full_name?.trim() || "Patient",
    planName,
    planStatus: membership?.status ?? null,
    agentReferralCode,
    doctorName: chosenDoctor?.doctorName ?? null,
    doctorSpecialty: chosenDoctor?.doctorSpecialty ?? null,
    doctorId: chosenDoctor?.doctorId ?? null,
  };
}
