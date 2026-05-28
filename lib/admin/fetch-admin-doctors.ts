import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminDoctorListItem } from "@/lib/admin/types";
import { isDoctorApproved } from "@/lib/doctors/approval-status";

type DoctorRow = {
  id: string;
  email: string;
  status: string;
  is_approved?: boolean | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

function displayName(fullName: string | null | undefined): string {
  const name = fullName?.trim();
  return name && name.length > 0 ? name : "—";
}

/**
 * Fetches doctors and profile names in separate queries to avoid PostgREST
 * embed ambiguity (doctors.id and doctors.approved_by both reference profiles).
 * Approval uses the `status` column (`doctor_status` enum) from the base schema.
 */
export async function fetchAdminDoctors(
  admin: SupabaseClient,
): Promise<{ doctors: AdminDoctorListItem[]; error: string | null }> {
  const doctorsResult = await admin
    .from("doctors")
    .select("id, email, status, is_approved")
    .order("created_at", { ascending: false });

  if (doctorsResult.error) {
    return { doctors: [], error: doctorsResult.error.message };
  }

  const doctorRows = (doctorsResult.data ?? []) as DoctorRow[];

  if (doctorRows.length === 0) {
    return { doctors: [], error: null };
  }

  const doctorIds = doctorRows.map((row) => row.id);

  const profilesResult = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", doctorIds);

  if (profilesResult.error) {
    return { doctors: [], error: profilesResult.error.message };
  }

  const nameById = new Map<string, string>();
  for (const profile of (profilesResult.data ?? []) as ProfileRow[]) {
    nameById.set(profile.id, displayName(profile.full_name));
  }

  const doctors: AdminDoctorListItem[] = doctorRows.map((row) => ({
    id: row.id,
    email: row.email,
    full_name: nameById.get(row.id) ?? "—",
    is_approved: isDoctorApproved({
      status: row.status,
      is_approved: row.is_approved,
    }),
  }));

  return { doctors, error: null };
}
