import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";

export type DoctorPatientRow = {
  id: string;
  fullName: string;
  planName: string | null;
  membershipStatus: string;
  linkedAt: string;
};

type ProfileJoin =
  | { full_name: string | null }
  | Array<{ full_name: string | null }>
  | null;

function profileName(profiles: ProfileJoin): string {
  const row = Array.isArray(profiles) ? profiles[0] : profiles;
  return row?.full_name?.trim() || "Patient";
}

export async function fetchDoctorPatients(
  doctorId: string,
): Promise<{ patients: DoctorPatientRow[]; error: string | null }> {
  if (!isSupabaseClientConfigured()) {
    return { patients: [], error: "Supabase is not configured." };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { patients: [], error: "Supabase is not configured." };
  }

  const { data: patientRows, error: patientsError } = await client
    .from("patients")
    .select("id, created_at, profiles(full_name)")
    .eq("chosen_doctor_id", doctorId)
    .order("created_at", { ascending: false });

  if (patientsError) {
    return { patients: [], error: patientsError.message };
  }

  const rows = patientRows ?? [];
  if (rows.length === 0) {
    return { patients: [], error: null };
  }

  const patientIds = rows.map((row) => row.id as string);

  const { data: memberships, error: membershipError } = await client
    .from("patient_memberships")
    .select("patient_id, status, plan_id")
    .in("patient_id", patientIds)
    .eq("status", "active");

  if (membershipError) {
    return { patients: [], error: membershipError.message };
  }

  const activePatientIds = new Set(
    (memberships ?? []).map((row) => row.patient_id as string),
  );

  const planIds = [
    ...new Set(
      (memberships ?? [])
        .map((row) => row.plan_id)
        .filter((id): id is number => id != null),
    ),
  ];

  const planNameById = new Map<number, string>();
  if (planIds.length > 0) {
    const { data: plans } = await client
      .from("membership_plans")
      .select("id, name")
      .in("id", planIds);

    for (const plan of plans ?? []) {
      if (plan.name) planNameById.set(plan.id, plan.name);
    }
  }

  const membershipByPatient = new Map<
    string,
    { status: string; planName: string | null }
  >();
  for (const membership of memberships ?? []) {
    const patientId = membership.patient_id as string;
    membershipByPatient.set(patientId, {
      status: membership.status as string,
      planName: membership.plan_id
        ? (planNameById.get(membership.plan_id) ?? null)
        : null,
    });
  }

  const patients: DoctorPatientRow[] = rows
    .filter((row) => activePatientIds.has(row.id as string))
    .map((row) => {
      const id = row.id as string;
      const membership = membershipByPatient.get(id);
      return {
        id,
        fullName: profileName(row.profiles as ProfileJoin),
        planName: membership?.planName ?? null,
        membershipStatus: membership?.status ?? "active",
        linkedAt: row.created_at as string,
      };
    });

  return { patients, error: null };
}
