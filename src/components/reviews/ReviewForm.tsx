import { ChangeEvent, FormEvent, useMemo, useState } from "react";
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

  return (
    <Card className="review-form-card">
      <h3>{t("reviews.form.heading")}</h3>
      <p className="review-form-card__subtitle">{t("reviews.form.subtitle")}</p>
      <form className="review-form-card__form" onSubmit={handleSubmit}>
        <label className="review-form-card__field">
          {t("reviews.form.labels.rating")}
          <select name="rating" value={form.rating} onChange={handleChange}>
            {RATING_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value} {value === 1 ? t("reviews.form.labels.star") : t("reviews.form.labels.stars")}
              </option>
            ))}
          </select>
        </label>
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
          <p className={`review-form-card__status review-form-card__status--${status.type}`}>
            {status.message}
          </p>
        )}
      </form>
    </Card>
  );
}
