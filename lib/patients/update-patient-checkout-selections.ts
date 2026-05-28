import type { SupabaseClient } from "@supabase/supabase-js";
import { linkPatientToAgent } from "@/lib/agents/link-patient-referral";

export async function updatePatientCheckoutSelections(
  admin: SupabaseClient,
  patientId: string,
  options: {
    chosenDoctorId?: string;
    agentId?: string;
  },
): Promise<void> {
  const updates: { chosen_doctor_id?: string } = {};

  if (options.chosenDoctorId) {
    updates.chosen_doctor_id = options.chosenDoctorId;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from("patients").update(updates).eq("id", patientId);
    if (error) {
      throw new Error(error.message);
    }
  }

  if (options.agentId) {
    await linkPatientToAgent(admin, patientId, options.agentId);
  }
}
