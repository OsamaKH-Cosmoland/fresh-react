import { useState } from "react";
import { Button } from "@/components/ui";
import { useLocale, useTranslation } from "@/localization/locale";
import { upsertAudienceContact } from "@/utils/audienceStorage";
import { getLogger } from "@/logging/globalLogger";

type NewsletterVariant = "footer" | "landing";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value: string) => EMAIL_REGEX.test(value);

interface NewsletterSignupProps {
  variant?: NewsletterVariant;
}

export default function NewsletterSignup({ variant = "landing" }: NewsletterSignupProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [offersConsent, setOffersConsent] = useState(true);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
      setStatus("error");
      setError(t("newsletter.errors.invalidEmail"));
      return;
    }

    const consents = [
      { channel: "newsletter" as const, source: "newsletter_form" as const },
    ];
    if (offersConsent) {
      consents.push({ channel: "offers", source: "newsletter_form" });
    }

    try {
      upsertAudienceContact({
        email: trimmedEmail,
        locale,
        consentsToAdd: consents,
      });
      setStatus("success");
      setError(null);
      setEmail("");
    } catch (captureError) {
      getLogger().warn("Newsletter signup failed", { error: captureError });
      setStatus("error");
      setError(t("newsletter.errors.general"));
    }
  };

  return (
    <div className={`newsletter-signup newsletter-signup--${variant}`}>
      <h3>{t("newsletter.heading")}</h3>
      <p>{t("newsletter.subtitle")}</p>
      <form className="newsletter-signup__form" onSubmit={handleSubmit}>
        <label className="newsletter-signup__field">
          <span>{t("newsletter.form.emailLabel")}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("newsletter.form.emailPlaceholder")}
            aria-invalid={error ? "true" : undefined}
            required
          />
        </label>
        <label className="newsletter-signup__checkbox">
          <input
            type="checkbox"
            checked={offersConsent}
            onChange={(event) => setOffersConsent(event.target.checked)}
          />
          <span>{t("newsletter.form.consentLabel")}</span>
        </label>
        <div className="newsletter-signup__actions">
          <Button type="submit" variant="primary" size="md">
            {t("newsletter.form.submit")}
          </Button>
        </div>
        <p
          className={`newsletter-signup__message ${
            status === "success" ? "newsletter-signup__message--success" : ""
          } ${status === "error" ? "newsletter-signup__message--error" : ""}`}
          aria-live="polite"
        >
          {status === "success"
            ? t("newsletter.success")
            : status === "error"
            ? error
            : t("newsletter.helper")}
        </p>
      </form>
    </div>
  );
}
