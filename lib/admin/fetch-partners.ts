import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminPartnerListItem } from "@/lib/admin/types";
import { fetchActivePartners } from "@/lib/partners/fetch-active-partners";

export async function fetchAdminPartners(
  admin: SupabaseClient,
): Promise<{ partners: AdminPartnerListItem[]; error: string | null }> {
  const { partners: rows, error } = await fetchActivePartners(admin);

  if (error) {
    return { partners: [], error: error.message };
  }

  const partners = rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    address: row.address,
    services: row.services ?? [],
  }));

  return { partners, error: null };
}
