import { getSupabaseAdmin } from "@/lib/supabase/server";

export type DoctorReviewRow = {
  id: number;
  doctor_id: string;
  patient_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
};

export type DoctorReviewDisplayItem = {
  id: number;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: string;
};

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function fetchVisibleDoctorReviews(
  doctorId: string,
): Promise<{ reviews: DoctorReviewDisplayItem[]; error: string | null }> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { reviews: [], error: "Supabase client unavailable" };
  }

  const { data: rows, error } = await admin
    .from("doctor_reviews")
    .select("id, doctor_id, patient_id, rating, review_text, created_at")
    .eq("doctor_id", doctorId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { reviews: [], error: error.message };
  }

  const reviewRows = (rows ?? []) as DoctorReviewRow[];
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

  const reviews: DoctorReviewDisplayItem[] = reviewRows.map((row) => {
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

export function averageReviewRating(reviews: DoctorReviewDisplayItem[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
