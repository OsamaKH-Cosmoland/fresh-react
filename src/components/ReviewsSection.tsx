import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { apiGet, apiPost } from "../lib/api";
import type { Review } from "../types/review";
import { Button, Card, SectionTitle, InputField, TextareaField } from "./ui";
import { getLogger } from "@/logging/globalLogger";
import { useTranslation } from "@/localization/locale";

const buildStars = (count: number) => {
  const full = Math.min(5, Math.max(0, Math.round(count)));
  return Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
};

const RATING_OPTIONS = [5, 4, 3, 2, 1];

export default function ReviewsSection() {
  const { t } = useTranslation();
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
        getLogger().error("Failed to fetch reviews", { error: err });
        if (mounted) setError((err as Error)?.message ?? t("reviews.errors.load"));
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
      setStatus({ type: "error", message: t("reviews.form.errors.body") });
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
        throw new Error(body?.error ?? t("reviews.errors.submit"));
      }
      const saved = await response.json();
      setReviews((prev) => [saved, ...prev]);
      setForm({ name: "", rating: 5, message: "" });
      setStatus({ type: "success", message: t("reviews.form.thankYou") });
    } catch (err) {
      getLogger().error("Failed to submit review", { error: err });
      const message = (err as Error)?.message ?? t("reviews.errors.submit");
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
            <p className="reviews-eyebrow">{t("reviews.eyebrow")}</p>
            <SectionTitle
              title={t("reviews.sectionTitle")}
              subtitle={t("reviews.sectionSubtitle")}
            />
            <p className="reviews-average">
              <span className="reviews-stars" aria-hidden="true">
                {buildStars(averageRating)}
              </span>
              <span className="reviews-average-score">
                {averageRating ? averageRating.toFixed(1) : "0.0"} / 5.0 · {reviews.length}{" "}
                {reviews.length === 1
                  ? t("reviews.summary.reviewLabelSingular")
                  : t("reviews.summary.reviewLabel")}
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
            <SectionTitle title={t("reviews.form.heading")} subtitle={t("reviews.form.subtitle")} />
            <div className="reviews-form__grid">
              <InputField
                label={t("reviews.form.labels.reviewerName")}
                name="name"
                placeholder={t("reviews.list.anonymous")}
                value={form.name}
                onChange={handleChange}
                maxLength={80}
                containerClassName="reviews-form__field"
              />
              <div className="reviews-form__field">
                <span>{t("reviews.form.labels.rating")}</span>
                <select name="rating" value={form.rating} onChange={handleChange}>
                  {RATING_OPTIONS.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} {rating === 1 ? t("reviews.form.labels.star") : t("reviews.form.labels.stars")}
                    </option>
                  ))}
                </select>
              </div>
              <TextareaField
                label={t("reviews.form.labels.body")}
                name="message"
                placeholder={t("reviews.form.placeholders.body")}
                rows={4}
                value={form.message}
                onChange={handleChange}
                maxLength={1000}
                required
                containerClassName="reviews-form__field reviews-form__field--wide"
              />
            </div>
            <Button type="submit" variant="primary" disabled={submitting} className="reviews-submit">
              {submitting ? t("reviews.form.submitting") : t("reviews.form.submit")}
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
          <p>{t("reviews.loading")}</p>
        ) : error ? (
          <p className="reviews-status reviews-status--error">{error}</p>
        ) : reviews.length === 0 ? (
          <p className="reviews-empty">{t("reviews.list.empty")}</p>
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
                  <h3>{review.name || t("reviews.list.anonymous")}</h3>
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
