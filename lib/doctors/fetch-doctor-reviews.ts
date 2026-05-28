import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";

export type DoctorReviewRow = {
  id: number;
  rating: number;
  reviewText: string | null;
  createdAt: string;
  isVisible: boolean;
};

export async function fetchDoctorReviews(
  doctorId: string,
): Promise<{ reviews: DoctorReviewRow[]; error: string | null }> {
  if (!isSupabaseClientConfigured()) {
    return { reviews: [], error: "Supabase is not configured." };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { reviews: [], error: "Supabase is not configured." };
  }

  const { data, error } = await client
    .from("doctor_reviews")
    .select("id, rating, review_text, created_at, is_visible")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false });

  if (error) {
    return { reviews: [], error: error.message };
  }

  const reviews: DoctorReviewRow[] = (data ?? []).map((row) => ({
    id: row.id as number,
    rating: row.rating as number,
    reviewText: (row.review_text as string | null) ?? null,
    createdAt: row.created_at as string,
    isVisible: Boolean(row.is_visible),
  }));

  return { reviews, error: null };
}
