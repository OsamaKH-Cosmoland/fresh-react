import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { BundleCard } from "@/components/bundles/BundleCard";
import { useBundleActions } from "@/cart/cartBundles";
import { useCart } from "@/cart/cartStore";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import { RITUAL_QUESTIONS, matchRituals, type RitualFinderAnswers } from "@/content/ritualFinderQuiz";
import { recordView } from "@/hooks/useRecentlyViewed";
import { useTranslation } from "@/localization/locale";
import {
  type ConcernOption,
  type ScentPreference,
  type TimePreference,
  useUserPreferences,
} from "@/hooks/useUserPreferences";

export default function RitualFinder() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<RitualFinderAnswers>({});
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addBundleToCart } = useBundleActions();
  const { addItem } = useCart();
  const { t } = useTranslation();
  const { preferences } = useUserPreferences();
  const prefAppliedRef = useRef(false);

  const currentQuestion = RITUAL_QUESTIONS[step];
  const isLastStep = step === RITUAL_QUESTIONS.length - 1;

  const progressPercent = Math.round(
    ((complete ? RITUAL_QUESTIONS.length : step + 1) / RITUAL_QUESTIONS.length) * 100
  );

  const recommendations = useMemo(() => matchRituals(answers), [answers]);
  const primaryBundle = recommendations.primary;
  const secondaryBundles = recommendations.secondary;
  const productSuggestions = useMemo(
    () =>
      recommendations.productSuggestions
        .map((productId) => PRODUCT_DETAIL_MAP[productId])
        .filter(Boolean),
    [recommendations.productSuggestions]
  );

  useEffect(() => {
    if (prefAppliedRef.current || !preferences) return;
    const mapping: RitualFinderAnswers = {};
    const focusMap: Record<ConcernOption, string> = {
      bodyHydration: "body",
      hairGrowth: "hair",
      handsLips: "hands",
    };
    const timeMap: Record<TimePreference, string> = {
      morning: "express",
      evening: "unwind",
      both: "indulge",
      express: "express",
    };
    const scentMap: Record<ScentPreference, string> = {
      softFloral: "floral",
      fresh: "botanical",
      warm: "amber",
      unscented: "botanical",
    };

    const primaryConcern = preferences.concerns?.[0];
    if (primaryConcern && focusMap[primaryConcern]) {
      mapping.focus = focusMap[primaryConcern];
    }
    if (preferences.timePreference && timeMap[preferences.timePreference]) {
      mapping.time = timeMap[preferences.timePreference];
    }
    if (preferences.scentPreference && scentMap[preferences.scentPreference]) {
      mapping.scent = scentMap[preferences.scentPreference];
    }

    prefAppliedRef.current = true;
    if (!Object.keys(mapping).length) return;

    setAnswers((prev) => ({ ...mapping, ...prev }));
  }, [preferences, setAnswers]);

  const selectOption = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError(null);
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    if (!answers[currentQuestion.id]) {
      setError("Select the answer that feels most aligned with tonight.");
      return;
    }
    if (isLastStep) {
      setComplete(true);
      return;
    }
    setStep((prev) => Math.min(prev + 1, RITUAL_QUESTIONS.length - 1));
  };

  const handleBack = () => {
    if (complete) {
      setComplete(false);
    }
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setAnswers({});
    setStep(0);
    setComplete(false);
    setError(null);
  };

  const navigateToCoach = () => {
    const base = import.meta.env.BASE_URL ?? "/";
    const destination = new URL(base, window.location.origin);
    destination.pathname = "/ritual-coach";
    window.location.href = destination.toString();
  };

  const addProductToBag = (productId: string) => {
    const detail = PRODUCT_DETAIL_MAP[productId];
    if (!detail) return;
    addItem({
      productId: detail.productId,
      id: detail.productId,
      name: detail.productName,
      price: detail.priceNumber,
      imageUrl: detail.heroImage,
    });
  };

  useEffect(() => {
    if (!complete) return;
    if (primaryBundle) {
      recordView(primaryBundle.id, "bundle");
    }
    secondaryBundles.forEach((bundle) => recordView(bundle.id, "bundle"));
  }, [complete, primaryBundle, secondaryBundles]);

  return (
    <div className="ritual-finder-page">
      <Navbar sticky onMenuToggle={() => setDrawerOpen(true)} showSectionLinks={false} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="ritual-finder-shell ng-mobile-shell">
        <header className="ritual-finder-hero" data-animate="fade-up">
          <SectionTitle
            title="Ritual Finder"
            subtitle="Answer a calm handful of questions and we will curate the ritual that matches tonight."
            align="center"
          />
          <p>
            We listen to your focus, time, and scent preferences to recommend the precise balance of
            cleanse, treat, and finish—packaged as our curated bundles.
          </p>
          {preferences?.concerns.length ? (
            <p className="ritual-finder-hint">{t("onboarding.hint")}</p>
          ) : null}
        </header>

        <section className="ritual-finder-quiz" data-animate="fade-up">
          <div className="ritual-finder-progress">
            <span>
              Step {complete ? RITUAL_QUESTIONS.length : step + 1} / {RITUAL_QUESTIONS.length}
            </span>
            <div className="ritual-finder-progress-bar">
              <div style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {currentQuestion && !complete && (
            <article className="ritual-finder-question">
              <div>
                <p className="ritual-finder-question__title">{currentQuestion.title}</p>
                <p className="ritual-finder-question__desc">{currentQuestion.description}</p>
              </div>
              <div className="ritual-finder-options">
                {currentQuestion.options.map((option) => {
                  const active = answers[currentQuestion.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`ritual-finder-option ${active ? "is-active" : ""}`}
                      onClick={() => selectOption(currentQuestion.id, option.value)}
                    >
                      <span className="ritual-finder-option__label">{option.label}</span>
                      <span className="ritual-finder-option__helper">{option.helper}</span>
                    </button>
                  );
                })}
              </div>
              {error && <p className="ritual-finder-error">{error}</p>}
              <div className="ritual-finder-controls">
                <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
                  Back
                </Button>
                <Button variant="primary" onClick={handleNext}>
                  {isLastStep ? "Reveal my ritual" : "Continue"}
                </Button>
              </div>
            </article>
          )}

          {complete && primaryBundle && (
            <article className="ritual-finder-results">
              <SectionTitle
                title="We curated this ritual for you"
                subtitle="Add the bundle that best matches your answers."
                align="left"
              />
              <div className="bundle-grid ng-grid-mobile-2">
                <BundleCard bundle={primaryBundle} onAddBundle={addBundleToCart} />
              </div>
              {secondaryBundles.length > 0 && (
                <div className="ritual-finder-also">
                  <p>Also consider</p>
                  <div className="bundle-grid ng-grid-mobile-2">
                    {secondaryBundles.map((bundle) => (
                      <BundleCard key={bundle.id} bundle={bundle} onAddBundle={addBundleToCart} />
                    ))}
                  </div>
                </div>
              )}
              {productSuggestions.length > 0 && (
                <div className="ritual-finder-extras">
                  <SectionTitle title="Also consider" subtitle="Single additions to pair beautifully." align="left" />
                  <div className="ritual-finder-extras__grid ng-grid-mobile-2">
                    {productSuggestions.map((product) => (
                      <Card key={product.productId} className="ritual-finder-product">
                        <p className="ritual-finder-product__name">{product.productName}</p>
                        <p className="ritual-finder-product__desc">{product.subtitle ?? product.productName}</p>
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => addProductToBag(product.productId)}
                        >
                          {t("cta.addToBag")}
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              <div className="ritual-finder-controls ritual-finder-controls--reset">
              <Button variant="ghost" onClick={handleReset}>
                Retake the Ritual Finder
              </Button>
              <Button variant="secondary" onClick={navigateToCoach}>
                {t("ritualCoach.cta.refineWithCoach")}
              </Button>
            </div>
            </article>
          )}
        </section>
      </main>
    </div>
  );
}
