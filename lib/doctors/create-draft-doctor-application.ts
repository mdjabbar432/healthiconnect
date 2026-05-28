import type { SupabaseClient } from "@supabase/supabase-js";
import type { DirectorySpecialty } from "@/lib/constants/specialties";
import type { DirectoryLanguage } from "@/lib/constants/languages";
import { ensureUniqueApplicationSlug } from "@/lib/doctors/ensure-unique-application-slug";
import { parseLocationInput } from "@/lib/doctors/parse-location";

export type DraftApplicationInput = {
  fullName: string;
  email: string;
  licenseNumber: string;
  bio: string;
  specialty: DirectorySpecialty;
  language: DirectoryLanguage;
  location: string;
  photoUrl?: string;
};

export async function createDraftDoctorApplication(
  admin: SupabaseClient,
  input: DraftApplicationInput,
): Promise<{ ok: true; slug: string } | { ok: false; message: string }> {
  const slug = await ensureUniqueApplicationSlug(admin, input.fullName);
  const { city, country } = parseLocationInput(input.location);

  const { error } = await admin.from("doctor_applications").insert({
    full_name: input.fullName,
    email: input.email.toLowerCase(),
    slug,
    license_number: input.licenseNumber,
    bio: input.bio,
    specialties: [input.specialty],
    languages: [input.language],
    city,
    country,
    status: "pending",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, slug };
}
