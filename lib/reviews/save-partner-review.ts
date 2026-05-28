import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

export type SavePartnerReviewInput = {
  partnerId: number;
  patientId: string;
  rating: number;
  reviewText: string;
};

export type SavedPartnerReviewRow = {
  id: number;
  rating: number;
  review_text: string | null;
  created_at: string;
  patient_id: string;
};

const REVIEW_SELECT = "id, rating, review_text, created_at, patient_id";

async function fetchExistingReviewId(
  admin: SupabaseClient,
  partnerId: number,
  patientId: string,
): Promise<{ id: number | null; error: PostgrestError | null }> {
  const { data, error } = await admin
    .from("partner_reviews")
    .select("id")
    .eq("partner_id", partnerId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error) {
    return { id: null, error };
  }

  return { id: data?.id ?? null, error: null };
}

export async function savePartnerReview(
  admin: SupabaseClient,
  input: SavePartnerReviewInput,
): Promise<{ row: SavedPartnerReviewRow | null; error: PostgrestError | null }> {
  const payload = {
    partner_id: input.partnerId,
    patient_id: input.patientId,
    rating: input.rating,
    review_text: input.reviewText,
    is_visible: true,
  };

  const { id: existingId, error: lookupError } = await fetchExistingReviewId(
    admin,
    input.partnerId,
    input.patientId,
  );

  if (lookupError) {
    return { row: null, error: lookupError };
  }

  if (existingId != null) {
    const { data, error } = await admin
      .from("partner_reviews")
      .update({
        rating: input.rating,
        review_text: input.reviewText,
        is_visible: true,
      })
      .eq("id", existingId)
      .select(REVIEW_SELECT)
      .maybeSingle();

    if (!error && data) {
      return { row: data as SavedPartnerReviewRow, error: null };
    }

    if (error) {
      return { row: null, error };
    }
  }

  const { data, error } = await admin
    .from("partner_reviews")
    .insert(payload)
    .select(REVIEW_SELECT)
    .maybeSingle();

  if (!error && data) {
    return { row: data as SavedPartnerReviewRow, error: null };
  }

  if (error?.code === "23505") {
    const retryLookup = await fetchExistingReviewId(
      admin,
      input.partnerId,
      input.patientId,
    );
    if (retryLookup.id != null) {
      const { data: updated, error: updateError } = await admin
        .from("partner_reviews")
        .update({
          rating: input.rating,
          review_text: input.reviewText,
          is_visible: true,
        })
        .eq("id", retryLookup.id)
        .select(REVIEW_SELECT)
        .maybeSingle();

      return {
        row: (updated as SavedPartnerReviewRow | null) ?? null,
        error: updateError,
      };
    }
  }

  if (error) {
    return { row: null, error };
  }

  return { row: null, error: null };
}
