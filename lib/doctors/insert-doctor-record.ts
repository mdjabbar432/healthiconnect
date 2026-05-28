import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { parseLocationInput } from "@/lib/doctors/parse-location";
import { isPostgrestSchemaError } from "@/lib/supabase/postgrest-schema-error";

export type DoctorRecordInput = {
  id: string;
  slug: string;
  email: string;
  licenseNumber: string;
  bio: string;
  language: string;
  location: string;
  photoUrl?: string;
};

/** Stores license in `credentials` when `license_number` column is not deployed yet. */
export function licenseAsCredentials(licenseNumber: string): string {
  return `Medical license: ${licenseNumber.trim()}`;
}

/**
 * Inserts a pending doctor row, supporting both migrated and legacy Supabase schemas.
 */
export async function insertDoctorRecord(
  admin: SupabaseClient,
  input: DoctorRecordInput,
): Promise<{ error: PostgrestError | null }> {
  const email = input.email.toLowerCase();
  const { city, country } = parseLocationInput(input.location);
  const photoUrl = input.photoUrl?.trim() || null;

  const fullRow = {
    id: input.id,
    slug: input.slug,
    email,
    license_number: input.licenseNumber,
    bio: input.bio,
    languages: [input.language],
    city,
    country,
    photo_url: photoUrl,
    status: "pending" as const,
    is_approved: false,
  };

  let result = await admin.from("doctors").insert(fullRow);

  if (!result.error) {
    return { error: null };
  }

  if (!isPostgrestSchemaError(result.error)) {
    return { error: result.error };
  }

  const withoutApprovalFlag = {
    id: input.id,
    slug: input.slug,
    email,
    license_number: input.licenseNumber,
    bio: input.bio,
    languages: [input.language],
    city,
    country,
    photo_url: photoUrl,
    status: "pending" as const,
  };

  result = await admin.from("doctors").insert(withoutApprovalFlag);

  if (!result.error) {
    return { error: null };
  }

  if (!isPostgrestSchemaError(result.error)) {
    return { error: result.error };
  }

  const legacyRow = {
    id: input.id,
    slug: input.slug,
    email,
    bio: input.bio,
    languages: [input.language],
    city,
    country,
    photo_url: photoUrl,
    credentials: licenseAsCredentials(input.licenseNumber),
    status: "pending" as const,
  };

  result = await admin.from("doctors").insert(legacyRow);
  return { error: result.error };
}
