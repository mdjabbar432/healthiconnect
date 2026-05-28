import {
  mapDoctorSessionRow,
  type DoctorSessionProfile,
} from "@/lib/doctors/map-doctor-session-profile";
import { queryDoctorSessionRow } from "@/lib/doctors/query-doctor-session-row";
import { getSupabaseClient } from "@/lib/supabase/client";

export type { DoctorSessionProfile };

async function fetchDoctorProfileFromApi(
  accessToken: string,
): Promise<DoctorSessionProfile | null> {
  try {
    const res = await fetch("/api/doctors/session", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as DoctorSessionProfile;
  } catch {
    return null;
  }
}

/**
 * Loads the doctor row for the current or given auth user.
 * Pending doctors (`is_approved = false`) are returned normally — approval only affects dashboard UI.
 */
export type FetchDoctorProfileOptions = {
  /** Pass right after sign-in to avoid a session race before calling the session API. */
  accessToken?: string;
};

export async function fetchDoctorProfileForUser(
  userId: string,
  options?: FetchDoctorProfileOptions,
): Promise<{ doctor: DoctorSessionProfile | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { doctor: null, error: "Supabase is not configured." };
  }

  const { data: sessionData } = await client.auth.getSession();
  const accessToken =
    options?.accessToken ?? sessionData.session?.access_token ?? undefined;

  const { data, error } = await queryDoctorSessionRow(client, userId);

  if (!error && data) {
    return { doctor: mapDoctorSessionRow(data), error: null };
  }

  if (!error && !data) {
    if (accessToken) {
      const fromApi = await fetchDoctorProfileFromApi(accessToken);
      if (fromApi) {
        return { doctor: fromApi, error: null };
      }
    }
    return { doctor: null, error: null };
  }

  if (accessToken) {
    const fromApi = await fetchDoctorProfileFromApi(accessToken);
    if (fromApi) {
      return { doctor: fromApi, error: null };
    }
  }

  return {
    doctor: null,
    error: error?.message ?? "Could not load doctor profile.",
  };
}
