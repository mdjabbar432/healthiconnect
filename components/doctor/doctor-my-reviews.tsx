"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Star } from "lucide-react";
import {
  fetchDoctorReviews,
  type DoctorReviewRow,
} from "@/lib/doctors/fetch-doctor-reviews";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < rating;
        return (
          <Star
            key={index}
            className={`h-4 w-4 ${filled ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

function formatReviewDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export type DoctorMyReviewsProps = {
  doctorId: string;
  compact?: boolean;
};

export function DoctorMyReviews({ doctorId, compact = false }: DoctorMyReviewsProps) {
  const [reviews, setReviews] = useState<DoctorReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await fetchDoctorReviews(doctorId);
      if (cancelled) return;
      setReviews(result.reviews);
      setError(result.error);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, row) => sum + row.rating, 0) / reviews.length
      : null;

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${
        compact ? "p-5" : "p-6"
      }`}
      aria-labelledby="doctor-my-reviews-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-lg bg-[rgba(38,118,127,0.09)] p-2 text-hc-brand">
            <MessageSquare className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2
              id="doctor-my-reviews-heading"
              className="text-lg font-semibold text-slate-900"
            >
              My Reviews
            </h2>
            <p className="text-sm text-slate-600">
              Star ratings and feedback from your patients.
            </p>
          </div>
        </div>
        {average != null ? (
          <p className="text-sm font-medium text-slate-700">
            Average:{" "}
            <span className="text-lg font-bold text-slate-900">
              {average.toFixed(1)}
            </span>
            <span className="text-slate-500"> / 5</span>
            <span className="text-slate-400"> · {reviews.length} review(s)</span>
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center py-8" aria-busy="true">
          <Loader2 className="h-7 w-7 animate-spin text-hc-brand" />
        </div>
      ) : error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : reviews.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          No reviews yet. Patients can leave a rating after choosing you as their
          doctor.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StarRating rating={review.rating} />
                <time
                  className="text-xs text-slate-500"
                  dateTime={review.createdAt}
                >
                  {formatReviewDate(review.createdAt)}
                </time>
              </div>
              {review.reviewText ? (
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {review.reviewText}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-slate-500">No written review.</p>
              )}
              {!review.isVisible ? (
                <p className="mt-2 text-xs text-amber-700">Hidden from public directory</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
