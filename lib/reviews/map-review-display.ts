import type { DoctorReviewDisplayItem } from "@/lib/reviews/fetch-doctor-reviews";

export type SavedReviewRow = {
  id: number;
  rating: number;
  review_text: string | null;
  created_at: string;
  patient_id: string;
};

export function mapReviewRowToDisplayItem(
  row: SavedReviewRow,
  authorName: string,
): DoctorReviewDisplayItem {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.review_text,
    authorName,
    createdAt: new Date(row.created_at).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}
