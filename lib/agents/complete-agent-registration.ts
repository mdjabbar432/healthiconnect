import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureUniqueAgentReferralCode } from "@/lib/agents/generate-referral-code";

export type CompleteAgentRegistrationInput = {
  userId: string;
  fullName: string;
  governmentId?: string;
};

export type CompleteAgentRegistrationResult =
  | { ok: true; referralCode: string }
  | { ok: false; step: string; message: string };

export async function completeAgentRegistration(
  admin: SupabaseClient,
  input: CompleteAgentRegistrationInput,
): Promise<CompleteAgentRegistrationResult> {
  const { userId, fullName, governmentId } = input;

  const { data: existingAgent } = await admin
    .from("agents")
    .select("id, referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (existingAgent) {
    return {
      ok: false,
      step: "agent",
      message: "An insurance agent profile already exists for this account.",
    };
  }

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile && existingProfile.role !== "agent") {
    return {
      ok: false,
      step: "profile",
      message:
        "This account is registered as a different role. Use another email or sign in through the correct portal.",
    };
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      role: "agent",
      full_name: fullName,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return { ok: false, step: "profile", message: profileError.message };
  }

  let referralCode: string;
  try {
    referralCode = await ensureUniqueAgentReferralCode(admin);
  } catch (error) {
    return {
      ok: false,
      step: "referral_code",
      message: error instanceof Error ? error.message : "Referral code generation failed.",
    };
  }

  const { error: agentError } = await admin.from("agents").insert({
    id: userId,
    referral_code: referralCode,
    government_id: governmentId?.trim() || null,
  });

  if (agentError) {
    return { ok: false, step: "agent", message: agentError.message };
  }

  return { ok: true, referralCode };
}
