import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

export async function deletePartnerById(
  admin: SupabaseClient,
  partnerId: number,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await admin.from("partners").delete().eq("id", partnerId);
  return { error };
}
