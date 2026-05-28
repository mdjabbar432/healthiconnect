import type { SupabaseClient } from "@supabase/supabase-js";
import type { MembershipPlanSlug } from "@/lib/membership/plans";

export async function resolvePlanIdBySlug(
  admin: SupabaseClient,
  planSlug: MembershipPlanSlug,
): Promise<number | undefined> {
  const pattern = planSlug === "basic" ? "%basic%" : "%premium%";

  const { data } = await admin
    .from("membership_plans")
    .select("id")
    .eq("is_active", true)
    .ilike("name", pattern)
    .order("price_cents", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? undefined;
}
