import { getSupabaseAdmin, isSupabaseServerConfigured } from "@/lib/supabase/server";

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

const DIRECTORY_SELECT =
  "id, slug, bio, credentials, city, country, photo_url, languages, created_at, profiles!doctors_id_fkey(full_name), doctor_specialties(specialties(name))";

const DIRECTORY_SELECT_FALLBACK =
  "id, slug, bio, credentials, city, country, photo_url, languages, created_at, profiles(full_name), doctor_specialties(specialties(name))";

const DIRECTORY_SELECT_BY_NAME =
  "id, slug, bio, credentials, city, country, photo_url, languages, created_at, profiles!doctors_id_fkey!inner(full_name), doctor_specialties(specialties(name))";

const DIRECTORY_SELECT_BY_NAME_FALLBACK =
  "id, slug, bio, credentials, city, country, photo_url, languages, created_at, profiles!inner(full_name), doctor_specialties(specialties(name))";

function ilikePattern(term: string): string {
  const escaped = term.replace(/[%_\\]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
}

function mergeDoctorRows(
  batches: (DoctorDirectoryRow[] | null | undefined)[],
): DoctorDirectoryRow[] {
  const byId = new Map<string, DoctorDirectoryRow>();

  for (const batch of batches) {
    for (const row of batch ?? []) {
      if (!row?.id) continue;
      if (!byId.has(row.id)) {
        byId.set(row.id, row);
      }
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

type QueryBatch = {
  doctors: DoctorDirectoryRow[];
  error: string | null;
};

type ApprovedDoctorsQuery = {
  data: DoctorDirectoryRow[] | null;
  error: string | null;
};

export type FetchDirectoryDoctorsFilters = {
  search?: string;
  specialty?: string;
  language?: string;
  location?: string;
};

async function queryApprovedDoctors(
  primarySelect: string,
  fallbackSelect: string,
  options?: {
    doctorIds?: string[];
    language?: string;
    location?: string;
  },
): Promise<ApprovedDoctorsQuery> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { data: null, error: "Supabase client unavailable" };
  }

  const locationPattern = options?.location
    ? ilikePattern(options.location.trim())
    : null;
  const language = options?.language?.trim();

  const applyFilters = (query: any) => {
    let next = query;
    if (options?.doctorIds && options.doctorIds.length > 0) {
      next = next.in("id", options.doctorIds);
    }
    if (language) {
      next = next.contains("languages", [language]);
    }
    if (locationPattern) {
      next = next.or(`city.ilike.${locationPattern},country.ilike.${locationPattern}`);
    }
    return next;
  };

  const primary = await applyFilters(
    admin
    .from("doctors")
    .select(primarySelect)
    .eq("status", "approved")
    .order("created_at", { ascending: false }),
  );

  if (!primary.error) {
    return {
      data: (primary.data ?? []) as unknown as DoctorDirectoryRow[],
      error: null,
    };
  }

  console.warn(
    "[fetchDirectoryDoctors] Primary select failed, using fallback:",
    primary.error.message,
  );

  const fallback = await applyFilters(
    admin
    .from("doctors")
    .select(fallbackSelect)
    .eq("status", "approved")
    .order("created_at", { ascending: false }),
  );

  if (fallback.error) {
    return { data: null, error: fallback.error.message };
  }

  return { data: (fallback.data ?? []) as unknown as DoctorDirectoryRow[], error: null };
}

/** Approved doctors linked to specialties whose name matches the pattern. */
async function fetchDoctorsBySpecialtyName(
  pattern: string,
): Promise<QueryBatch> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { doctors: [], error: "Supabase client unavailable" };
  }

  const { data: specs, error: specErr } = await admin
    .from("specialties")
    .select("id")
    .ilike("name", pattern);

  if (specErr) {
    return { doctors: [], error: specErr.message };
  }

  const specialtyIds = (specs ?? [])
    .map((row) => row.id)
    .filter((id): id is number => id != null);

  if (specialtyIds.length === 0) {
    return { doctors: [], error: null };
  }

  const { data: links, error: linkErr } = await admin
    .from("doctor_specialties")
    .select("doctor_id")
    .in("specialty_id", specialtyIds);

  if (linkErr) {
    return { doctors: [], error: linkErr.message };
  }

  const doctorIds = [
    ...new Set(
      (links ?? [])
        .map((row) => row.doctor_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  if (doctorIds.length === 0) {
    return { doctors: [], error: null };
  }

  const primary = await admin
    .from("doctors")
    .select(DIRECTORY_SELECT)
    .eq("status", "approved")
    .in("id", doctorIds);

  if (!primary.error) {
    return {
      doctors: (primary.data ?? []) as DoctorDirectoryRow[],
      error: null,
    };
  }

  const fallback = await admin
    .from("doctors")
    .select(DIRECTORY_SELECT_FALLBACK)
    .eq("status", "approved")
    .in("id", doctorIds);

  if (fallback.error) {
    return { doctors: [], error: fallback.error.message };
  }

  return {
    doctors: (fallback.data ?? []) as DoctorDirectoryRow[],
    error: null,
  };
}

async function fetchDoctorIdsBySpecialtyName(
  specialty: string,
): Promise<{ doctorIds: string[]; error: string | null }> {
  const pattern = ilikePattern(specialty);
  const bySpecialty = await fetchDoctorsBySpecialtyName(pattern);
  if (bySpecialty.error) {
    return { doctorIds: [], error: bySpecialty.error };
  }
  return {
    doctorIds: [...new Set(bySpecialty.doctors.map((doctor) => doctor.id))],
    error: null,
  };
}

/** Case-insensitive partial match on doctor name or specialty (and related profile text). */
async function fetchBySearchOrFilter(
  pattern: string,
): Promise<{ doctors: DoctorDirectoryRow[]; error: string | null }> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { doctors: [], error: "Supabase client unavailable" };
  }

  const [byNamePrimary, byBio, byCredentials, bySpecialty] = await Promise.all([
    admin
      .from("doctors")
      .select(DIRECTORY_SELECT_BY_NAME)
      .eq("status", "approved")
      .ilike("profiles.full_name", pattern),
    admin
      .from("doctors")
      .select(DIRECTORY_SELECT)
      .eq("status", "approved")
      .ilike("bio", pattern),
    admin
      .from("doctors")
      .select(DIRECTORY_SELECT)
      .eq("status", "approved")
      .ilike("credentials", pattern),
    fetchDoctorsBySpecialtyName(pattern),
  ]);

  let byName = byNamePrimary;
  if (byNamePrimary.error) {
    byName = await admin
      .from("doctors")
      .select(DIRECTORY_SELECT_BY_NAME_FALLBACK)
      .eq("status", "approved")
      .ilike("profiles.full_name", pattern);
  }

  const batches: (DoctorDirectoryRow[] | null | undefined)[] = [
    byName.data as DoctorDirectoryRow[] | null,
    byBio.data as DoctorDirectoryRow[] | null,
    byCredentials.data as DoctorDirectoryRow[] | null,
    bySpecialty.doctors,
  ];

  const queryErrors = [
    byName.error?.message,
    byBio.error?.message,
    byCredentials.error?.message,
    bySpecialty.error,
  ].filter((message): message is string => Boolean(message));

  const hasData = batches.some((batch) => (batch?.length ?? 0) > 0);
  if (queryErrors.length > 0 && !hasData) {
    return { doctors: [], error: queryErrors[0] };
  }

  return {
    doctors: mergeDoctorRows(batches),
    error: null,
  };
}

export async function fetchDirectoryDoctors(
  filters?: FetchDirectoryDoctorsFilters,
): Promise<{
  doctors: DoctorDirectoryRow[];
  error: string | null;
}> {
  if (!isSupabaseServerConfigured()) {
    return {
      doctors: [],
      error:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    };
  }

  const trimmedSearch = filters?.search?.trim() ?? "";
  const trimmedSpecialty = filters?.specialty?.trim() ?? "";
  const trimmedLanguage = filters?.language?.trim() ?? "";
  const trimmedLocation = filters?.location?.trim() ?? "";

  try {
    let specialtyDoctorIds: string[] | undefined;
    if (trimmedSpecialty) {
      const bySpecialty = await fetchDoctorIdsBySpecialtyName(trimmedSpecialty);
      if (bySpecialty.error) {
        return { doctors: [], error: bySpecialty.error };
      }
      if (bySpecialty.doctorIds.length === 0) {
        return { doctors: [], error: null };
      }
      specialtyDoctorIds = bySpecialty.doctorIds;
    }

    if (!trimmedSearch) {
      const result = await queryApprovedDoctors(
        DIRECTORY_SELECT,
        DIRECTORY_SELECT_FALLBACK,
        {
          doctorIds: specialtyDoctorIds,
          language: trimmedLanguage || undefined,
          location: trimmedLocation || undefined,
        },
      );

      if (result.error) {
        return { doctors: [], error: result.error };
      }

      return { doctors: result.data ?? [], error: null };
    }

    const pattern = ilikePattern(trimmedSearch);
    const searched = await fetchBySearchOrFilter(pattern);
    if (searched.error) return searched;

    const filtered = searched.doctors.filter((doctor) => {
      if (specialtyDoctorIds && !specialtyDoctorIds.includes(doctor.id)) {
        return false;
      }
      if (trimmedLanguage) {
        const hasLanguage = (doctor.languages ?? []).some(
          (lang) => lang.toLowerCase() === trimmedLanguage.toLowerCase(),
        );
        if (!hasLanguage) return false;
      }
      if (trimmedLocation) {
        const needle = trimmedLocation.toLowerCase();
        const haystack = `${doctor.city ?? ""} ${doctor.country ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    return { doctors: filtered, error: null };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Failed to load doctors";
    console.error("[fetchDirectoryDoctors]", cause);
    return { doctors: [], error: message };
  }
}
