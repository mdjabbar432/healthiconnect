import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { PartnerType } from "@/types/domain";

/** Columns shared by admin partner management and the public directory. */
export const ACTIVE_PARTNER_SELECT = "id, name, type, address, services";

export type ActivePartnerRow = {
  id: number;
  name: string;
  type: PartnerType;
  address: string | null;
  services: string[] | null;
};

export async function fetchActivePartners(
  client: SupabaseClient,
): Promise<{ partners: ActivePartnerRow[]; error: PostgrestError | null }> {
  const { data, error } = await client
    .from("partners")
    .select(ACTIVE_PARTNER_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { partners: [], error };
  }

  return { partners: (data ?? []) as ActivePartnerRow[], error: null };
}
