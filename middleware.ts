import { type NextRequest, NextResponse } from "next/server";
import {
  isEmailAllowedForZone,
  isPublicProtectedPath,
  LOGIN_PATH,
  resolveRouteZone,
} from "@/lib/auth/route-access";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const zone = resolveRouteZone(pathname);

  if (!zone || isPublicProtectedPath(pathname, zone)) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);
  const email = user?.email;

  if (!email || !isEmailAllowedForZone(email, zone)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
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
