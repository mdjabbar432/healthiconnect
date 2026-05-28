import type { SupabaseClient } from "@supabase/supabase-js";

export async function validateApprovedDoctor(
  admin: SupabaseClient,
  doctorId: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("doctors")
    .select("id")
    .eq("id", doctorId)
    .eq("status", "approved")
    .maybeSingle();

  return !error && Boolean(data?.id);
}
