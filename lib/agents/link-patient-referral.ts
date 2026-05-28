import type { SupabaseClient } from "@supabase/supabase-js";

export async function linkPatientToAgent(
  admin: SupabaseClient,
  patientId: string,
  agentId: string,
): Promise<void> {
  const { data: patient, error: patientError } = await admin
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .maybeSingle();

  if (patientError) {
    throw new Error(patientError.message);
  }

  if (!patient) {
    throw new Error("Patient record not found.");
  }

  const { error: updateError } = await admin
    .from("patients")
    .update({ referral_agent_id: agentId })
    .eq("id", patientId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { data: existingReferral } = await admin
    .from("referrals")
    .select("id, agent_id")
    .eq("patient_id", patientId)
    .maybeSingle();

  if (!existingReferral) {
    const { error: insertError } = await admin.from("referrals").insert({
      patient_id: patientId,
      agent_id: agentId,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }
    return;
  }

  if (existingReferral.agent_id !== agentId) {
    const { error: referralUpdateError } = await admin
      .from("referrals")
      .update({ agent_id: agentId })
      .eq("id", existingReferral.id);

    if (referralUpdateError) {
      throw new Error(referralUpdateError.message);
    }
  }
}
