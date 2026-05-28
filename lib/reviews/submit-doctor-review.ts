import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { DoctorReviewDisplayItem } from "@/lib/reviews/fetch-doctor-reviews";
import { mapReviewRowToDisplayItem } from "@/lib/reviews/map-review-display";
import type { SavedDoctorReviewRow } from "@/lib/reviews/save-doctor-review";

const REVIEW_SELECT = "id, rating, review_text, created_at, patient_id";

export type SubmitDoctorReviewInput = {
  doctorId: string;
  patientId: string;
  patientName: string;
  rating: number;
  reviewText: string;
};

export type SubmitDoctorReviewResult =
  | { ok: true; review: DoctorReviewDisplayItem }
  | { ok: false; error: string; code?: string; cause?: unknown };

function formatPostgrestError(error: PostgrestError): string {
  const parts = [
    error.message,
    error.code ? `(${error.code})` : null,
    error.details ? String(error.details) : null,
    error.hint ? String(error.hint) : null,
  ].filter(Boolean);

  return parts.join(" ");
}

async function upsertReviewWithClient(
  client: SupabaseClient,
  input: SubmitDoctorReviewInput,
): Promise<{ row: SavedDoctorReviewRow | null; error: PostgrestError | null }> {
  const { doctorId, patientId, rating, reviewText } = input;

  const { data: existing, error: lookupError } = await client
    .from("doctor_reviews")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (lookupError) {
    return { row: null, error: lookupError };
  }

  if (existing?.id != null) {
    const { data, error } = await client
      .from("doctor_reviews")
      .update({
        rating,
        review_text: reviewText,
        is_visible: true,
      })
      .eq("id", existing.id)
      .select(REVIEW_SELECT)
      .maybeSingle();

    return { row: (data as SavedDoctorReviewRow | null) ?? null, error };
  }

  const { data, error } = await client
    .from("doctor_reviews")
    .insert({
      doctor_id: doctorId,
      patient_id: patientId,
      rating,
      review_text: reviewText,
      is_visible: true,
    })
    .select(REVIEW_SELECT)
    .maybeSingle();

  if (error?.code === "23505") {
    const { data: updated, error: updateError } = await client
      .from("doctor_reviews")
      .update({
        rating,
        review_text: reviewText,
        is_visible: true,
      })
      .eq("doctor_id", doctorId)
      .eq("patient_id", patientId)
      .select(REVIEW_SELECT)
      .maybeSingle();

    return {
      row: (updated as SavedDoctorReviewRow | null) ?? null,
      error: updateError,
    };
  }

  return { row: (data as SavedDoctorReviewRow | null) ?? null, error };
}

async function upsertReviewWithApi(
  accessToken: string,
  input: SubmitDoctorReviewInput,
): Promise<SubmitDoctorReviewResult> {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      targetType: "doctor",
      targetId: input.doctorId,
      rating: input.rating,
      reviewText: input.reviewText,
    }),
  });

  const rawText = await res.text();
  let payload: {
    success?: boolean;
    error?: string;
    details?: unknown;
    code?: string;
    review?: DoctorReviewDisplayItem;
  } = {};

  if (rawText.trim()) {
    try {
      payload = JSON.parse(rawText) as typeof payload;
    } catch (parseError) {
      console.error("[submitDoctorReview] API returned non-JSON:", {
        status: res.status,
        rawText: rawText.slice(0, 500),
        parseError,
      });
      return {
        ok: false,
        error: `Server returned an invalid response (${res.status}).`,
        cause: parseError,
      };
    }
  }

  if (!res.ok || !payload.success || !payload.review) {
    const detail =
      typeof payload.details === "string"
        ? payload.details
        : payload.details != null
          ? JSON.stringify(payload.details)
          : "";

    console.error("[submitDoctorReview] API error response:", {
      status: res.status,
      payload,
    });

    return {
      ok: false,
      error: detail
        ? `${payload.error ?? "Failed to save review"}: ${detail}`
        : (payload.error ?? `Failed to save review (${res.status}).`),
      code: payload.code,
    };
  }

  return { ok: true, review: payload.review };
}

/**
 * Saves a doctor review using the logged-in patient's Supabase session (RLS),
 * then falls back to the server API route when needed.
 */
export async function submitDoctorReview(
  input: SubmitDoctorReviewInput,
  accessToken: string,
): Promise<SubmitDoctorReviewResult> {
  if (!input.patientId?.trim()) {
    return { ok: false, error: "Patient session is missing. Please sign in again." };
  }

  if (!input.doctorId?.trim()) {
    return { ok: false, error: "Doctor id is missing." };
  }

  const client = getSupabaseClient();

  if (client) {
    const { row, error } = await upsertReviewWithClient(client, input);

    if (!error && row) {
      return {
        ok: true,
        review: mapReviewRowToDisplayItem(row, input.patientName),
      };
    }

    if (!error && !row) {
      console.warn(
        "[submitDoctorReview] client write succeeded but no row returned; trying API fallback",
        { doctorId: input.doctorId, patientId: input.patientId },
      );
    }

    if (error) {
      console.error("[submitDoctorReview] client save failed:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        doctorId: input.doctorId,
        patientId: input.patientId,
      });

      const isPermissionOrMissingTable =
        error.code === "42501" ||
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message.toLowerCase().includes("permission") ||
        error.message.toLowerCase().includes("does not exist");

      if (!isPermissionOrMissingTable) {
        return {
          ok: false,
          error: formatPostgrestError(error),
          code: error.code,
          cause: error,
        };
      }
    }
  }

  return upsertReviewWithApi(accessToken, input);
}
