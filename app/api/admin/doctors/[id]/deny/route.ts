import { NextResponse } from "next/server";
import { denyDoctorById } from "@/lib/admin/deny-doctor";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, context: RouteContext) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const doctorId = id?.trim();

  if (!doctorId) {
    return NextResponse.json({ error: "Doctor id is required." }, { status: 400 });
  }

  const { error } = await denyDoctorById(admin, doctorId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to deny doctor", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id: doctorId });
}
