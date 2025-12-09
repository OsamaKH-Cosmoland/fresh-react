import { ChangeEvent, FormEvent, KeyboardEvent, useMemo, useState } from "react";
import { Button, Card, InputField, TextareaField } from "@/components/ui";
import { useTranslation } from "@/localization/locale";
import type { ReviewSubmissionInput } from "@/hooks/useReviews";

const RATING_OPTIONS = [5, 4, 3, 2, 1];

export interface ReviewFormProps {
  addReview: (values: ReviewSubmissionInput) => void;
}

export function ReviewForm({ addReview }: ReviewFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    rating: 5,
    title: "",
    body: "",
    photoUrl: "",
    reviewerName: "",
  });
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasBody = useMemo(() => Boolean(form.body.trim()), [form.body]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: name === "rating" ? Number(value) : value }));
  };

  const resetForm = () => {
    setForm({
      rating: 5,
      title: "",
      body: "",
      photoUrl: "",
      reviewerName: "",
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!hasBody) {
      setStatus({ type: "error", message: t("reviews.form.errors.body") });
      return;
    }
    setSubmitting(true);
    try {
      addReview({
        rating: form.rating,
        title: form.title.trim() || undefined,
        body: form.body.trim(),
        photoUrl: form.photoUrl.trim() || undefined,
        reviewerName: form.reviewerName.trim() || undefined,
      });
      resetForm();
      setStatus({ type: "success", message: t("reviews.form.success") });
    } catch (error) {
      console.error("Unable to save review", error);
      setStatus({ type: "error", message: t("reviews.form.errors.generic") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = RATING_OPTIONS.indexOf(form.rating);
    if (currentIndex === -1) return;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % RATING_OPTIONS.length;
      setForm((prev) => ({ ...prev, rating: RATING_OPTIONS[nextIndex] }));
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + RATING_OPTIONS.length) % RATING_OPTIONS.length;
      setForm((prev) => ({ ...prev, rating: RATING_OPTIONS[prevIndex] }));
    }
  };

  return (
    <Card className="review-form-card">
      <h3>{t("reviews.form.heading")}</h3>
      <p className="review-form-card__subtitle">{t("reviews.form.subtitle")}</p>
      <form className="review-form-card__form" onSubmit={handleSubmit}>
        <div
          className="review-form-card__rating"
          role="radiogroup"
          aria-label={t("reviews.form.labels.rating")}
        >
          {RATING_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              className={`review-form-card__rating-option${
                form.rating === value ? " is-selected" : ""
              }`}
              onClick={() => setForm((prev) => ({ ...prev, rating: value }))}
              onKeyDown={handleRatingKeyDown}
              role="radio"
              aria-checked={form.rating === value}
            >
              {value} {value === 1 ? t("reviews.form.labels.star") : t("reviews.form.labels.stars")}
            </button>
          ))}
        </div>
        <InputField
          label={t("reviews.form.labels.title")}
          name="title"
          value={form.title}
          onChange={handleChange}
          containerClassName="review-form-card__field"
        />
        <TextareaField
          label={t("reviews.form.labels.body")}
          name="body"
          value={form.body}
          onChange={handleChange}
          required
          containerClassName="review-form-card__field review-form-card__field--wide"
        />
        <InputField
          label={t("reviews.form.labels.photoUrl")}
          name="photoUrl"
          value={form.photoUrl}
          onChange={handleChange}
          containerClassName="review-form-card__field"
        />
        <InputField
          label={t("reviews.form.labels.reviewerName")}
          name="reviewerName"
          value={form.reviewerName}
          onChange={handleChange}
          containerClassName="review-form-card__field"
        />
        <Button type="submit" variant="primary" disabled={submitting}>
          {t("reviews.form.submit")}
        </Button>
        {status && (
          <p
            className={`review-form-card__status review-form-card__status--${status.type}`}
            role="status"
            aria-live="polite"
          >
            {status.message}
          </p>
        )}
      </form>
    </Card>
  );
}
