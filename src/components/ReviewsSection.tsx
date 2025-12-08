import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { apiGet, apiPost } from "../lib/api";
import type { Review } from "../types/review";
import { Button, Card, SectionTitle, InputField, TextareaField } from "./ui";

const buildStars = (count: number) => {
  const full = Math.min(5, Math.max(0, Math.round(count)));
  return Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
};

const RATING_OPTIONS = [5, 4, 3, 2, 1];

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", rating: 5, message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const response = await apiGet("/reviews?limit=50");
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error ?? `Failed to load reviews (${response.status}).`);
        }
        const data = (await response.json()) as Review[];
        if (mounted) setReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        if (mounted) setError((err as Error)?.message ?? "Unable to load reviews.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((t, r) => t + Number(r.rating ?? 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const ratingCounts = useMemo<Record<number, number>>(
    () =>
      RATING_OPTIONS.reduce<Record<number, number>>((acc, r) => {
        acc[r] = reviews.filter((rev) => Number(rev.rating) === r).length;
        return acc;
      }, {}),
    [reviews]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    if (!form.message.trim()) {
      setStatus({ type: "error", message: "Please share a few words about your experience." });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        rating: Number(form.rating),
        message: form.message.trim(),
      };
      const response = await apiPost("/reviews", payload);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Unable to submit review.");
      }
      const saved = await response.json();
      setReviews((prev) => [saved, ...prev]);
      setForm({ name: "", rating: 5, message: "" });
      setStatus({ type: "success", message: "Thank you for sharing your routine!" });
    } catch (err) {
      console.error("Failed to submit review:", err);
      const message = (err as Error)?.message ?? "Unable to submit review.";
      setStatus({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="reviews-section" data-animate="fade-up">
      <div className="reviews-header">
        <Card className="reviews-summary-card hover-lift" data-animate="fade-up">
          <div>
            <p className="reviews-eyebrow">Our community&apos;s experiences</p>
            <SectionTitle
              title="Customer Reviews"
              subtitle="Discover how NaturaGloss routines have elevated everyday moments."
            />
            <p className="reviews-average">
              <span className="reviews-stars" aria-hidden="true">
                {buildStars(averageRating)}
              </span>
              <span className="reviews-average-score">
                {averageRating ? averageRating.toFixed(1) : "0.0"} / 5.0 · {reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </p>
          </div>

          <div className="reviews-distribution">
            {RATING_OPTIONS.map((rating) => (
              <div key={rating} className="reviews-distribution__row">
                <span aria-hidden="true">{buildStars(rating)}</span>
                <div className="reviews-distribution__bar">
                  <div
                    className="reviews-distribution__fill"
                    style={{
                      width: reviews.length ? `${(ratingCounts[rating] / reviews.length) * 100}%` : 0,
                    }}
                  />
                </div>
                <span>{ratingCounts[rating] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>

        <form className="reviews-form" onSubmit={handleSubmit}>
          <Card className="reviews-form-card">
            <SectionTitle title="Share your routine" subtitle="Tell us about your NaturaGloss moment." />
            <div className="reviews-form__grid">
              <InputField
                label="Your name"
                name="name"
                placeholder="Anonymous"
                value={form.name}
                onChange={handleChange}
                maxLength={80}
                containerClassName="reviews-form__field"
              />
              <div className="reviews-form__field">
                <span>Rating</span>
                <select name="rating" value={form.rating} onChange={handleChange}>
                  {RATING_OPTIONS.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} {rating === 1 ? "Star" : "Stars"}
                    </option>
                  ))}
                </select>
              </div>
              <TextareaField
                label="Your experience"
                name="message"
                placeholder="Tell us about your routine..."
                rows={4}
                value={form.message}
                onChange={handleChange}
                maxLength={1000}
                required
                containerClassName="reviews-form__field reviews-form__field--wide"
              />
            </div>
            <Button type="submit" variant="primary" disabled={submitting} className="reviews-submit">
              {submitting ? "Sending..." : "Share review"}
            </Button>
            {status && (
              <p
                className={`reviews-status ${
                  status.type === "error" ? "reviews-status--error" : "reviews-status--success"
                }`}
              >
                {status.message}
              </p>
            )}
          </Card>
        </form>
      </div>

      <div className="reviews-list">
        {loading ? (
          <p>Loading reviews…</p>
        ) : error ? (
          <p className="reviews-status reviews-status--error">{error}</p>
        ) : reviews.length === 0 ? (
          <p className="reviews-empty">No stories yet — be the first to share your routine.</p>
        ) : (
          reviews.map((review, index) => (
            <Card
              key={review.mongoId ?? `${review.name}-${review.createdAt}`}
              className="review-card hover-lift"
              data-animate="fade-up"
              style={{ "--motion-delay": `${index * 70}ms` } as React.CSSProperties}
            >
              <header>
                <div>
                  <p className="review-card__stars" aria-hidden="true">
                    {buildStars(review.rating)}
                  </p>
                  <h3>{review.name || "Anonymous"}</h3>
                </div>
                <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString()}</time>
              </header>
              <p>{review.message}</p>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
