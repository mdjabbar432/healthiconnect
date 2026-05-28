import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

export type SaveDoctorReviewInput = {
  doctorId: string;
  patientId: string;
  rating: number;
  reviewText: string;
};

export type SavedDoctorReviewRow = {
  id: number;
  rating: number;
  review_text: string | null;
  created_at: string;
  patient_id: string;
};

const REVIEW_SELECT = "id, rating, review_text, created_at, patient_id";

async function fetchExistingReviewId(
  admin: SupabaseClient,
  doctorId: string,
  patientId: string,
): Promise<{ id: number | null; error: PostgrestError | null }> {
  const { data, error } = await admin
    .from("doctor_reviews")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error) {
    return { id: null, error };
  }

  return { id: data?.id ?? null, error: null };
}

/**
 * Inserts or updates a row in `doctor_reviews` using base schema columns only
 * (`doctor_id`, `patient_id`, `rating`, `review_text`, `is_visible`).
 */
export async function saveDoctorReview(
  admin: SupabaseClient,
  input: SaveDoctorReviewInput,
): Promise<{ row: SavedDoctorReviewRow | null; error: PostgrestError | null }> {
  const payload = {
    doctor_id: input.doctorId,
    patient_id: input.patientId,
    rating: input.rating,
    review_text: input.reviewText,
    is_visible: true,
  };

  const { id: existingId, error: lookupError } = await fetchExistingReviewId(
    admin,
    input.doctorId,
    input.patientId,
  );

  if (lookupError) {
    return { row: null, error: lookupError };
  }

  if (existingId != null) {
    const { data, error } = await admin
      .from("doctor_reviews")
      .update({
        rating: input.rating,
        review_text: input.reviewText,
        is_visible: true,
      })
      .eq("id", existingId)
      .select(REVIEW_SELECT)
      .maybeSingle();

    if (!error && data) {
      return { row: data as SavedDoctorReviewRow, error: null };
    }

    if (error) {
      return { row: null, error };
    }
  }

  const { data, error } = await admin
    .from("doctor_reviews")
    .insert(payload)
    .select(REVIEW_SELECT)
    .maybeSingle();

  if (!error && data) {
    return { row: data as SavedDoctorReviewRow, error: null };
  }

  if (error?.code === "23505") {
    const retryLookup = await fetchExistingReviewId(
      admin,
      input.doctorId,
      input.patientId,
    );
    if (retryLookup.id != null) {
      const { data: updated, error: updateError } = await admin
        .from("doctor_reviews")
        .update({
          rating: input.rating,
          review_text: input.reviewText,
          is_visible: true,
        })
        .eq("id", retryLookup.id)
        .select(REVIEW_SELECT)
        .maybeSingle();

      return {
        row: (updated as SavedDoctorReviewRow | null) ?? null,
        error: updateError,
      };
    }
  }

  if (error) {
    return { row: null, error };
  }

  const refetch = await fetchExistingReviewId(
    admin,
    input.doctorId,
    input.patientId,
  );

  if (refetch.id != null) {
    const { data: row, error: refetchError } = await admin
      .from("doctor_reviews")
      .select(REVIEW_SELECT)
      .eq("id", refetch.id)
      .maybeSingle();

    return {
      row: (row as SavedDoctorReviewRow | null) ?? null,
      error: refetchError,
    };
  }

  return { row: null, error: null };
}
