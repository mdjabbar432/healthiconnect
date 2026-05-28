import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";

export type AgentDashboardData = {
  fullName: string;
  referralCode: string;
  activeReferredPatients: number;
  totalCommissionCents: number;
};

export async function fetchAgentDashboardData(): Promise<AgentDashboardData | null> {
  if (!isSupabaseClientConfigured()) return null;

  const client = getSupabaseClient();
  if (!client) return null;

  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  const { data: profile } = await client
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "agent") return null;

  const { data: agent } = await client
    .from("agents")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (!agent?.referral_code) return null;

  const { data: referrals } = await client
    .from("referrals")
    .select("patient_id")
    .eq("agent_id", userId);

  const patientIds = (referrals ?? []).map((row) => row.patient_id);

  let activeReferredPatients = 0;
  if (patientIds.length > 0) {
    const { data: activeMemberships } = await client
      .from("patient_memberships")
      .select("patient_id")
      .in("patient_id", patientIds)
      .eq("status", "active");

    activeReferredPatients = new Set(
      (activeMemberships ?? []).map((row) => row.patient_id),
    ).size;
  }

  const { data: commissions } = await client
    .from("commissions")
    .select("amount_cents, status")
    .eq("agent_id", userId)
    .neq("status", "void");

  const totalCommissionCents = (commissions ?? []).reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0,
  );

  return {
    fullName: profile.full_name?.trim() || "Agent",
    referralCode: agent.referral_code,
    activeReferredPatients,
    totalCommissionCents,
  };
}
