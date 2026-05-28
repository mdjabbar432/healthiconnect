import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DoctorReviewDisplayItem } from "@/lib/reviews/fetch-doctor-reviews";
import { averageReviewRating } from "@/lib/reviews/fetch-doctor-reviews";

export type PartnerReviewDisplayItem = DoctorReviewDisplayItem;

type PartnerReviewRow = {
  id: number;
  partner_id: number;
  patient_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
};

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function fetchVisiblePartnerReviews(
  partnerId: number,
): Promise<{ reviews: PartnerReviewDisplayItem[]; error: string | null }> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { reviews: [], error: "Supabase client unavailable" };
  }

  const { data: rows, error } = await admin
    .from("partner_reviews")
    .select("id, partner_id, patient_id, rating, review_text, created_at")
    .eq("partner_id", partnerId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { reviews: [], error: error.message };
  }

  const reviewRows = (rows ?? []) as PartnerReviewRow[];
  if (reviewRows.length === 0) {
    return { reviews: [], error: null };
  }

  const patientIds = [...new Set(reviewRows.map((row) => row.patient_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", patientIds);

  const nameByPatientId = new Map<string, string>();
  for (const profile of profiles ?? []) {
    const name = profile.full_name?.trim();
    if (name) nameByPatientId.set(profile.id, name);
  }

  const reviews: PartnerReviewDisplayItem[] = reviewRows.map((row) => {
    const fullName = nameByPatientId.get(row.patient_id) ?? "Patient";

    return {
      id: row.id,
      rating: row.rating,
      comment: row.review_text,
      authorName: fullName,
      createdAt: formatReviewDate(row.created_at),
    };
  });

  return { reviews, error: null };
}

export { averageReviewRating };
