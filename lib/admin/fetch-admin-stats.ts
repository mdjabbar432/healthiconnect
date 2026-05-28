import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminSystemStats } from "@/lib/admin/types";

type PatientRow = {
  id: string;
  chosen_doctor_id: string | null;
  referral_agent_id: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type AgentRow = {
  id: string;
  referral_code: string;
};

type CommissionRow = {
  agent_id: string;
  amount_cents: number;
  status: string;
};

function displayName(fullName: string | null | undefined): string {
  const name = fullName?.trim();
  return name && name.length > 0 ? name : "—";
}

export async function fetchAdminSystemStats(
  admin: SupabaseClient,
): Promise<{ stats: AdminSystemStats | null; error: string | null }> {
  const patientsCountResult = await admin
    .from("patients")
    .select("id", { count: "exact", head: true });

  if (patientsCountResult.error) {
    return { stats: null, error: patientsCountResult.error.message };
  }

  const patientsResult = await admin
    .from("patients")
    .select("id, chosen_doctor_id, referral_agent_id")
    .order("created_at", { ascending: false });

  if (patientsResult.error) {
    return { stats: null, error: patientsResult.error.message };
  }

  const patientRows = (patientsResult.data ?? []) as PatientRow[];
  const patientIds = patientRows.map((row) => row.id);
  const doctorIds = [
    ...new Set(
      patientRows
        .map((row) => row.chosen_doctor_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const agentIds = [
    ...new Set(
      patientRows
        .map((row) => row.referral_agent_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const patientNameById = new Map<string, string>();
  if (patientIds.length > 0) {
    const profilesResult = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", patientIds);

    if (profilesResult.error) {
      return { stats: null, error: profilesResult.error.message };
    }

    for (const profile of (profilesResult.data ?? []) as ProfileRow[]) {
      patientNameById.set(profile.id, displayName(profile.full_name));
    }
  }

  const doctorNameById = new Map<string, string>();
  if (doctorIds.length > 0) {
    const doctorProfilesResult = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", doctorIds);

    if (doctorProfilesResult.error) {
      return { stats: null, error: doctorProfilesResult.error.message };
    }

    for (const profile of (doctorProfilesResult.data ?? []) as ProfileRow[]) {
      doctorNameById.set(profile.id, displayName(profile.full_name));
    }
  }

  const referralCodeByAgentId = new Map<string, string>();
  if (agentIds.length > 0) {
    const agentsResult = await admin
      .from("agents")
      .select("id, referral_code")
      .in("id", agentIds);

    if (agentsResult.error) {
      return { stats: null, error: agentsResult.error.message };
    }

    for (const agent of (agentsResult.data ?? []) as AgentRow[]) {
      referralCodeByAgentId.set(agent.id, agent.referral_code);
    }
  }

  const patient_links = patientRows.map((row) => ({
    patient_id: row.id,
    patient_name: patientNameById.get(row.id) ?? "—",
    linked_doctor: row.chosen_doctor_id
      ? (doctorNameById.get(row.chosen_doctor_id) ?? "—")
      : "—",
    linked_agent_id: row.referral_agent_id
      ? (referralCodeByAgentId.get(row.referral_agent_id) ?? "—")
      : "—",
  }));

  const commissionsResult = await admin
    .from("commissions")
    .select("agent_id, amount_cents, status");

  if (commissionsResult.error) {
    return { stats: null, error: commissionsResult.error.message };
  }

  const totalsByAgent = new Map<string, number>();
  for (const row of (commissionsResult.data ?? []) as CommissionRow[]) {
    if (row.status === "void") continue;
    totalsByAgent.set(
      row.agent_id,
      (totalsByAgent.get(row.agent_id) ?? 0) + (row.amount_cents ?? 0),
    );
  }

  const commissionAgentIds = [...totalsByAgent.keys()];
  const referralByAgent = new Map<string, string>();

  if (commissionAgentIds.length > 0) {
    const agentsResult = await admin
      .from("agents")
      .select("id, referral_code")
      .in("id", commissionAgentIds);

    if (agentsResult.error) {
      return { stats: null, error: agentsResult.error.message };
    }

    for (const agent of (agentsResult.data ?? []) as AgentRow[]) {
      referralByAgent.set(agent.id, agent.referral_code);
    }
  }

  const agent_commissions = commissionAgentIds
    .map((agentId) => ({
      agent_id: agentId,
      referral_code: referralByAgent.get(agentId) ?? "—",
      total_commission_cents: totalsByAgent.get(agentId) ?? 0,
    }))
    .filter((row) => row.total_commission_cents > 0)
    .sort((a, b) => b.total_commission_cents - a.total_commission_cents);

  return {
    stats: {
      total_patients: patientsCountResult.count ?? patientRows.length,
      patient_links,
      agent_commissions,
    },
    error: null,
  };
}
