import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { doctorApplicationSchema } from "@/lib/validations/doctor-application";

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  const body = await req.json();
  const parsed = doctorApplicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid doctor application", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const slug = slugify(parsed.data.fullName);
  const { error } = await supabaseAdmin.from("doctor_applications").insert({
    full_name: parsed.data.fullName,
    email: parsed.data.email.toLowerCase(),
    license_number: parsed.data.licenseNumber,
    bio: parsed.data.bio ?? null,
    credentials: parsed.data.credentials ?? null,
    specialties: parsed.data.specialties,
    languages: parsed.data.languages,
    city: parsed.data.city ?? null,
    country: parsed.data.country ?? null,
    slug,
    status: "pending",
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to submit doctor application", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
