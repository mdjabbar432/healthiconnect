import { NextResponse } from "next/server";
import { fetchProfileRoleByUserId } from "@/lib/auth/fetch-profile-role";
import { isProfileRole } from "@/lib/auth/profile-role";
import {
  createSupabaseServerClient,
  isSupabaseAnonConfigured,
} from "@/lib/supabase/server-client";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  const token = header?.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

/**
 * Returns the signed-in user's `profiles.role` via service role (bypasses RLS).
 * Accepts a Bearer access token, or falls back to the cookie session.
 */
export async function GET(req: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  let userId: string | null = null;
  const token = bearerToken(req);

  if (token) {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = data.user.id;
  } else if (isSupabaseAnonConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = data.user.id;
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = await fetchProfileRoleByUserId(userId);
  if (!role || !isProfileRole(role)) {
    return NextResponse.json(
      { error: "Profile not found for this account." },
      { status: 404 },
    );
  }

  return NextResponse.json({ userId, role });
}
