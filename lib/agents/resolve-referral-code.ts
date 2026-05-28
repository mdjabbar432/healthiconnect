import type { SupabaseClient } from "@supabase/supabase-js";

export type ResolvedAgentReferral = {
  agentId: string;
  referralCode: string;
};

export async function resolveAgentByReferralCode(
  admin: SupabaseClient,
  referralCode: string,
): Promise<ResolvedAgentReferral | null> {
  const normalized = referralCode.trim().toUpperCase();

  const { data, error } = await admin
    .from("agents")
    .select("id, referral_code")
    .ilike("referral_code", normalized)
    .maybeSingle();

  if (error || !data) return null;

  return {
    agentId: data.id,
    referralCode: data.referral_code,
  };
}
