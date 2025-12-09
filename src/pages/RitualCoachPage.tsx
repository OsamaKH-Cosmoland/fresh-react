import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button, Card, SectionTitle } from "@/components/ui";
import { BundleCard } from "@/components/bundles/BundleCard";
import { useBundleActions } from "@/cart/cartBundles";
import { CartItem, useCart } from "@/cart/cartStore";
import { useTranslation, type AppTranslationKey } from "@/localization/locale";
import {
  type BudgetPreference,
  type ConcernOption,
  type ScentPreference,
  type TimePreference,
  useUserPreferences,
} from "@/hooks/useUserPreferences";
import {
  buildRitualCoachRecommendations,
  type RitualCoachIntensity,
  type RitualCoachResult,
} from "@/content/ritualCoachEngine";
import { FocusTagId } from "@/content/shopCatalog";
import {
  PRODUCT_DETAIL_MAP,
  chooseVariantForPreferences,
  type ProductDetailContent,
} from "@/content/productDetails";
import { getBundleHeroImage } from "@/content/bundleHeroImages";
import { getBundlePricing } from "@/content/bundlePricing";
import { RitualBundle } from "@/content/bundles";
import { buildProductCartPayload } from "@/utils/productVariantUtils";
import { formatCurrency } from "@/utils/formatCurrency";
import { trackEvent } from "@/analytics/events";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import { useSeo } from "@/seo/useSeo";
import { useCurrency } from "@/currency/CurrencyProvider";

const CONCERN_TO_FOCUS: Record<ConcernOption, FocusTagId> = {
  bodyHydration: "body",
  hairGrowth: "hair",
  handsLips: "hands",
};

const FOCUS_TO_CONCERN: Record<FocusTagId, ConcernOption> = {
  body: "bodyHydration",
  hair: "hairGrowth",
  hands: "handsLips",
};

const intensityOptions: { id: RitualCoachIntensity; key: AppTranslationKey }[] = [
  { id: "minimal", key: "ritualCoach.controls.intensity.options.minimal" as AppTranslationKey },
  { id: "balanced", key: "ritualCoach.controls.intensity.options.balanced" as AppTranslationKey },
  { id: "indulgent", key: "ritualCoach.controls.intensity.options.indulgent" as AppTranslationKey },
];

const formatTemplate = (template: string, values: Record<string, string | undefined>) => {
  const filled = Object.entries(values).reduce((acc, [key, value]) => {
    const replacement = value ?? "";
    return acc.replace(new RegExp(`{${key}}`, "g"), replacement);
  }, template);
  return filled.replace(/\s{2,}/g, " ").trim();
};

const navigateToPath = (path: string) => {
  if (typeof window === "undefined") return;
  const base = import.meta.env.BASE_URL ?? "/";
  const destination = new URL(base, window.location.origin);
  destination.pathname = path;
  window.location.href = destination.toString();
};

const getConcernLabel = (t: (key: AppTranslationKey) => string, concern: ConcernOption) =>
  t(`onboarding.options.concerns.${concern}.label` as AppTranslationKey);

const getFocusLabel = (t: (key: AppTranslationKey) => string, focus: FocusTagId) =>
  getConcernLabel(t, FOCUS_TO_CONCERN[focus]);

const getTimeLabel = (t: (key: AppTranslationKey) => string, time: TimePreference) =>
  t(`onboarding.options.time.${time}.label` as AppTranslationKey);

const getScentLabel = (t: (key: AppTranslationKey) => string, scent: ScentPreference) =>
  t(`onboarding.options.scent.${scent}.label` as AppTranslationKey);

const getBudgetLabel = (t: (key: AppTranslationKey) => string, budget: BudgetPreference) =>
  t(`onboarding.options.budget.${budget}.label` as AppTranslationKey);

const getIntensityLabel = (t: (key: AppTranslationKey) => string, intensity: RitualCoachIntensity) =>
  t(`ritualCoach.controls.intensity.options.${intensity}` as AppTranslationKey);

const createBundleCartItem = (bundle: RitualBundle): CartItem => {
  const pricing = getBundlePricing(bundle);
  const bundleItems = bundle.products.map((entry) => {
    const detail = PRODUCT_DETAIL_MAP[entry.productId];
    return {
      productId: entry.productId,
      name: detail?.productName ?? entry.productId,
      quantity: entry.quantity ?? 1,
    };
  });
  return {
    id: `bundle-${bundle.id}`,
    name: bundle.name,
    price: pricing.bundlePrice,
    quantity: 1,
    imageUrl: getBundleHeroImage(bundle.id),
    bundleId: bundle.id,
    bundleItems,
    bundleCompareAt: pricing.compareAt,
    bundleSavings: pricing.savingsAmount,
    bundleSavingsPercent: pricing.savingsPercent,
  };
};


export default function RitualCoachPage() {
  usePageAnalytics("coach");
  useSeo({ route: "coach" });
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const { preferences } = useUserPreferences();
  const { addBundleToCart } = useBundleActions();
  const { addItem, saveCustomCart } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [intensity, setIntensity] = useState<RitualCoachIntensity>("balanced");
  const [focusOverride, setFocusOverride] = useState<FocusTagId | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const coachResult = useMemo<RitualCoachResult>(
    () =>
      buildRitualCoachRecommendations({
        preferences,
        intensity,
        focusOverride,
      }),
    [preferences, intensity, focusOverride]
  );

  const hasProfile = Boolean(preferences?.concerns.length);

  const profileRecap = useMemo(() => {
    if (!hasProfile) {
      return t("ritualCoach.profileRecap.empty" as AppTranslationKey);
    }
    const focusLabel = preferences?.concerns[0]
      ? getConcernLabel(t, preferences.concerns[0])
      : undefined;
    const timeLabel = preferences?.timePreference
      ? getTimeLabel(t, preferences.timePreference)
      : undefined;
    const scentLabel = preferences?.scentPreference
      ? getScentLabel(t, preferences.scentPreference)
      : undefined;
    const budgetLabel = preferences?.budgetPreference
      ? getBudgetLabel(t, preferences.budgetPreference)
      : undefined;
    const template = t("ritualCoach.profileRecap.template" as AppTranslationKey);
    return formatTemplate(template, {
      focus: focusLabel,
      time: timeLabel,
      scent: scentLabel,
      budget: budgetLabel,
    });
  }, [hasProfile, preferences, t]);

  const focusChoices = useMemo<FocusTagId[]>(() => {
    if (!preferences?.concerns.length) return [];
    return Array.from(
      new Set(preferences.concerns.map((concern) => CONCERN_TO_FOCUS[concern]))
    );
  }, [preferences]);

  const mainMatch = coachResult.mainRitual;
  const lighterMatch = coachResult.lighterRitual;
  const treats = coachResult.treats;

  const pickVariantForMatch = (match?: RitualCoachMatch) =>
    match?.entry.kind === "product"
      ? chooseVariantForPreferences(
          match.entry.item.productId,
          preferences?.scentPreference ?? null
        )
      : undefined;

  const mainVariant = pickVariantForMatch(mainMatch);
  const lighterVariant = pickVariantForMatch(lighterMatch);

  const intensityLabel = getIntensityLabel(t, intensity);

  const mainFocusLabel =
    (mainMatch?.focusMatch && getFocusLabel(t, mainMatch.focusMatch)) ??
    (focusOverride ? getFocusLabel(t, focusOverride) : undefined) ??
    (preferences?.concerns[0] ? getConcernLabel(t, preferences.concerns[0]) : undefined);

  const mainTimeLabel =
    mainMatch?.timeMatch != null && mainMatch.timeMatch
      ? getTimeLabel(t, mainMatch.timeMatch)
      : preferences?.timePreference
        ? getTimeLabel(t, preferences.timePreference)
        : undefined;

  const mainScentLabel =
    mainMatch?.scentMatch ? getScentLabel(t, mainMatch.scentMatch) : preferences?.scentPreference
      ? getScentLabel(t, preferences.scentPreference)
      : undefined;

  const savedCartName = [
    t("ritualCoach.savedCartName.base" as AppTranslationKey),
    mainFocusLabel,
    mainTimeLabel,
  ]
    .filter(Boolean)
    .join(" – ");

  const buildCartItemsForMain = useCallback((): CartItem[] => {
    if (!mainMatch) return [];
    if (mainMatch.entry.kind === "bundle") {
      return [createBundleCartItem(mainMatch.entry.item)];
    }
    const detail = mainMatch.entry.item;
    const payload = buildProductCartPayload(detail, mainVariant?.variantId);
    return [{ ...payload, quantity: 1 }];
  }, [mainMatch, mainVariant]);

  const handleAddMain = () => {
    if (!mainMatch) return;
    if (mainMatch.entry.kind === "bundle") {
      addBundleToCart(mainMatch.entry.item);
      return;
    }
    const payload = buildProductCartPayload(mainMatch.entry.item, mainVariant?.variantId);
    addItem(payload);
    trackEvent({
      type: "add_to_cart",
      itemType: "product",
      id: mainMatch.entry.item.productId,
      quantity: 1,
      price: payload.price,
      variantId: payload.variantId,
      source: "coach",
    });
  };

  const handleSaveRitual = () => {
    const items = buildCartItemsForMain();
    if (!items.length) {
      setSaveMessage(t("ritualCoach.savedCartMessage.empty" as AppTranslationKey));
      return;
    }
    const success = saveCustomCart(savedCartName, items);
    setSaveMessage(
      success
        ? t("ritualCoach.savedCartMessage.success" as AppTranslationKey)
        : t("ritualCoach.savedCartMessage.empty" as AppTranslationKey)
    );
  };

  const handleAddProduct = (detail: ProductDetailContent, variantId?: string) => {
    const payload = buildProductCartPayload(detail, variantId);
    addItem(payload);
    trackEvent({
      type: "add_to_cart",
      itemType: "product",
      id: detail.productId,
      quantity: 1,
      price: payload.price,
      variantId: payload.variantId,
      source: "coach",
    });
  };

  const mainExplanation = formatTemplate(
    t("ritualCoach.explanations.main" as AppTranslationKey),
    {
      focus: mainFocusLabel,
      time: mainTimeLabel,
      intensity: intensityLabel,
      scent: mainScentLabel,
    }
  );

  const lighterExplanation = formatTemplate(
    t("ritualCoach.explanations.lighter" as AppTranslationKey),
    {
      focus: mainFocusLabel,
      time: mainTimeLabel,
      intensity: intensityLabel,
    }
  );

  const treatsExplanation = formatTemplate(
    t("ritualCoach.explanations.treats" as AppTranslationKey),
    {
      scent: mainScentLabel,
      mood: intensityLabel,
    }
  );

  const showFocusControl = focusChoices.length > 1;

  useEffect(() => {
    if (!mainMatch) return;
    trackEvent({
      type: "coach_completed",
      primaryBundleId:
        mainMatch.entry.kind === "bundle" ? mainMatch.entry.item.id : undefined,
      intensity,
    });
  }, [mainMatch?.entry.kind, mainMatch?.entry.item?.id, intensity]);

  return (
    <div className="ritual-coach-page">
      <Navbar
        sticky
        onMenuToggle={() => setDrawerOpen(true)}
        menuOpen={drawerOpen}
      />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main id="main-content" tabIndex={-1} className="ritual-coach-shell ng-mobile-shell">
        <header className="ritual-coach-hero" data-animate="fade-up">
          <SectionTitle
            title={t("ritualCoach.hero.title" as AppTranslationKey)}
            subtitle={t("ritualCoach.hero.subtitle" as AppTranslationKey)}
            as="h1"
          />
          <p className="ritual-coach-profile">{profileRecap}</p>
          {!hasProfile && (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigateToPath("/onboarding")}
            >
              {t("ritualCoach.cta.createProfile" as AppTranslationKey)}
            </Button>
          )}
        </header>

        <section className="ritual-coach-questions" data-animate="fade-up">
          <div className="ritual-coach-questions__grid">
            <div className="ritual-coach-question">
              <p className="ritual-coach-question__label">
                {t("ritualCoach.controls.intensity.label" as AppTranslationKey)}
              </p>
              <p className="ritual-coach-question__helper">
                {t("ritualCoach.controls.intensity.helper" as AppTranslationKey)}
              </p>
              <div className="ritual-coach-question__options">
                {intensityOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`ritual-coach-option ${intensity === option.id ? "is-active" : ""}`}
                    onClick={() => setIntensity(option.id)}
                  >
                    {t(option.key)}
                  </button>
                ))}
              </div>
            </div>

            {showFocusControl && (
              <div className="ritual-coach-question">
                <p className="ritual-coach-question__label">
                  {t("ritualCoach.controls.focus.label" as AppTranslationKey)}
                </p>
                <p className="ritual-coach-question__helper">
                  {t("ritualCoach.controls.focus.helper" as AppTranslationKey)}
                </p>
                <div className="ritual-coach-question__options">
                  {focusChoices.map((focus) => (
                    <button
                      key={focus}
                      type="button"
                      className={`ritual-coach-option ${focusOverride === focus ? "is-active" : ""}`}
                      onClick={() =>
                        setFocusOverride((prev) => (prev === focus ? null : focus))
                      }
                    >
                      {getFocusLabel(t, focus)}
                    </button>
                  ))}
                  {focusOverride && (
                    <button
                      type="button"
                      className="ritual-coach-option ritual-coach-option--ghost"
                      onClick={() => setFocusOverride(null)}
                    >
                      {t("ritualCoach.controls.focus.clear" as AppTranslationKey)}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="ritual-coach-results" data-animate="fade-up">
          <article className="ritual-coach-block">
            <div className="ritual-coach-block__heading">
              <h3>{t("ritualCoach.sections.main" as AppTranslationKey)}</h3>
              <p>{mainExplanation}</p>
            </div>
            {mainMatch ? (
              <div className="ritual-coach-block__content">
                <div className="ritual-coach-block__card">
                  {mainMatch.entry.kind === "bundle" ? (
                    <BundleCard
                      bundle={mainMatch.entry.item}
                      viewSource="coach"
                      heroImage={getBundleHeroImage(mainMatch.entry.item.id)}
                      onAddBundle={(bundleItem, variantSelection) =>
                        addBundleToCart(bundleItem, variantSelection)
                      }
                    />
                  ) : (
                    <Card className="ritual-coach-product-card">
                      {mainMatch.entry.item.heroImage && (
                        <div className="ritual-coach-product-card__media">
                          <img
                            src={mainMatch.entry.item.heroImage}
                            alt={mainMatch.entry.item.productName}
                          />
                        </div>
                      )}
                    <div className="ritual-coach-product-card__body">
                      <h4>{mainMatch.entry.item.productName}</h4>
                      <p>{mainMatch.entry.item.shortTagline}</p>
                      {mainVariant?.label && (
                        <p className="ritual-coach-product-card__variant">
                          {mainVariant.label}
                        </p>
                      )}
                      <p className="ritual-coach-product-card__price">
                        {formatCurrency(
                          mainVariant?.priceNumber ?? mainMatch.entry.item.priceNumber,
                          currency
                        )}
                      </p>
                      </div>
                    </Card>
                  )}
                </div>
                <div className="ritual-coach-block__actions">
                  <Button variant="primary" size="md" onClick={handleAddMain}>
                    {t("ritualCoach.cta.addFullRitual" as AppTranslationKey)}
                  </Button>
                  <Button variant="ghost" size="md" onClick={handleSaveRitual}>
                    {t("ritualCoach.cta.saveRitual" as AppTranslationKey)}
                  </Button>
                  {saveMessage && (
                    <p className="ritual-coach-save__message">{saveMessage}</p>
                  )}
                </div>
              </div>
            ) : (
              <p>{t("ritualCoach.emptyState" as AppTranslationKey)}</p>
            )}
          </article>

          <article className="ritual-coach-block ritual-coach-block--lighter">
            <div className="ritual-coach-block__heading">
              <h3>{t("ritualCoach.sections.lighter" as AppTranslationKey)}</h3>
              <p>{lighterExplanation}</p>
            </div>
            {lighterMatch ? (
              <div className="ritual-coach-block__content">
                <Card className="ritual-coach-product-card ritual-coach-product-card--lighter">
                  {lighterMatch.entry.item.heroImage && (
                    <div className="ritual-coach-product-card__media">
                      <img
                        src={lighterMatch.entry.item.heroImage}
                        alt={lighterMatch.entry.item.productName}
                      />
                    </div>
                  )}
                    <div className="ritual-coach-product-card__body">
                      <h4>{lighterMatch.entry.item.productName}</h4>
                      <p>{lighterMatch.entry.item.shortTagline}</p>
                      {lighterVariant?.label && (
                        <p className="ritual-coach-product-card__variant">
                          {lighterVariant.label}
                        </p>
                      )}
                      <p className="ritual-coach-product-card__price">
                        {formatCurrency(
                          lighterVariant?.priceNumber ?? lighterMatch.entry.item.priceNumber,
                          currency
                        )}
                      </p>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() =>
                          handleAddProduct(lighterMatch.entry.item, lighterVariant?.variantId)
                        }
                      >
                        {t("cta.addToBag")}
                      </Button>
                  </div>
                </Card>
              </div>
            ) : (
              <p>{t("ritualCoach.emptyState" as AppTranslationKey)}</p>
            )}
          </article>

          <article className="ritual-coach-block ritual-coach-block--treats">
            <div className="ritual-coach-block__heading">
              <h3>{t("ritualCoach.sections.treats" as AppTranslationKey)}</h3>
              <p>{treatsExplanation}</p>
            </div>
            {treats.length > 0 ? (
              <div className="ritual-coach-treats__grid">
                {treats.map((treat) => {
                  const detail = treat.entry.item;
                  const variant = chooseVariantForPreferences(
                    detail.productId,
                    preferences?.scentPreference ?? null
                  );
                  const cardKey = `${detail.productId}-${variant?.variantId ?? "default"}`;
                  return (
                    <Card key={cardKey} className="ritual-coach-treat-card">
                      {detail.heroImage && (
                        <div className="ritual-coach-product-card__media">
                          <img src={detail.heroImage} alt={detail.productName} />
                        </div>
                      )}
                      <div className="ritual-coach-product-card__body">
                        <h4>{detail.productName}</h4>
                        <p>{detail.shortTagline}</p>
                        {variant?.label && (
                          <p className="ritual-coach-product-card__variant">{variant.label}</p>
                        )}
                        <p className="ritual-coach-product-card__price">
                          {formatCurrency(
                            variant?.priceNumber ?? detail.priceNumber,
                            currency
                          )}
                        </p>
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => handleAddProduct(detail, variant?.variantId)}
                        >
                          {t("cta.addToBag")}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p>{t("ritualCoach.treats.empty" as AppTranslationKey)}</p>
            )}
          </article>
        </section>

        <div className="ritual-coach-footer">
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setIntensity("balanced");
              setFocusOverride(null);
              setSaveMessage(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {t("ritualCoach.cta.askAgain" as AppTranslationKey)}
          </Button>
        </div>
      </main>
    </div>
  );
}
