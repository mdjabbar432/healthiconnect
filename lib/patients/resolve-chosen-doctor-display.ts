import type { SupabaseClient } from "@supabase/supabase-js";
import {
  publicDoctorSpecialties,
  resolvePublicDoctorFullName,
  type PublicDoctorProfile,
} from "@/lib/doctors/fetch-public-doctor-profile";

const CHOSEN_DOCTOR_SELECT =
  "id, slug, profiles!doctors_id_fkey(full_name), doctor_specialties(specialties(name))";

const CHOSEN_DOCTOR_SELECT_FALLBACK =
  "id, slug, profiles(full_name), doctor_specialties(specialties(name))";

export type ChosenDoctorDisplay = {
  doctorId: string;
  doctorSlug: string;
  doctorName: string;
  doctorSpecialty: string | null;
};

function primarySpecialty(specialties: string[]): string | null {
  return specialties[0] ?? null;
}

export async function resolveChosenDoctorDisplay(
  admin: SupabaseClient,
  chosenDoctorId: string | null | undefined,
): Promise<ChosenDoctorDisplay | null> {
  if (!chosenDoctorId) return null;

  let row: PublicDoctorProfile | null = null;

  for (const selector of [CHOSEN_DOCTOR_SELECT, CHOSEN_DOCTOR_SELECT_FALLBACK]) {
    const { data, error } = await admin
      .from("doctors")
      .select(selector)
      .eq("id", chosenDoctorId)
      .maybeSingle();

    if (!error && data) {
      row = data as unknown as PublicDoctorProfile;
      break;
    }
  }

  if (!row) return null;

  const specialties = publicDoctorSpecialties(row);

  return {
    doctorId: row.id,
    doctorSlug: row.slug,
    doctorName: resolvePublicDoctorFullName(row.profiles),
    doctorSpecialty: primarySpecialty(specialties),
  };
}
