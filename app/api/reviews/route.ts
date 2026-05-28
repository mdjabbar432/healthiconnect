import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { mapReviewRowToDisplayItem } from "@/lib/reviews/map-review-display";
import { saveDoctorReview } from "@/lib/reviews/save-doctor-review";
import { savePartnerReview } from "@/lib/reviews/save-partner-review";
import { submitReviewSchema } from "@/lib/validations/review";

export const runtime = "nodejs";

function extractBearerToken(req: Request): string | null {
  const header =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase is not configured on the server." },
        { status: 503 },
      );
    }

    const accessToken = extractBearerToken(req);
    if (!accessToken) {
      return NextResponse.json(
        { error: "You must be signed in to submit a review." },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      console.error("[POST /api/reviews] auth.getUser failed:", authError);
      return NextResponse.json(
        { error: "Invalid or expired session. Please sign in again." },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch (parseBodyError) {
      console.error("[POST /api/reviews] Invalid JSON body:", parseBodyError);
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = submitReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid review payload",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[POST /api/reviews] profiles lookup failed:", profileError);
    }

    if (profileError || profile?.role !== "patient") {
      return NextResponse.json(
        { error: "Only patient accounts can submit reviews." },
        { status: 403 },
      );
    }

    const patientId = user.id;

    const { data: patientRow, error: patientError } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .maybeSingle();

    if (patientError) {
      console.error("[POST /api/reviews] patients lookup failed:", patientError);
    }

    if (patientError || !patientRow) {
      return NextResponse.json(
        {
          error:
            "Your patient profile is not set up yet. Complete patient registration first.",
          details: patientError?.message,
        },
        { status: 403 },
      );
    }

    const { targetType, targetId, rating, reviewText } = parsed.data;

    if (targetType === "doctor") {
      const { data: doctor, error: doctorError } = await supabaseAdmin
        .from("doctors")
        .select("id")
        .eq("id", targetId)
        .eq("status", "approved")
        .maybeSingle();

      if (doctorError || !doctor) {
        console.error("[POST /api/reviews] doctor lookup failed:", {
          doctorError,
          targetId,
        });
        return NextResponse.json(
          { error: "Doctor not found or not available for reviews." },
          { status: 404 },
        );
      }

      const { row: saved, error: saveError } = await saveDoctorReview(
        supabaseAdmin,
        {
          doctorId: targetId,
          patientId,
          rating,
          reviewText,
        },
      );

      if (saveError) {
        console.error("[POST /api/reviews] doctor_reviews save failed:", {
          code: saveError.code,
          message: saveError.message,
          details: saveError.details,
          hint: saveError.hint,
          doctorId: targetId,
          patientId,
        });

        return NextResponse.json(
          {
            error: "Failed to save doctor review",
            details: saveError.message,
            code: saveError.code,
          },
          { status: 500 },
        );
      }

      if (!saved) {
        return NextResponse.json(
          {
            error: "Failed to save doctor review",
            details: "No review row was returned after save.",
          },
          { status: 500 },
        );
      }

      const review = mapReviewRowToDisplayItem(
        saved,
        profile.full_name?.trim() || "Patient",
      );

      return NextResponse.json({ success: true, review });
    }

    const partnerId = Number(targetId);
    if (!Number.isFinite(partnerId) || partnerId < 1) {
      return NextResponse.json({ error: "Invalid partner id." }, { status: 400 });
    }

    const { data: partner, error: partnerError } = await supabaseAdmin
      .from("partners")
      .select("id")
      .eq("id", partnerId)
      .eq("is_active", true)
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: "Partner not found or not available for reviews." },
        { status: 404 },
      );
    }

    const { row: savedPartnerReview, error: savePartnerError } =
      await savePartnerReview(supabaseAdmin, {
        partnerId,
        patientId,
        rating,
        reviewText,
      });

    if (savePartnerError) {
      return NextResponse.json(
        {
          error: "Failed to save partner review",
          details: savePartnerError.message,
          code: savePartnerError.code,
        },
        { status: 500 },
      );
    }

    if (!savedPartnerReview) {
      return NextResponse.json(
        {
          error: "Failed to save partner review",
          details: "No review row was returned after save.",
        },
        { status: 500 },
      );
    }

    const review = mapReviewRowToDisplayItem(
      savedPartnerReview,
      profile.full_name?.trim() || "Patient",
    );

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("[POST /api/reviews] Unhandled exception:", error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json(
      { error: "Failed to save review", details: message },
      { status: 500 },
    );
  }
}
