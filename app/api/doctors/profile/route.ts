import { NextResponse } from "next/server";
import { updateDoctorProfile } from "@/lib/doctors/update-doctor-profile";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { doctorProfileUpdateSchema } from "@/lib/validations/doctor-profile-update";

async function authenticateDoctor(req: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      error: NextResponse.json(
        { error: "Supabase is not configured on the server." },
        { status: 503 },
      ),
    };
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const userId = authData.user?.id;

  if (authError || !userId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "doctor") {
    return {
      error: NextResponse.json({ error: "Doctor profile required." }, { status: 403 }),
    };
  }

  const { data: doctor } = await admin
    .from("doctors")
    .select("id, status, is_approved")
    .eq("id", userId)
    .maybeSingle();

  if (!doctor) {
    return {
      error: NextResponse.json({ error: "Doctor record not found." }, { status: 404 }),
    };
  }

  const approved =
    doctor.is_approved === true || (doctor.status as string) === "approved";

  if (!approved) {
    return {
      error: NextResponse.json(
        { error: "Profile updates are available after admin approval." },
        { status: 403 },
      ),
    };
  }

  return { admin, userId };
}

export async function PATCH(req: Request) {
  const auth = await authenticateDoctor(req);
  if ("error" in auth && auth.error) return auth.error;

  const { admin, userId } = auth as { admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>; userId: string };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = doctorProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await updateDoctorProfile(admin, userId, parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: "Failed to update profile", details: result.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
