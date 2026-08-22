import { isProfileRole, type ProfileRole } from "@/lib/auth/profile-role";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";

export const LOGIN_PATH = "/login" as const;

export type ProtectedRouteZone = "admin" | "doctor" | "agent";

const ZONE_HOME: Record<ProtectedRouteZone, string> = {
  admin: "/admin/dashboard",
  doctor: "/doctor/dashboard",
  agent: "/agent/dashboard",
};

type RouteZoneConfig = {
  prefix: string;
  allowedEmails: readonly string[];
  /** Paths under the zone prefix that remain public (login, register, etc.). */
  publicPaths?: readonly string[];
};

export const ROUTE_ZONES: Record<ProtectedRouteZone, RouteZoneConfig> = {
  admin: {
    prefix: "/admin",
    allowedEmails: [
      "admin@healthiconnect.com",
      "partners@healthiconnect.com",
      "devmdjabbar@gmail.com",
    ],
  },
  doctor: {
    prefix: "/doctor",
    allowedEmails: ["doc@healthiconnect.com"],
    publicPaths: ["/doctor/login", "/doctor/register"],
  },
  agent: {
    prefix: "/agent",
    allowedEmails: ["agent@healthiconnect.com"],
    publicPaths: ["/agent/sign-in", "/agent/sign-up"],
  },
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function resolveRouteZone(pathname: string): ProtectedRouteZone | null {
  for (const zone of Object.keys(ROUTE_ZONES) as ProtectedRouteZone[]) {
    if (matchesPathPrefix(pathname, ROUTE_ZONES[zone].prefix)) {
      return zone;
    }
  }
  return null;
}

export function isPublicProtectedPath(
  pathname: string,
  zone: ProtectedRouteZone,
): boolean {
  const publicPaths = ROUTE_ZONES[zone].publicPaths;
  if (!publicPaths?.length) return false;

  return publicPaths.some((publicPath) => matchesPathPrefix(pathname, publicPath));
}

export function isEmailAllowedForZone(
  email: string,
  zone: ProtectedRouteZone,
): boolean {
  const normalized = normalizeEmail(email);
  return ROUTE_ZONES[zone].allowedEmails.some(
    (allowed) => normalizeEmail(allowed) === normalized,
  );
}

/** True when `email` may access `pathname`, or when `pathname` is not zone-protected. */
export function isEmailAllowedForPath(email: string, pathname: string): boolean {
  const zone = resolveRouteZone(pathname);
  if (!zone) return true;
  return isEmailAllowedForZone(email, zone);
}

export function isRoleAllowedForZone(
  role: string | null | undefined,
  zone: ProtectedRouteZone,
): boolean {
  return role === zone;
}

/** Zone index paths (`/admin`) have no page; send users to the dashboard. */
export function normalizeProtectedRootPath(pathname: string): string {
  if (pathname === "/admin") return ZONE_HOME.admin;
  if (pathname === "/doctor") return ZONE_HOME.doctor;
  if (pathname === "/agent") return ZONE_HOME.agent;
  return pathname;
}

export function defaultPathForRole(role: ProfileRole): string {
  if (role === "admin") return ZONE_HOME.admin;
  if (role === "doctor") return ZONE_HOME.doctor;
  if (role === "agent") return ZONE_HOME.agent;
  return "/patient/dashboard";
}

/**
 * Access is granted when `profiles.role` matches the zone (preferred) or when
 * the email is on the demo allowlist (fallback if a profile row is missing).
 */
export function isAccessAllowedForZone(
  zone: ProtectedRouteZone,
  input: { email?: string | null; role?: string | null },
): boolean {
  if (isRoleAllowedForZone(input.role, zone)) return true;
  if (input.email && isEmailAllowedForZone(input.email, zone)) return true;
  return false;
}

export function isRoleAllowedForPath(
  role: string | null | undefined,
  pathname: string,
): boolean {
  const zone = resolveRouteZone(pathname);
  if (!zone) return true;
  return isRoleAllowedForZone(role, zone);
}

export function resolvePostLoginPath(
  role: string,
  redirectTo?: string | null,
): string {
  const fallback = isProfileRole(role) ? defaultPathForRole(role) : "/";
  const requested = normalizeProtectedRootPath(
    sanitizeRedirectPath(redirectTo, fallback),
  );

  if (isRoleAllowedForPath(role, requested)) return requested;
  return fallback;
}
