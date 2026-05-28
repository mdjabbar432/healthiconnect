import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";

export type PatientSession = {
  userId: string;
  fullName: string;
};

/** Returns patient session when the current user is an authenticated patient. */
export async function fetchPatientSession(): Promise<PatientSession | null> {
  if (!isSupabaseClientConfigured()) return null;

  const client = getSupabaseClient();
  if (!client) return null;

  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  return fetchPatientSessionForUser(userId);
}

export async function fetchPatientSessionForUser(
  userId: string,
): Promise<PatientSession | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || profile?.role !== "patient") return null;

  const { data: patientRow, error: patientError } = await client
    .from("patients")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (patientError || !patientRow) return null;

  return {
    userId,
    fullName: profile.full_name?.trim() || "Patient",
  };
}
