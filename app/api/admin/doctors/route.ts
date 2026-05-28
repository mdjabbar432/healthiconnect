import { NextResponse } from "next/server";
import { fetchAdminDoctors } from "@/lib/admin/fetch-admin-doctors";
import { fetchPendingAdminDoctors } from "@/lib/admin/fetch-pending-doctors";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  const pendingOnly = new URL(req.url).searchParams.get("pending") === "true";
  const { doctors, error } = pendingOnly
    ? await fetchPendingAdminDoctors(admin)
    : await fetchAdminDoctors(admin);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load doctors", details: error },
      { status: 500 },
    );
  }

  return NextResponse.json({ doctors });
}
