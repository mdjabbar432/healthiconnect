import { NextResponse } from "next/server";
import { buildDoctorSessionProfile } from "@/lib/doctors/build-doctor-session-profile";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Returns the signed-in doctor's session profile (bypasses RLS).
 * Used when the browser client cannot read `doctors` (missing columns, policy edge cases).
 */
export async function GET(req: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const userId = authData.user?.id;

  if (authError || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctor = await buildDoctorSessionProfile(admin, userId);

  if (!doctor) {
    return NextResponse.json(
      { error: "Doctor profile not found for this account." },
      { status: 404 },
    );
  }

  return NextResponse.json(doctor);
}
