import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveSpecialtyId(
  admin: SupabaseClient,
  specialtyName: string,
): Promise<{ id: number | null; error: string | null }> {
  const { data: existing, error: lookupError } = await admin
    .from("specialties")
    .select("id")
    .eq("name", specialtyName)
    .maybeSingle();

  if (lookupError) {
    return { id: null, error: lookupError.message };
  }

  if (existing?.id != null) {
    return { id: existing.id, error: null };
  }

  const { data: inserted, error: insertError } = await admin
    .from("specialties")
    .insert({ name: specialtyName })
    .select("id")
    .single();

  if (insertError) {
    return { id: null, error: insertError.message };
  }

  return { id: inserted?.id ?? null, error: null };
}
