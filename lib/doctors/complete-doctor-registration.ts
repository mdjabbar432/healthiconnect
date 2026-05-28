import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureUniqueDoctorSlug } from "@/lib/doctors/ensure-unique-slug";
import { insertDoctorRecord } from "@/lib/doctors/insert-doctor-record";
import { resolveSpecialtyId } from "@/lib/doctors/resolve-specialty-id";
import type { DirectorySpecialty } from "@/lib/constants/specialties";
import type { DirectoryLanguage } from "@/lib/constants/languages";
import { parseLocationInput } from "@/lib/doctors/parse-location";

export type CompleteDoctorRegistrationInput = {
  userId: string;
  fullName: string;
  email: string;
  licenseNumber: string;
  bio: string;
  specialty: DirectorySpecialty;
  language: DirectoryLanguage;
  location: string;
  photoUrl?: string;
};

export type CompleteDoctorRegistrationResult =
  | { ok: true; slug: string }
  | { ok: false; step: string; message: string };

export async function completeDoctorRegistration(
  admin: SupabaseClient,
  input: CompleteDoctorRegistrationInput,
): Promise<CompleteDoctorRegistrationResult> {
  const {
    userId,
    fullName,
    email,
    licenseNumber,
    bio,
    specialty,
    language,
    location,
    photoUrl,
  } = input;
  const { city, country } = parseLocationInput(location);

  const { data: existingDoctor } = await admin
    .from("doctors")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingDoctor) {
    return {
      ok: false,
      step: "doctor",
      message: "A doctor profile already exists for this account.",
    };
  }

  const slug = await ensureUniqueDoctorSlug(admin, fullName);

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      role: "doctor",
      full_name: fullName,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return { ok: false, step: "profile", message: profileError.message };
  }

  const { error: doctorError } = await insertDoctorRecord(admin, {
    id: userId,
    slug,
    email,
    licenseNumber,
    bio,
    language,
    location,
    photoUrl,
  });

  if (doctorError) {
    return { ok: false, step: "doctor", message: doctorError.message };
  }

  const { id: specialtyId, error: specialtyError } = await resolveSpecialtyId(
    admin,
    specialty,
  );

  if (specialtyError || specialtyId == null) {
    return {
      ok: false,
      step: "specialty",
      message: specialtyError ?? "Unknown specialty",
    };
  }

  const { error: linkError } = await admin
    .from("doctor_specialties")
    .insert({ doctor_id: userId, specialty_id: specialtyId });

  if (linkError) {
    return { ok: false, step: "specialty_link", message: linkError.message };
  }

  const { error: applicationError } = await admin
    .from("doctor_applications")
    .insert({
      full_name: fullName,
      email: email.toLowerCase(),
      slug,
      license_number: licenseNumber,
      bio,
      specialties: [specialty],
      languages: [language],
      city,
      country,
      status: "pending",
    });

  if (applicationError) {
    console.warn(
      "[completeDoctorRegistration] doctor_applications insert (non-fatal):",
      applicationError.message,
    );
  }

  return { ok: true, slug };
}
