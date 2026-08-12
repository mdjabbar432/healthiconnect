export const LOGIN_PATH = "/login" as const;

export type ProtectedRouteZone = "admin" | "doctor" | "agent";

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
