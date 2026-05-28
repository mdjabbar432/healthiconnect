import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";
import { formatDoctorLocation } from "@/lib/doctors/format-location";
import type { DirectoryLanguage } from "@/lib/constants/languages";
import type { DirectorySpecialty } from "@/lib/constants/specialties";

export type DoctorProfileDetails = {
  bio: string;
  specialty: DirectorySpecialty | "";
  language: DirectoryLanguage | "";
  location: string;
  photoUrl: string | null;
};

type SpecialtyJoin = {
  specialties:
    | { name: string | null }
    | Array<{ name: string | null }>
    | null;
} | null;

function primarySpecialty(
  links: SpecialtyJoin[] | null | undefined,
): DirectorySpecialty | "" {
  const first = links?.[0];
  const spec = first?.specialties;
  const name = Array.isArray(spec) ? spec[0]?.name : spec?.name;
  return (name?.trim() as DirectorySpecialty) || "";
}

export async function fetchDoctorProfileDetails(
  doctorId: string,
): Promise<{ profile: DoctorProfileDetails | null; error: string | null }> {
  if (!isSupabaseClientConfigured()) {
    return { profile: null, error: "Supabase is not configured." };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { profile: null, error: "Supabase is not configured." };
  }

  const { data, error } = await client
    .from("doctors")
    .select(
      "bio, languages, city, country, photo_url, doctor_specialties(specialties(name))",
    )
    .eq("id", doctorId)
    .maybeSingle();

  if (error) {
    return { profile: null, error: error.message };
  }

  if (!data) {
    return { profile: null, error: null };
  }

  const languages = (data.languages as string[] | null) ?? [];
  const language = (languages[0]?.trim() as DirectoryLanguage) || "";

  return {
    profile: {
      bio: (data.bio as string | null) ?? "",
      specialty: primarySpecialty(
        data.doctor_specialties as SpecialtyJoin[] | null,
      ),
      language,
      location: formatDoctorLocation(
        data.city as string | null,
        data.country as string | null,
      ),
      photoUrl: (data.photo_url as string | null) ?? null,
    },
    error: null,
  };
}
