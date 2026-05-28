import type { DoctorDirectoryItem } from "@/components/doctor-directory";
import type { DoctorDirectoryRow } from "@/lib/doctors/fetch-directory-doctors";

function resolveFullName(profiles: DoctorDirectoryRow["profiles"]): string {
  if (!profiles) return "Doctor";
  if (Array.isArray(profiles)) {
    return profiles[0]?.full_name?.trim() || "Doctor";
  }
  return profiles.full_name?.trim() || "Doctor";
}

function isLikelySpecialtyLabel(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 80 && !trimmed.includes("\n");
}

function resolveSpecialties(row: DoctorDirectoryRow): string[] {
  const names = new Set<string>();

  for (const entry of row.doctor_specialties ?? []) {
    const spec = entry?.specialties;
    if (!spec) continue;
    if (Array.isArray(spec)) {
      for (const item of spec) {
        if (item?.name?.trim()) names.add(item.name.trim());
      }
    } else if (spec.name?.trim()) {
      names.add(spec.name.trim());
    }
  }

  if (names.size === 0) {
    const bio = row.bio?.trim();
    const credentials = row.credentials?.trim();
    if (bio && isLikelySpecialtyLabel(bio)) names.add(bio);
    if (credentials && isLikelySpecialtyLabel(credentials)) names.add(credentials);
  }

  return [...names];
}

export function mapDirectoryRowToItem(row: DoctorDirectoryRow): DoctorDirectoryItem {
  return {
    id: row.id,
    slug: row.slug,
    fullName: resolveFullName(row.profiles),
    bio: row.bio,
    credentials: row.credentials,
    city: row.city,
    country: row.country,
    photoUrl: row.photo_url,
    languages: (row.languages ?? []).filter((lang) => lang.trim().length > 0),
    specialties: resolveSpecialties(row),
  };
}

export function mapDirectoryRowsToItems(
  rows: DoctorDirectoryRow[],
): DoctorDirectoryItem[] {
  return rows.map(mapDirectoryRowToItem);
}
