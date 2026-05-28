import { NextResponse } from "next/server";
import { buildPatientDashboardData } from "@/lib/patients/build-patient-dashboard-data";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Server-side dashboard snapshot (bypasses RLS). Used when the client cannot
 * read linked agent rows or doctor profile names.
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

  const dashboard = await buildPatientDashboardData(admin, userId);

  if (!dashboard) {
    return NextResponse.json({ error: "Patient profile not found." }, { status: 404 });
  }

  return NextResponse.json(dashboard);
}
