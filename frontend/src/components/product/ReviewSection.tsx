"use client";

import Link from "next/link";
import { useState } from "react";
import { FaStar } from "react-icons/fa";

import { Rating } from "@/components/ui/Rating";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { submitReview } from "@/lib/services";
import type { Review } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";

export function ReviewSection({
  slug,
  initialReviews,
}: {
  slug: string;
  initialReviews: Review[];
}) {
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const review = await submitReview(slug, { rating, title, body });
      setReviews((prev) => [review, ...prev]);
      setTitle("");
      setBody("");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <h3 className="text-xl font-bold text-secondary dark:text-white">
          Customer reviews ({reviews.length})
        </h3>
        {reviews.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No reviews yet. Be the first to review this product.
          </p>
        )}
        {reviews.map((review) => (
          <div key={review.id} className="card p-5">
            <div className="flex items-center justify-between">
              <Rating value={review.rating} />
              <span className="text-xs text-slate-400">
                {formatDate(review.createdAt)}
              </span>
            </div>
            {review.title && (
              <p className="mt-2 font-semibold text-secondary dark:text-white">
                {review.title}
              </p>
            )}
            {review.body && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {review.body}
              </p>
            )}
            <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
              — {review.author}
            </p>
          </div>
        ))}
      </div>

      <div className="card h-fit p-6">
        <h3 className="text-lg font-bold text-secondary dark:text-white">
          Write a review
        </h3>
        {user ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} stars`}
                >
                  <FaStar
                    className={`h-6 w-6 ${
                      n <= rating ? "text-warning" : "text-slate-300 dark:text-slate-600"
                    }`}
                  />
                </button>
              ))}
            </div>
            <input
              className="input"
              placeholder="Review title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="input min-h-[100px]"
              placeholder="Share your experience…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Submitting…" : "Submit review"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Please{" "}
            <Link href="/login" className="font-semibold text-primary">
              sign in
            </Link>{" "}
            to write a review.
          </p>
        )}
      </div>
    </div>
  );
}
