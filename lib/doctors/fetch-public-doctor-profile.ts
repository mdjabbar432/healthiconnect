import { safeDecodePathSegment, slugify } from "@/lib/slugify";
import {
  getSupabaseAdmin,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server";

export type SpecialtyRelation =
  | { name: string | null }
  | Array<{ name: string | null }>
  | null;

export type PublicDoctorProfile = {
  id: string;
  slug: string;
  bio: string | null;
  credentials: string | null;
  city: string | null;
  country: string | null;
  photo_url: string | null;
  languages: string[] | null;
  license_number: string | null;
  created_at: string;
  profiles:
    | { full_name: string | null }
    | Array<{ full_name: string | null }>
    | null;
  doctor_specialties: Array<{ specialties: SpecialtyRelation }> | null;
};

const doctorProfileSelect =
  "*, profiles!doctors_id_fkey(full_name), doctor_specialties(specialties(name))";

const doctorProfileFallbackSelect =
  "*, profiles(full_name), doctor_specialties(specialties(name))";

const doctorProfileExplicitColumnsSelect =
  "id, slug, bio, credentials, city, country, photo_url, languages, license_number, created_at, profiles!doctors_id_fkey(full_name), doctor_specialties(specialties(name))";

const doctorProfileExplicitColumnsFallbackSelect =
  "id, slug, bio, credentials, city, country, photo_url, languages, license_number, created_at, profiles(full_name), doctor_specialties(specialties(name))";

const PROFILE_SELECTORS = [
  doctorProfileSelect,
  doctorProfileFallbackSelect,
  doctorProfileExplicitColumnsSelect,
  doctorProfileExplicitColumnsFallbackSelect,
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDoctorProfileUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function resolvePublicDoctorFullName(
  profile: PublicDoctorProfile["profiles"],
): string {
  if (!profile) return "Doctor";
  if (Array.isArray(profile)) return profile[0]?.full_name ?? "Doctor";
  return profile.full_name ?? "Doctor";
}

export function resolveSpecialtyName(value: SpecialtyRelation): string | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0]?.name ?? null) : (value.name ?? null);
}

export function publicDoctorSpecialties(row: PublicDoctorProfile): string[] {
  return (
    row.doctor_specialties
      ?.map((entry) => resolveSpecialtyName(entry.specialties))
      .filter((name): name is string => Boolean(name)) ?? []
  );
}

async function fetchApprovedDoctorRow(
  column: "id" | "slug",
  value: string,
): Promise<PublicDoctorProfile | null> {
  const key = value.trim();
  if (!key) return null;

  const admin = getSupabaseAdmin();
  if (!admin) return null;

  for (const selector of PROFILE_SELECTORS) {
    const { data, error } = await admin
      .from("doctors")
      .select(selector)
      .eq(column, key)
      .eq("status", "approved")
      .maybeSingle();

    if (error) {
      console.error(`[fetchPublicDoctorProfile] ${column} lookup error:`, {
        message: error.message,
        column,
        key,
        selector,
      });
      continue;
    }

    if (data != null) {
      return data as unknown as PublicDoctorProfile;
    }
  }

  return null;
}

async function fetchApprovedDoctorBySlug(
  urlSegment: string,
): Promise<PublicDoctorProfile | null> {
  const decoded = safeDecodePathSegment(urlSegment);
  if (!decoded.trim()) return null;

  let row = await fetchApprovedDoctorRow("slug", decoded);
  if (row) return row;

  const slugFromUrl = slugify(decoded);
  if (slugFromUrl && slugFromUrl !== decoded.trim()) {
    row = await fetchApprovedDoctorRow("slug", slugFromUrl);
    if (row) return row;
  }

  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data: slugList, error: listErr } = await admin
    .from("doctors")
    .select("slug")
    .eq("status", "approved");

  if (listErr) {
    console.error("[fetchPublicDoctorProfile] slug list error:", listErr.message);
    return null;
  }

  const target = slugify(decoded);
  if (!target) return null;

  const hit = slugList?.find((r: { slug: string }) => slugify(r.slug) === target);
  if (!hit?.slug) return null;

  return fetchApprovedDoctorRow("slug", hit.slug);
}

/** Resolves an approved doctor by UUID or legacy slug segment. */
export async function fetchApprovedPublicDoctor(
  routeSegment: string,
): Promise<PublicDoctorProfile | null> {
  if (!isSupabaseServerConfigured()) {
    console.error(
      "[fetchPublicDoctorProfile] Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
    return null;
  }

  const decoded = safeDecodePathSegment(routeSegment);
  if (!decoded.trim()) return null;

  if (isDoctorProfileUuid(decoded)) {
    const byId = await fetchApprovedDoctorRow("id", decoded);
    if (byId) return byId;
  }

  return fetchApprovedDoctorBySlug(decoded);
}
