import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PartnerReviewDisplayItem } from "@/lib/reviews/fetch-partner-reviews";
import { mapReviewRowToDisplayItem } from "@/lib/reviews/map-review-display";
import type { SavedPartnerReviewRow } from "@/lib/reviews/save-partner-review";

const REVIEW_SELECT = "id, rating, review_text, created_at, patient_id";

export type SubmitPartnerReviewInput = {
  partnerId: number;
  patientId: string;
  patientName: string;
  rating: number;
  reviewText: string;
};

export type SubmitPartnerReviewResult =
  | { ok: true; review: PartnerReviewDisplayItem }
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
  input: SubmitPartnerReviewInput,
): Promise<{ row: SavedPartnerReviewRow | null; error: PostgrestError | null }> {
  const { partnerId, patientId, rating, reviewText } = input;

  const { data: existing, error: lookupError } = await client
    .from("partner_reviews")
    .select("id")
    .eq("partner_id", partnerId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (lookupError) {
    return { row: null, error: lookupError };
  }

  if (existing?.id != null) {
    const { data, error } = await client
      .from("partner_reviews")
      .update({
        rating,
        review_text: reviewText,
        is_visible: true,
      })
      .eq("id", existing.id)
      .select(REVIEW_SELECT)
      .maybeSingle();

    return { row: (data as SavedPartnerReviewRow | null) ?? null, error };
  }

  const { data, error } = await client
    .from("partner_reviews")
    .insert({
      partner_id: partnerId,
      patient_id: patientId,
      rating,
      review_text: reviewText,
      is_visible: true,
    })
    .select(REVIEW_SELECT)
    .maybeSingle();

  if (error?.code === "23505") {
    const { data: updated, error: updateError } = await client
      .from("partner_reviews")
      .update({
        rating,
        review_text: reviewText,
        is_visible: true,
      })
      .eq("partner_id", partnerId)
      .eq("patient_id", patientId)
      .select(REVIEW_SELECT)
      .maybeSingle();

    return {
      row: (updated as SavedPartnerReviewRow | null) ?? null,
      error: updateError,
    };
  }

  return { row: (data as SavedPartnerReviewRow | null) ?? null, error };
}

async function upsertReviewWithApi(
  accessToken: string,
  input: SubmitPartnerReviewInput,
): Promise<SubmitPartnerReviewResult> {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      targetType: "partner",
      targetId: String(input.partnerId),
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
    review?: PartnerReviewDisplayItem;
  } = {};

  if (rawText.trim()) {
    try {
      payload = JSON.parse(rawText) as typeof payload;
    } catch (parseError) {
      console.error("[submitPartnerReview] API returned non-JSON:", {
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

export async function submitPartnerReview(
  input: SubmitPartnerReviewInput,
  accessToken: string,
): Promise<SubmitPartnerReviewResult> {
  if (!input.patientId?.trim()) {
    return { ok: false, error: "Patient session is missing. Please sign in again." };
  }

  if (!Number.isFinite(input.partnerId) || input.partnerId < 1) {
    return { ok: false, error: "Partner id is missing." };
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

    if (error) {
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
