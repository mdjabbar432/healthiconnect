import { type NextRequest, NextResponse } from "next/server";
import { fetchProfileRoleByUserId } from "@/lib/auth/fetch-profile-role";
import { isProfileRole } from "@/lib/auth/profile-role";
import {
  isAccessAllowedForZone,
  isPublicProtectedPath,
  LOGIN_PATH,
  resolveRouteZone,
} from "@/lib/auth/route-access";
import { withTimeout } from "@/lib/auth/with-timeout";
import { updateSession } from "@/lib/supabase/middleware";

const ROLE_LOOKUP_TIMEOUT_MS = 8_000;

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.search = "";
  if (pathname !== LOGIN_PATH) {
    loginUrl.searchParams.set("redirect", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /login is not in the matcher; keep this guard to avoid a redirect loop
  // if the matcher is expanded later.
  if (pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`)) {
    return NextResponse.next();
  }

  const zone = resolveRouteZone(pathname);

  if (!zone || isPublicProtectedPath(pathname, zone)) {
    return NextResponse.next();
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (!user) {
    return redirectToLogin(request, pathname);
  }

  let role: string | null = null;
  try {
    role = await withTimeout(
      fetchProfileRoleByUserId(user.id),
      ROLE_LOOKUP_TIMEOUT_MS,
      "role lookup timed out",
    );
  } catch {
    role = null;
  }

  // Fallback: own-row select (profiles_self_select) if service-role lookup is unavailable.
  if (!role && supabase) {
    try {
      const { data } = await withTimeout(
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        ROLE_LOOKUP_TIMEOUT_MS,
        "role lookup timed out",
      );
      const fallbackRole = typeof data?.role === "string" ? data.role : null;
      role = isProfileRole(fallbackRole) ? fallbackRole : null;
    } catch {
      role = null;
    }
  }

  // Authenticated admins must reach /admin even if they are not on the email allowlist.
  if (zone === "admin" && role === "admin") {
    return supabaseResponse;
  }

  if (!isAccessAllowedForZone(zone, { email: user.email, role })) {
    return redirectToLogin(request, pathname);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/doctor",
    "/doctor/:path*",
    "/agent",
    "/agent/:path*",
  ],
};
