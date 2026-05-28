import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";
import { publicDoctorSpecialties } from "@/lib/doctors/fetch-public-doctor-profile";
import type { PublicDoctorProfile } from "@/lib/doctors/fetch-public-doctor-profile";

export type PatientDashboardData = {
  fullName: string;
  planName: string | null;
  planStatus: string | null;
  agentReferralCode: string | null;
  doctorName: string | null;
  doctorSpecialty: string | null;
  doctorId: string | null;
};

async function resolveAgentReferralCode(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  userId: string,
  referralAgentId: string | null,
): Promise<string | null> {
  if (referralAgentId) {
    const { data: agent, error } = await client
      .from("agents")
      .select("referral_code")
      .eq("id", referralAgentId)
      .maybeSingle();

    if (!error && agent?.referral_code) {
      return agent.referral_code;
    }
  }

  const { data: referral, error: referralError } = await client
    .from("referrals")
    .select("agent_id")
    .eq("patient_id", userId)
    .maybeSingle();

  if (referralError || !referral?.agent_id) {
    return null;
  }

  const { data: agentFromReferral, error: agentError } = await client
    .from("agents")
    .select("referral_code")
    .eq("id", referral.agent_id)
    .maybeSingle();

  if (agentError || !agentFromReferral?.referral_code) {
    return null;
  }

  return agentFromReferral.referral_code;
}

async function resolveChosenDoctorClientSide(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  chosenDoctorId: string,
): Promise<Pick<PatientDashboardData, "doctorId" | "doctorSpecialty">> {
  const { data: doctor } = await client
    .from("doctors")
    .select("id, doctor_specialties(specialties(name))")
    .eq("id", chosenDoctorId)
    .maybeSingle();

  if (!doctor) {
    return { doctorId: null, doctorSpecialty: null };
  }

  const row = doctor as Pick<PublicDoctorProfile, "id" | "doctor_specialties">;
  const specialties = publicDoctorSpecialties(row as PublicDoctorProfile);

  return {
    doctorId: row.id,
    doctorSpecialty: specialties[0] ?? null,
  };
}

async function fetchPatientDashboardFromApi(
  accessToken: string,
): Promise<PatientDashboardData | null> {
  try {
    const res = await fetch("/api/patients/dashboard", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) return null;

    return (await res.json()) as PatientDashboardData;
  } catch {
    return null;
  }
}

function mergeDoctorFields(
  base: PatientDashboardData,
  patch: Partial<PatientDashboardData> | null,
): PatientDashboardData {
  if (!patch) return base;

  return {
    ...base,
    doctorName: patch.doctorName ?? base.doctorName,
    doctorSpecialty: patch.doctorSpecialty ?? base.doctorSpecialty,
    doctorId: patch.doctorId ?? base.doctorId,
    agentReferralCode: patch.agentReferralCode ?? base.agentReferralCode,
  };
}

export async function fetchPatientDashboardData(): Promise<PatientDashboardData | null> {
  if (!isSupabaseClientConfigured()) return null;

  const client = getSupabaseClient();
  if (!client) return null;

  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user?.id;
  const accessToken = sessionData.session?.access_token;
  if (!userId) return null;

  const { data: profile } = await client
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "patient") return null;

  const { data: patient } = await client
    .from("patients")
    .select("chosen_doctor_id, referral_agent_id")
    .eq("id", userId)
    .maybeSingle();

  if (!patient) return null;

  const { data: membership } = await client
    .from("patient_memberships")
    .select("status, plan_id")
    .eq("patient_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let planName: string | null = null;
  if (membership?.plan_id) {
    const { data: plan } = await client
      .from("membership_plans")
      .select("name")
      .eq("id", membership.plan_id)
      .maybeSingle();
    planName = plan?.name ?? null;
  }

  let agentReferralCode = await resolveAgentReferralCode(
    client,
    userId,
    patient.referral_agent_id,
  );

  let doctorName: string | null = null;
  let doctorSpecialty: string | null = null;
  let doctorId: string | null = null;

  if (patient.chosen_doctor_id) {
    const partial = await resolveChosenDoctorClientSide(
      client,
      patient.chosen_doctor_id,
    );
    doctorId = partial.doctorId;
    doctorSpecialty = partial.doctorSpecialty;
  }

  let dashboard: PatientDashboardData = {
    fullName: profile.full_name?.trim() || "Patient",
    planName,
    planStatus: membership?.status ?? null,
    agentReferralCode,
    doctorName,
    doctorSpecialty,
    doctorId,
  };

  if (accessToken) {
    const fromApi = await fetchPatientDashboardFromApi(accessToken);
    dashboard = mergeDoctorFields(dashboard, fromApi);
  }

  return dashboard;
}
