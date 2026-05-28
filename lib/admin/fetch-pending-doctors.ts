import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminDoctorListItem } from "@/lib/admin/types";
import { isDoctorApproved } from "@/lib/doctors/approval-status";
import { isPostgrestSchemaError } from "@/lib/supabase/postgrest-schema-error";

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

/** Doctors awaiting approval (`is_approved = false`, with legacy `status` fallback). */
export async function fetchPendingAdminDoctors(
  admin: SupabaseClient,
): Promise<{ doctors: AdminDoctorListItem[]; error: string | null }> {
  const primary = await admin
    .from("doctors")
    .select("id, email, status, is_approved")
    .eq("is_approved", false)
    .order("created_at", { ascending: false });

  let doctorRows: DoctorRow[];

  if (primary.error) {
    if (!isPostgrestSchemaError(primary.error)) {
      return { doctors: [], error: primary.error.message };
    }

    const fallback = await admin
      .from("doctors")
      .select("id, email, status")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (fallback.error) {
      return { doctors: [], error: fallback.error.message };
    }

    doctorRows = (fallback.data ?? []) as DoctorRow[];
  } else {
    doctorRows = (primary.data ?? []) as DoctorRow[];
  }

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
