import { isDoctorApproved } from "@/lib/doctors/approval-status";
import { getSupabaseAdmin, isSupabaseServerConfigured } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DoctorDirectoryRow = {
  id: string;
  slug: string;
  bio: string | null;
  credentials: string | null;
  city: string | null;
  country: string | null;
  photo_url: string | null;
  languages: string[] | null;
  created_at: string;
  status?: string | null;
  is_approved?: boolean | null;
  profiles:
    | { full_name: string | null }
    | Array<{ full_name: string | null }>
    | null;
  doctor_specialties:
    | Array<{
        specialties:
          | { name: string | null }
          | Array<{ name: string | null }>
          | null;
      } | null>
    | null;
};

type DoctorTableRow = {
  id?: string;
  slug?: string | null;
  bio?: string | null;
  credentials?: string | null;
  city?: string | null;
  country?: string | null;
  photo_url?: string | null;
  languages?: string[] | string | null;
  created_at?: string | null;
  status?: string | null;
  is_approved?: boolean | null;
};

const BASIC_SELECTS = [
  "id, slug, bio, credentials, city, country, photo_url, languages, created_at, status, is_approved",
  "id, slug, bio, credentials, city, country, photo_url, languages, created_at, status",
  "id, slug, bio, credentials, city, country, photo_url, languages, created_at, is_approved",
  "id, slug, bio, credentials, city, country, photo_url, languages, created_at",
  "*",
];

export type FetchDirectoryDoctorsFilters = {
  search?: string;
  specialty?: string;
  language?: string;
  location?: string;
};

function logDoctorFetchError(error: unknown) {
  console.error("Supabase Doctor Fetch Error:", error);
}

function normalizeLanguages(value: DoctorTableRow["languages"]): string[] | null {
  if (Array.isArray(value)) {
    return value.filter((lang): lang is string => typeof lang === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((lang) => lang.trim())
      .filter(Boolean);
  }
  return null;
}

function toDirectoryBaseRow(row: DoctorTableRow): DoctorDirectoryRow | null {
  if (!row?.id) return null;
  return {
    id: row.id,
    slug: row.slug?.trim() || row.id,
    bio: row.bio ?? null,
    credentials: row.credentials ?? null,
    city: row.city ?? null,
    country: row.country ?? null,
    photo_url: row.photo_url ?? null,
    languages: normalizeLanguages(row.languages),
    created_at: row.created_at ?? "",
    status: row.status ?? null,
    is_approved: row.is_approved ?? null,
    profiles: null,
    doctor_specialties: null,
  };
}

function profileName(profiles: DoctorDirectoryRow["profiles"]): string {
  if (!profiles) return "";
  if (Array.isArray(profiles)) return profiles[0]?.full_name?.trim() ?? "";
  return profiles.full_name?.trim() ?? "";
}

function specialtyNames(row: DoctorDirectoryRow): string[] {
  const names: string[] = [];
  for (const entry of row.doctor_specialties ?? []) {
    const spec = entry?.specialties;
    if (!spec) continue;
    if (Array.isArray(spec)) {
      for (const item of spec) {
        if (item?.name?.trim()) names.push(item.name.trim());
      }
    } else if (spec.name?.trim()) {
      names.push(spec.name.trim());
    }
  }
  return names;
}

function preferApprovedRows(rows: DoctorDirectoryRow[]): DoctorDirectoryRow[] {
  const approved = rows.filter((row) =>
    isDoctorApproved({
      status: row.status,
      is_approved: row.is_approved,
    }),
  );
  return approved.length > 0 ? approved : rows;
}

async function fetchBasicDoctorRows(
  admin: SupabaseClient,
): Promise<{ rows: DoctorDirectoryRow[]; error: string | null }> {
  let lastError: string | null = null;

  for (const select of BASIC_SELECTS) {
    const includesStatus = select === "*" || select.includes("status");

    if (includesStatus) {
      const filtered = await admin
        .from("doctors")
        .select(select)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      console.log("Fetched doctors:", filtered.data, "Error:", filtered.error);

      if (!filtered.error) {
        const rows = ((filtered.data ?? []) as DoctorTableRow[])
          .map(toDirectoryBaseRow)
          .filter((row): row is DoctorDirectoryRow => row != null);
        return { rows, error: null };
      }

      logDoctorFetchError(filtered.error);
      lastError = filtered.error.message;
    }

    const unfiltered = await admin
      .from("doctors")
      .select(select)
      .order("created_at", { ascending: false });

    console.log("Fetched doctors:", unfiltered.data, "Error:", unfiltered.error);

    if (!unfiltered.error) {
      const rows = ((unfiltered.data ?? []) as DoctorTableRow[])
        .map(toDirectoryBaseRow)
        .filter((row): row is DoctorDirectoryRow => row != null);
      return { rows: preferApprovedRows(rows), error: null };
    }

    logDoctorFetchError(unfiltered.error);
    lastError = unfiltered.error.message;
  }

  const bare = await admin.from("doctors").select("*");
  console.log("Fetched doctors:", bare.data, "Error:", bare.error);

  if (!bare.error) {
    const rows = ((bare.data ?? []) as DoctorTableRow[])
      .map(toDirectoryBaseRow)
      .filter((row): row is DoctorDirectoryRow => row != null);
    return { rows: preferApprovedRows(rows), error: null };
  }

  logDoctorFetchError(bare.error);
  return { rows: [], error: bare.error.message || lastError || "Failed to load doctors" };
}

async function attachProfiles(
  admin: SupabaseClient,
  rows: DoctorDirectoryRow[],
): Promise<DoctorDirectoryRow[]> {
  const doctorIds = rows.map((row) => row.id);
  if (doctorIds.length === 0) return rows;

  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", doctorIds);

  if (error) {
    logDoctorFetchError(error);
    return rows;
  }

  const nameById = new Map<string, string | null>();
  for (const profile of data ?? []) {
    if (profile?.id) nameById.set(profile.id, profile.full_name ?? null);
  }

  return rows.map((row) => ({
    ...row,
    profiles: { full_name: nameById.get(row.id) ?? null },
  }));
}

async function attachSpecialties(
  admin: SupabaseClient,
  rows: DoctorDirectoryRow[],
): Promise<DoctorDirectoryRow[]> {
  const doctorIds = rows.map((row) => row.id);
  if (doctorIds.length === 0) return rows;

  const linksResult = await admin
    .from("doctor_specialties")
    .select("doctor_id, specialty_id")
    .in("doctor_id", doctorIds);

  if (linksResult.error) {
    logDoctorFetchError(linksResult.error);
    return rows;
  }

  const links = (linksResult.data ?? []).filter(
    (link): link is { doctor_id: string; specialty_id: number } =>
      typeof link?.doctor_id === "string" && link.specialty_id != null,
  );

  if (links.length === 0) return rows;

  const specialtyIds = [...new Set(links.map((link) => link.specialty_id))];
  const specsResult = await admin
    .from("specialties")
    .select("id, name")
    .in("id", specialtyIds);

  if (specsResult.error) {
    logDoctorFetchError(specsResult.error);
    return rows;
  }

  const nameBySpecialtyId = new Map<number, string>();
  for (const spec of specsResult.data ?? []) {
    if (spec?.id != null && spec.name?.trim()) {
      nameBySpecialtyId.set(spec.id, spec.name.trim());
    }
  }

  const specialtiesByDoctor = new Map<string, string[]>();
  for (const link of links) {
    const name = nameBySpecialtyId.get(link.specialty_id);
    if (!name) continue;
    const current = specialtiesByDoctor.get(link.doctor_id) ?? [];
    if (!current.includes(name)) current.push(name);
    specialtiesByDoctor.set(link.doctor_id, current);
  }

  return rows.map((row) => ({
    ...row,
    doctor_specialties: (specialtiesByDoctor.get(row.id) ?? []).map((name) => ({
      specialties: { name },
    })),
  }));
}

function matchesSearch(row: DoctorDirectoryRow, search: string): boolean {
  const needle = search.toLowerCase();
  const haystack = [
    profileName(row.profiles),
    row.bio ?? "",
    row.credentials ?? "",
    ...specialtyNames(row),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function matchesSpecialty(row: DoctorDirectoryRow, specialty: string): boolean {
  const needle = specialty.toLowerCase();
  if (specialtyNames(row).some((name) => name.toLowerCase().includes(needle))) {
    return true;
  }
  const bio = row.bio?.trim().toLowerCase() ?? "";
  const credentials = row.credentials?.trim().toLowerCase() ?? "";
  return bio.includes(needle) || credentials.includes(needle);
}

function matchesLanguage(row: DoctorDirectoryRow, language: string): boolean {
  const needle = language.toLowerCase();
  return (row.languages ?? []).some((lang) => lang.toLowerCase() === needle);
}

function matchesLocation(row: DoctorDirectoryRow, location: string): boolean {
  const needle = location.toLowerCase();
  const haystack = `${row.city ?? ""} ${row.country ?? ""}`.toLowerCase();
  return haystack.includes(needle);
}

export async function fetchDirectoryDoctors(
  filters?: FetchDirectoryDoctorsFilters,
): Promise<{
  doctors: DoctorDirectoryRow[];
  error: string | null;
}> {
  if (!isSupabaseServerConfigured()) {
    const error =
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.";
    logDoctorFetchError(error);
    return { doctors: [], error };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    const error = "Supabase client unavailable";
    logDoctorFetchError(error);
    return { doctors: [], error };
  }

  try {
    const basic = await fetchBasicDoctorRows(admin);
    if (basic.error) {
      return { doctors: [], error: basic.error };
    }

    const withProfiles = await attachProfiles(admin, basic.rows);
    const doctors = await attachSpecialties(admin, withProfiles);

    const trimmedSearch = filters?.search?.trim() ?? "";
    const trimmedSpecialty = filters?.specialty?.trim() ?? "";
    const trimmedLanguage = filters?.language?.trim() ?? "";
    const trimmedLocation = filters?.location?.trim() ?? "";

    const filtered = doctors.filter((row) => {
      if (trimmedSearch && !matchesSearch(row, trimmedSearch)) return false;
      if (trimmedSpecialty && !matchesSpecialty(row, trimmedSpecialty)) return false;
      if (trimmedLanguage && !matchesLanguage(row, trimmedLanguage)) return false;
      if (trimmedLocation && !matchesLocation(row, trimmedLocation)) return false;
      return true;
    });

    return { doctors: filtered, error: null };
  } catch (cause) {
    logDoctorFetchError(cause);
    const message =
      cause instanceof Error ? cause.message : "Failed to load doctors";
    return { doctors: [], error: message };
  }
}
