import type { SupabaseClient } from "@supabase/supabase-js";

export type CompletePatientRegistrationInput = {
  userId: string;
  fullName: string;
  email: string;
};

export type CompletePatientRegistrationResult =
  | { ok: true }
  | { ok: false; step: string; message: string };

export async function completePatientRegistration(
  admin: SupabaseClient,
  input: CompletePatientRegistrationInput,
): Promise<CompletePatientRegistrationResult> {
  const { userId, fullName } = input;

  const { data: existingPatient } = await admin
    .from("patients")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingPatient) {
    return {
      ok: false,
      step: "patient",
      message: "A patient profile already exists for this account.",
    };
  }

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile && existingProfile.role !== "patient") {
    return {
      ok: false,
      step: "profile",
      message:
        "This account is registered as a different role. Use another email or sign in through the correct portal.",
    };
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      role: "patient",
      full_name: fullName,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return { ok: false, step: "profile", message: profileError.message };
  }

  const { error: patientError } = await admin.from("patients").insert({
    id: userId,
  });

  if (patientError) {
    return { ok: false, step: "patient", message: patientError.message };
  }

  return { ok: true };
}
