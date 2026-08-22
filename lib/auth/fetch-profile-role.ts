import { isProfileRole, type ProfileRole } from "@/lib/auth/profile-role";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type { ProfileRole };

/**
 * Reads `profiles.role` with the service-role client so RLS cannot hide or
 * deadlock the lookup (e.g. policies that call `current_user_role()`).
 */
export async function fetchProfileRoleByUserId(
  userId: string,
): Promise<ProfileRole | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[fetchProfileRoleByUserId]", error.message);
    return null;
  }

  const role = typeof data?.role === "string" ? data.role : null;
  return isProfileRole(role) ? role : null;
}
