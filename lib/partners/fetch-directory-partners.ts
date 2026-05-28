import { fetchActivePartners } from "@/lib/partners/fetch-active-partners";
import type { PartnerType } from "@/types/domain";
import { getSupabaseAdmin, isSupabaseServerConfigured } from "@/lib/supabase/server";

export type PartnerDirectoryItem = {
  id: number;
  name: string;
  type: PartnerType;
  address: string | null;
  services: string[];
};

export async function fetchDirectoryPartners(): Promise<{
  partners: PartnerDirectoryItem[];
  error: string | null;
}> {
  if (!isSupabaseServerConfigured()) {
    return {
      partners: [],
      error:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return { partners: [], error: "Supabase client unavailable" };
  }

  try {
    const { partners: rows, error } = await fetchActivePartners(admin);

    if (error) {
      console.error("[fetchDirectoryPartners]", error.message);
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
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Failed to load partners";
    console.error("[fetchDirectoryPartners]", cause);
    return { partners: [], error: message };
  }
}
