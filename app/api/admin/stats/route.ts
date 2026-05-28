import { NextResponse } from "next/server";
import { fetchAdminSystemStats } from "@/lib/admin/fetch-admin-stats";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  const { stats, error } = await fetchAdminSystemStats(admin);

  if (error || !stats) {
    return NextResponse.json(
      { error: "Failed to load system stats", details: error },
      { status: 500 },
    );
  }

  return NextResponse.json({ stats });
}
