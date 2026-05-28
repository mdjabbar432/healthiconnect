import type { SupabaseClient } from "@supabase/supabase-js";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  let segment = "";
  for (let i = 0; i < length; i += 1) {
    segment += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return segment;
}

export function formatAgentReferralCode(): string {
  return `AG-${randomSegment(6)}`;
}

export async function ensureUniqueAgentReferralCode(
  admin: SupabaseClient,
  maxAttempts = 12,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = formatAgentReferralCode();
    const { data } = await admin
      .from("agents")
      .select("id")
      .eq("referral_code", candidate)
      .maybeSingle();

    if (!data) return candidate;
  }

  throw new Error("Unable to generate a unique agent referral code.");
}
