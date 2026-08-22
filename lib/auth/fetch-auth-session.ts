import { isProfileRole, type ProfileRole } from "@/lib/auth/profile-role";
import { withTimeout } from "@/lib/auth/with-timeout";

export type AuthSessionPayload = {
  userId: string;
  role: ProfileRole;
};

const SESSION_TIMEOUT_MS = 10_000;

/**
 * Loads the current user's role from the server (service-role profiles lookup).
 * Prefer passing `accessToken` right after sign-in so we do not wait on cookies.
 */
export async function fetchAuthSessionFromApi(
  accessToken?: string,
): Promise<AuthSessionPayload | null> {
  const headers: HeadersInit = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await withTimeout(
    fetch("/api/auth/session", {
      method: "GET",
      headers,
      cache: "no-store",
      credentials: "include",
    }),
    SESSION_TIMEOUT_MS,
    "Timed out while verifying your account. Please try again.",
  );

  if (!res.ok) return null;

  const body = (await res.json()) as { userId?: unknown; role?: unknown };
  if (typeof body.userId !== "string" || !isProfileRole(body.role)) {
    return null;
  }

  return { userId: body.userId, role: body.role };
}
