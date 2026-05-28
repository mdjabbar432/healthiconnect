import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { isPostgrestSchemaError } from "@/lib/supabase/postgrest-schema-error";

/**
 * Rejects a doctor application so they no longer appear in the pending queue.
 */
export async function denyDoctorById(
  admin: SupabaseClient,
  doctorId: string,
): Promise<{ error: PostgrestError | null }> {
  const withFlag = await admin
    .from("doctors")
    .update({ status: "rejected", is_approved: false })
    .eq("id", doctorId);

  if (!withFlag.error) {
    return { error: null };
  }

  if (!isPostgrestSchemaError(withFlag.error)) {
    return { error: withFlag.error };
  }

  const statusOnly = await admin
    .from("doctors")
    .update({ status: "rejected" })
    .eq("id", doctorId);

  return { error: statusOnly.error };
}
