import { NextResponse } from "next/server";
import { approveDoctorById } from "@/lib/admin/approve-doctor";
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

  const { error } = await approveDoctorById(admin, doctorId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to approve doctor", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id: doctorId });
}
