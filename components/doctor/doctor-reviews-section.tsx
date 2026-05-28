"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Star } from "lucide-react";
import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";
import { fetchPatientSession } from "@/lib/patients/fetch-patient-session";
import type { DoctorReviewDisplayItem } from "@/lib/reviews/fetch-doctor-reviews";
import { submitDoctorReview } from "@/lib/reviews/submit-doctor-review";

type DoctorReviewsSectionProps = {
  doctorId: string;
  doctorName: string;
  initialReviews: DoctorReviewDisplayItem[];
  initialAverageRating: number | null;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function StarRatingDisplay({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const starClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div
      className="inline-flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < rating;
        return (
          <Star
            key={index}
            className={`${starClass} ${
              filled ? "fill-amber-400 text-amber-400" : "text-slate-200"
            }`}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? value;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="inline-flex items-center gap-1"
        role="radiogroup"
        aria-label="Rating"
      >
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const filled = starValue <= active;

          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={value === starValue}
              disabled={disabled}
              onMouseEnter={() => setHovered(starValue)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(starValue)}
              onBlur={() => setHovered(null)}
              onClick={() => onChange(starValue)}
              className="rounded p-0.5 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hc-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Star
                className={`h-8 w-8 ${
                  filled ? "fill-amber-400 text-amber-400" : "text-slate-300"
                }`}
                aria-hidden
              />
              <span className="sr-only">{starValue} stars</span>
            </button>
          );
        })}
      </div>
      <span className="text-sm font-semibold text-slate-600">
        {value > 0 ? `${value} / 5` : "Select a rating"}
      </span>
    </div>
  );
}

export function DoctorReviewsSection({
  doctorId,
  doctorName,
  initialReviews,
  initialAverageRating,
}: DoctorReviewsSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [patientSession, setPatientSession] = useState<
    Awaited<ReturnType<typeof fetchPatientSession>>
  >(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });

  useEffect(() => {
    if (!isSupabaseClientConfigured()) {
      setAuthLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSession() {
      const session = await fetchPatientSession();
      if (!cancelled) {
        setPatientSession(session);
        setAuthLoading(false);
      }
    }

    void loadSession();

    const client = getSupabaseClient();
    if (!client) return;

    const { data: subscription } = client.auth.onAuthStateChange(() => {
      void loadSession();
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  function recomputeAverage(nextReviews: DoctorReviewDisplayItem[]) {
    if (nextReviews.length === 0) {
      setAverageRating(null);
      return;
    }
    const sum = nextReviews.reduce((total, review) => total + review.rating, 0);
    setAverageRating(Math.round((sum / nextReviews.length) * 10) / 10);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!patientSession) return;
    if (rating < 1) {
      setSubmitState({
        status: "error",
        message: "Please select a star rating before submitting.",
      });
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setSubmitState({
        status: "error",
        message: "Please write your review before submitting.",
      });
      return;
    }

    setSubmitState({ status: "submitting" });

    const client = getSupabaseClient();
    if (!client) {
      setSubmitState({
        status: "error",
        message: "Authentication is not configured.",
      });
      return;
    }

    const { data: sessionData } = await client.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setSubmitState({
        status: "error",
        message: "Your session expired. Please sign in again.",
      });
      return;
    }

    try {
      const result = await submitDoctorReview(
        {
          doctorId,
          patientId: patientSession.userId,
          patientName: patientSession.fullName,
          rating,
          reviewText: trimmedComment,
        },
        accessToken,
      );

      if (!result.ok) {
        setSubmitState({
          status: "error",
          message: result.error,
        });
        return;
      }

      const savedReview = result.review;
      const withoutExisting = reviews.filter(
        (review) => review.id !== savedReview.id,
      );
      const nextReviews = [savedReview, ...withoutExisting];

      setReviews(nextReviews);
      recomputeAverage(nextReviews);

      setComment("");
      setRating(0);
      setSubmitState({
        status: "success",
        message: "Thank you! Your review has been published.",
      });
    } catch (error) {
      console.error("[DoctorReviewsSection] Submit review threw:", error);
      if (error instanceof Error) {
        console.error("[DoctorReviewsSection] Error message:", error.message);
        console.error("[DoctorReviewsSection] Error stack:", error.stack);
      }

      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Unknown error";

      setSubmitState({
        status: "error",
        message: `Could not save your review: ${message}`,
      });
    }
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby="doctor-reviews-heading"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="doctor-reviews-heading"
            className="text-xl font-bold text-hc-brand"
          >
            Patient reviews
          </h2>
          <p className="mt-1 text-sm text-hc-muted">
            See what patients say about {doctorName}.
          </p>
        </div>
        {averageRating != null ? (
          <div className="flex items-center gap-3 rounded-xl bg-[rgba(38,118,127,0.08)] px-4 py-2.5">
            <span className="text-2xl font-bold text-hc-brand">
              {averageRating.toFixed(1)}
            </span>
            <div>
              <StarRatingDisplay rating={Math.round(averageRating)} />
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mb-8 rounded-xl border border-slate-100 bg-slate-50/70 p-5">
        <h3 className="text-base font-bold text-slate-800">Leave a review</h3>

        {authLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Checking sign-in status...
          </div>
        ) : patientSession ? (
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Your rating
              </label>
              <StarRatingInput
                value={rating}
                onChange={setRating}
                disabled={submitState.status === "submitting"}
              />
            </div>

            <div>
              <label
                htmlFor="review-comment"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Your feedback
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                maxLength={2000}
                disabled={submitState.status === "submitting"}
                placeholder={`Share your experience with ${doctorName}...`}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-hc-brand focus:ring-2 focus:ring-hc-brand/20 disabled:opacity-60"
              />
            </div>

            {submitState.status === "error" ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {submitState.message}
              </p>
            ) : null}

            {submitState.status === "success" ? (
              <p className="text-sm font-medium text-emerald-700" role="status">
                {submitState.message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitState.status === "submitting"}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-hc-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-hc-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hc-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitState.status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </form>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
            <p>
              Sign in with a patient account to leave a review for this doctor.
            </p>
            <Link
              href={`/sign-in?redirect=${encodeURIComponent(`/doctors/${doctorId}`)}`}
              className="mt-3 inline-flex rounded-[10px] bg-hc-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-hc-brand-hover"
            >
              Sign in to review
            </Link>
            <p className="mt-2 text-xs text-slate-500">
              New here?{" "}
              <Link
                href={`/sign-up?redirect=${encodeURIComponent(`/doctors/${doctorId}`)}`}
                className="font-semibold text-hc-brand hover:underline"
              >
                Create a free account
              </Link>
            </p>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-center text-sm text-hc-muted">
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <ul className="space-y-4" aria-label="Doctor reviews list">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-slate-100 bg-slate-50/50 px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">
                    {review.authorName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {review.createdAt}
                  </p>
                </div>
                <StarRatingDisplay rating={review.rating} size="sm" />
              </div>
              {review.comment ? (
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {review.comment}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
