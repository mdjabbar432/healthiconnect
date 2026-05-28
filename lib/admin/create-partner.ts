import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { PartnerType } from "@/lib/admin/types";

export type CreatePartnerInput = {
  name: string;
  type: PartnerType;
  address: string;
  description: string;
};

function parseServices(description: string): string[] {
  const trimmed = description.trim();
  if (!trimmed) return [];

  if (trimmed.includes("\n")) {
    return trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [trimmed];
}

export async function createPartner(
  admin: SupabaseClient,
  input: CreatePartnerInput,
): Promise<{ partnerId: number | null; error: PostgrestError | null }> {
  const { data, error } = await admin
    .from("partners")
    .insert({
      name: input.name.trim(),
      type: input.type,
      address: input.address.trim() || null,
      services: parseServices(input.description),
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    return { partnerId: null, error };
  }

  return { partnerId: data?.id ?? null, error: null };
}
