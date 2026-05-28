import type { SupabaseClient } from "@supabase/supabase-js";
import { parseLocationInput } from "@/lib/doctors/parse-location";
import { resolveSpecialtyId } from "@/lib/doctors/resolve-specialty-id";
import type { DoctorProfileUpdateInput } from "@/lib/validations/doctor-profile-update";

export type UpdateDoctorProfileResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateDoctorProfile(
  client: SupabaseClient,
  doctorId: string,
  input: DoctorProfileUpdateInput,
): Promise<UpdateDoctorProfileResult> {
  const { city, country } = parseLocationInput(input.location);

  const { error: doctorError } = await client
    .from("doctors")
    .update({
      bio: input.bio,
      languages: [input.language],
      city,
      country,
    })
    .eq("id", doctorId);

  if (doctorError) {
    return { ok: false, message: doctorError.message };
  }

  const { id: specialtyId, error: specialtyError } = await resolveSpecialtyId(
    client,
    input.specialty,
  );

  if (specialtyError || specialtyId == null) {
    return { ok: false, message: specialtyError ?? "Unknown specialty" };
  }

  const { error: deleteError } = await client
    .from("doctor_specialties")
    .delete()
    .eq("doctor_id", doctorId);

  if (deleteError) {
    return { ok: false, message: deleteError.message };
  }

  const { error: linkError } = await client.from("doctor_specialties").insert({
    doctor_id: doctorId,
    specialty_id: specialtyId,
  });

  if (linkError) {
    return { ok: false, message: linkError.message };
  }

  return { ok: true };
}
