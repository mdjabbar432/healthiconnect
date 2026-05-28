import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { isPostgrestSchemaError } from "@/lib/supabase/postgrest-schema-error";

/**
 * Marks a doctor as approved for the public directory and full dashboard access.
 * Sets `is_approved`, `status`, and `approved_at` when those columns exist.
 */
export async function approveDoctorById(
  admin: SupabaseClient,
  doctorId: string,
): Promise<{ error: PostgrestError | null }> {
  const now = new Date().toISOString();

  const full = await admin
    .from("doctors")
    .update({
      status: "approved",
      is_approved: true,
      approved_at: now,
    })
    .eq("id", doctorId);

  if (!full.error) {
    return { error: null };
  }

  const withFlag = await admin
    .from("doctors")
    .update({ status: "approved", is_approved: true })
    .eq("id", doctorId);

  if (!withFlag.error) {
    return { error: null };
  }

  if (!isPostgrestSchemaError(withFlag.error)) {
    return { error: withFlag.error };
  }

  const withTimestamp = await admin
    .from("doctors")
    .update({ status: "approved", approved_at: now })
    .eq("id", doctorId);

  if (!withTimestamp.error) {
    return { error: null };
  }

  if (!isPostgrestSchemaError(withTimestamp.error)) {
    return { error: withTimestamp.error };
  }

  const statusOnly = await admin
    .from("doctors")
    .update({ status: "approved" })
    .eq("id", doctorId);

  return { error: statusOnly.error };
}
