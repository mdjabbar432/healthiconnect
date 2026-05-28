import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapDoctorSessionRow,
  type DoctorSessionProfile,
} from "@/lib/doctors/map-doctor-session-profile";
import { queryDoctorSessionRow } from "@/lib/doctors/query-doctor-session-row";

export async function buildDoctorSessionProfile(
  admin: SupabaseClient,
  userId: string,
): Promise<DoctorSessionProfile | null> {
  const { data, error } = await queryDoctorSessionRow(admin, userId);

  if (error) {
    console.error("[buildDoctorSessionProfile]", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapDoctorSessionRow(data);
}
