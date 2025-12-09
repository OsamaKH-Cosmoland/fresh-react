import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, SectionTitle } from "@/components/ui";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  DEFAULT_USER_PREFERENCES,
  type BudgetPreference,
  type ConcernOption,
  type ScentPreference,
  type TimePreference,
  type UserPreferences,
  useUserPreferences,
} from "@/hooks/useUserPreferences";
import { useLocale, useTranslation } from "@/localization/locale";
import { trackEvent } from "@/analytics/events";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import { useSeo } from "@/seo/useSeo";
import { upsertAudienceContact } from "@/utils/audienceStorage";

type StepId = "concerns" | "time" | "scent" | "budget";

type StepOption = {
  value: string;
  label: string;
  helper: string;
};

type StepConfig = {
  id: StepId;
  title: string;
  description: string;
  options: StepOption[];
  multi?: boolean;
};

const buildDraftFromSource = (source: UserPreferences | null): UserPreferences => ({
  ...DEFAULT_USER_PREFERENCES,
  ...(source ?? {}),
  concerns: source?.concerns ?? [],
});

const EMAIL_CAPTURE_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OnboardingPage() {
  usePageAnalytics("onboarding");
  useSeo({ route: "onboarding" });
  const { preferences, savePreferences } = useUserPreferences();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const flowRef = useRef<HTMLElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [draft, setDraft] = useState<UserPreferences>(() => buildDraftFromSource(preferences));
  const [stepIndex, setStepIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState("");
  const [profileConsent, setProfileConsent] = useState(true);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileCaptureError, setProfileCaptureError] = useState<string | null>(null);

  const stepDefinitions = useMemo<StepConfig[]>(() => {
    const concernsOptions: StepOption[] = [
      {
        value: "bodyHydration",
        label: t("onboarding.options.concerns.bodyHydration.label"),
        helper: t("onboarding.options.concerns.bodyHydration.helper"),
      },
      {
        value: "hairGrowth",
        label: t("onboarding.options.concerns.hairGrowth.label"),
        helper: t("onboarding.options.concerns.hairGrowth.helper"),
      },
      {
        value: "handsLips",
        label: t("onboarding.options.concerns.handsLips.label"),
        helper: t("onboarding.options.concerns.handsLips.helper"),
      },
    ];

    const timeOptions: StepOption[] = [
      {
        value: "morning",
        label: t("onboarding.options.time.morning.label"),
        helper: t("onboarding.options.time.morning.helper"),
      },
      {
        value: "evening",
        label: t("onboarding.options.time.evening.label"),
        helper: t("onboarding.options.time.evening.helper"),
      },
      {
        value: "both",
        label: t("onboarding.options.time.both.label"),
        helper: t("onboarding.options.time.both.helper"),
      },
      {
        value: "express",
        label: t("onboarding.options.time.express.label"),
        helper: t("onboarding.options.time.express.helper"),
      },
    ];

    const scentOptions: StepOption[] = [
      {
        value: "softFloral",
        label: t("onboarding.options.scent.softFloral.label"),
        helper: t("onboarding.options.scent.softFloral.helper"),
      },
      {
        value: "fresh",
        label: t("onboarding.options.scent.fresh.label"),
        helper: t("onboarding.options.scent.fresh.helper"),
      },
      {
        value: "warm",
        label: t("onboarding.options.scent.warm.label"),
        helper: t("onboarding.options.scent.warm.helper"),
      },
      {
        value: "unscented",
        label: t("onboarding.options.scent.unscented.label"),
        helper: t("onboarding.options.scent.unscented.helper"),
      },
    ];

    const budgetOptions: StepOption[] = [
      {
        value: "valueFocused",
        label: t("onboarding.options.budget.valueFocused.label"),
        helper: t("onboarding.options.budget.valueFocused.helper"),
      },
      {
        value: "premium",
        label: t("onboarding.options.budget.premium.label"),
        helper: t("onboarding.options.budget.premium.helper"),
      },
    ];

    return [
      {
        id: "concerns",
        title: t("onboarding.steps.concerns.title"),
        description: t("onboarding.steps.concerns.description"),
        options: concernsOptions,
        multi: true,
      },
      {
        id: "time",
        title: t("onboarding.steps.time.title"),
        description: t("onboarding.steps.time.description"),
        options: timeOptions,
      },
      {
        id: "scent",
        title: t("onboarding.steps.scent.title"),
        description: t("onboarding.steps.scent.description"),
        options: scentOptions,
      },
      {
        id: "budget",
        title: t("onboarding.steps.budget.title"),
        description: t("onboarding.steps.budget.description"),
        options: budgetOptions,
      },
    ];
  }, [t]);

  const totalSteps = stepDefinitions.length;
  const currentStep = stepDefinitions[stepIndex];
  const isFinalStep = stepIndex === totalSteps - 1;
  const progressTemplate = t("onboarding.progress.step");
  const progressLabel = progressTemplate
    .replace("{current}", String(Math.min(stepIndex + 1, totalSteps)))
    .replace("{total}", String(totalSteps));
  const progressPercent = Math.round(((stepIndex + 1) / totalSteps) * 100);

  const handleOptionSelect = useCallback(
    (stepId: StepId, value: string) => {
      setDraft((previous) => {
        const next = { ...previous };
        if (stepId === "concerns") {
          const concernValue = value as ConcernOption;
          const existing = next.concerns.includes(concernValue);
          next.concerns = existing
            ? next.concerns.filter((entry) => entry !== concernValue)
            : [...next.concerns, concernValue];
          return next;
        }
        if (stepId === "time") {
          next.timePreference = value as TimePreference;
          return next;
        }
        if (stepId === "scent") {
          next.scentPreference = value as ScentPreference;
          return next;
        }
        next.budgetPreference = value as BudgetPreference;
        return next;
      });
      setError(null);
    },
    []
  );

  const handleComplete = useCallback(() => {
    savePreferences({ ...draft });
    trackEvent({
      type: "update_preferences",
      concerns: draft.concerns,
      time: draft.timePreference,
      scent: draft.scentPreference,
      budget: draft.budgetPreference,
    });

    setProfileMessage(null);
    setProfileCaptureError(null);

    if (profileConsent && profileEmail.trim()) {
      const normalizedEmail = profileEmail.trim().toLowerCase();
      if (!EMAIL_CAPTURE_REGEX.test(normalizedEmail)) {
        setProfileCaptureError(t("onboarding.newsletter.errors.invalidEmail"));
      } else {
        try {
          upsertAudienceContact({
            email: normalizedEmail,
            locale,
            concerns: draft.concerns,
            timePreference: draft.timePreference,
            scentPreference: draft.scentPreference,
            budgetPreference: draft.budgetPreference,
            consentsToAdd: [{ channel: "newsletter", source: "onboarding" }],
          });
          setProfileMessage(t("onboarding.newsletter.success"));
        } catch (captureError) {
          console.warn("Failed to save onboarding audience contact", captureError);
          setProfileCaptureError(t("onboarding.newsletter.errors.general"));
        }
      }
    }

    setComplete(true);
  }, [draft, locale, profileConsent, profileEmail, savePreferences, t]);

  const handleNext = () => {
    if (!currentStep) return;
    if (currentStep.id === "concerns" && draft.concerns.length === 0) {
      setError(t("onboarding.errors.selectConcern"));
      return;
    }
    setError(null);
    if (isFinalStep) {
      handleComplete();
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((prev) => Math.max(prev - 1, 0));
    setError(null);
  };

  const handleSkipStep = () => {
    setError(null);
    if (isFinalStep) {
      handleComplete();
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleRevisit = () => {
    setComplete(false);
    setStepIndex(0);
    setProfileMessage(null);
    setProfileCaptureError(null);
  };

  const navigateToPath = useCallback((path: string) => {
    if (typeof window === "undefined") return;
    const base = import.meta.env.BASE_URL ?? "/";
    const destination = new URL(base, window.location.origin);
    destination.pathname = path;
    window.location.href = destination.toString();
  }, []);

  const scrollToSteps = () => {
    flowRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setDraft(buildDraftFromSource(preferences));
  }, [preferences]);

  return (
    <div className="onboarding-page">
      <Navbar
        sticky
        onMenuToggle={() => setDrawerOpen(true)}
        showSectionLinks={false}
        menuOpen={drawerOpen}
      />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main id="main-content" tabIndex={-1} className="onboarding-shell ng-mobile-shell">
        <header className="onboarding-hero" data-animate="fade-up">
          <SectionTitle
            title={t("onboarding.hero.title")}
            subtitle={t("onboarding.hero.subtitle")}
            align="center"
          />
          <div className="onboarding-hero__actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setComplete(false);
                setStepIndex(0);
                scrollToSteps();
              }}
            >
              {t("cta.createRitualProfile")}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigateToPath("/")}>
              {t("onboarding.actions.skipFlow")}
            </Button>
          </div>
        </header>

        <section className="onboarding-flow" data-animate="fade-up" ref={flowRef}>
          {complete ? (
            <article className="onboarding-completion">
              <SectionTitle
                title={t("onboarding.completion.title")}
                subtitle={t("onboarding.completion.subtitle")}
                align="center"
              />
              <p>{t("onboarding.completion.body")}</p>
              <div className="onboarding-completion__actions">
                <Button variant="secondary" size="lg" onClick={() => navigateToPath("/")}>
                  {t("onboarding.completion.ctas.landing")}
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigateToPath("/ritual-finder")}
                >
                  {t("onboarding.completion.ctas.finder")}
                </Button>
                <Button variant="ghost" size="lg" onClick={() => navigateToPath("/ritual-coach")}>
                  {t("ritualCoach.cta.askCoach")}
                </Button>
              </div>
              <Button variant="ghost" size="md" onClick={handleRevisit}>
                {t("onboarding.actions.edit")}
              </Button>
            </article>
          ) : (
            <article className="onboarding-step">
              <div className="onboarding-progress">
                <span>{progressLabel}</span>
                <div className="onboarding-progress__bar">
                  <span style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
              {currentStep && (
                <>
                  <div className="onboarding-step__header">
                    <h3>{currentStep.title}</h3>
                    <p>{currentStep.description}</p>
                  </div>
                  <div className="onboarding-options">
                    {currentStep.options.map((option) => {
                      const isActive =
                        currentStep.multi && currentStep.id === "concerns"
                          ? draft.concerns.includes(option.value as ConcernOption)
                          : (currentStep.id === "time" && draft.timePreference === option.value) ||
                            (currentStep.id === "scent" && draft.scentPreference === option.value) ||
                            (currentStep.id === "budget" && draft.budgetPreference === option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`onboarding-option ${isActive ? "is-active" : ""}`}
                          onClick={() => handleOptionSelect(currentStep.id, option.value)}
                          aria-pressed={isActive}
                        >
                          <span className="onboarding-option__label">{option.label}</span>
                          <span className="onboarding-option__helper">{option.helper}</span>
                        </button>
                      );
                    })}
                  </div>
                  {error && <p className="onboarding-error">{error}</p>}
                  <div className="onboarding-step__controls">
                    <Button variant="ghost" size="sm" onClick={handleSkipStep}>
                      {t("onboarding.actions.skipStep")}
                    </Button>
                    <div>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={handleBack}
                        disabled={stepIndex === 0}
                      >
                        {t("onboarding.actions.back")}
                      </Button>
                      <Button variant="primary" size="md" onClick={handleNext}>
                        {isFinalStep
                          ? t("onboarding.actions.finish")
                          : t("onboarding.actions.continue")}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </article>
          )}
          <article className="onboarding-newsletter" data-animate="fade-up">
            <div className="onboarding-newsletter__header">
              <h3>{t("onboarding.newsletter.heading")}</h3>
              <p>{t("onboarding.newsletter.body")}</p>
            </div>
            <div className="onboarding-newsletter__form">
              <label>
                <span>{t("onboarding.newsletter.emailLabel")}</span>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(event) => setProfileEmail(event.target.value)}
                  placeholder={t("onboarding.newsletter.emailPlaceholder")}
                />
              </label>
              <label className="onboarding-newsletter__checkbox">
                <input
                  type="checkbox"
                  checked={profileConsent}
                  onChange={(event) => setProfileConsent(event.target.checked)}
                />
                <span>{t("onboarding.newsletter.consentLabel")}</span>
              </label>
            </div>
            <p
              className={`onboarding-newsletter__status ${
                profileMessage ? "is-success" : profileCaptureError ? "is-error" : ""
              }`}
              aria-live="polite"
            >
              {profileMessage ||
                profileCaptureError ||
                t("onboarding.newsletter.helper")}
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
