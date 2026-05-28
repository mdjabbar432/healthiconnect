import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { isPostgrestSchemaError } from "@/lib/supabase/postgrest-schema-error";
import type { DoctorSessionRow } from "@/lib/doctors/map-doctor-session-profile";

const SELECT_WITH_APPROVAL = "id, status, slug, is_approved";
const SELECT_BASE = "id, status, slug";

export async function queryDoctorSessionRow(
  client: SupabaseClient,
  userId: string,
): Promise<{ data: DoctorSessionRow | null; error: PostgrestError | null }> {
  const primary = await client
    .from("doctors")
    .select(SELECT_WITH_APPROVAL)
    .eq("id", userId)
    .maybeSingle();

  if (!primary.error) {
    return { data: primary.data as DoctorSessionRow | null, error: null };
  }

  if (!isPostgrestSchemaError(primary.error)) {
    return { data: null, error: primary.error };
  }

  const fallback = await client
    .from("doctors")
    .select(SELECT_BASE)
    .eq("id", userId)
    .maybeSingle();

  if (fallback.error) {
    return { data: null, error: fallback.error };
  }

  return { data: fallback.data as DoctorSessionRow | null, error: null };
}
