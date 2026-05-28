import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";

export type AgentSession = {
  userId: string;
  fullName: string;
  referralCode: string;
};

export async function fetchAgentSession(): Promise<AgentSession | null> {
  if (!isSupabaseClientConfigured()) return null;

  const client = getSupabaseClient();
  if (!client) return null;

  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  return fetchAgentSessionForUser(userId);
}

export async function fetchAgentSessionForUser(
  userId: string,
): Promise<AgentSession | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || profile?.role !== "agent") return null;

  const { data: agentRow, error: agentError } = await client
    .from("agents")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (agentError || !agentRow?.referral_code) return null;

  return {
    userId,
    fullName: profile.full_name?.trim() || "Agent",
    referralCode: agentRow.referral_code,
  };
}
