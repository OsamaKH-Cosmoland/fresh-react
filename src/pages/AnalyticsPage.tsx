import { useMemo } from "react";
import { computeAudienceSummary, computeCompareSummary, computeFavoritesSummary, computeFlowUsageSummary, computeLoyaltySummary, computeOrdersSummary, computeReferralSummary, computeRatingsByTarget, computeTopItems } from "@/analytics/analyticsEngine";
import type { TopItem } from "@/analytics/analyticsTypes";
import { ritualBundles } from "@/content/bundles";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import { listReviews } from "@/utils/reviewStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCurrency } from "@/currency/CurrencyProvider";
import { useLocale, useTranslation } from "@/localization/locale";
import type { ReactNode } from "react";

const TARGET_NAME_LOOKUP = {
  ...PRODUCT_DETAIL_MAP,
};

function resolveTargetName(targetId: string) {
  const product = TARGET_NAME_LOOKUP[targetId];
  if (product) return product.productName;
  const bundle = ritualBundles.find((entry) => entry.id === targetId);
  if (bundle) return bundle.name;
  return targetId;
}

function formatCount(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function formatRating(value: number) {
  return value ? value.toFixed(1) : "—";
}

interface AnalyticsCardProps {
  title: string;
  children: ReactNode;
}

function AnalyticsCard({ title, children }: AnalyticsCardProps) {
  return (
    <article className="analytics-card">
      <h3>{title}</h3>
      <div className="analytics-card__body">{children}</div>
    </article>
  );
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { currency } = useCurrency();

  const ordersSummary = useMemo(() => computeOrdersSummary(), []);
  const loyaltySummary = useMemo(() => computeLoyaltySummary(), []);
  const audienceSummary = useMemo(() => computeAudienceSummary(), []);
  const favoritesSummary = useMemo(() => computeFavoritesSummary(), []);
  const compareSummary = useMemo(() => computeCompareSummary(), []);
  const flowUsage = useMemo(() => computeFlowUsageSummary(), []);
  const topItems = useMemo(() => computeTopItems(5), []);
  const referralSummary = useMemo(() => computeReferralSummary(), []);
  const ratingMap = useMemo(() => computeRatingsByTarget(), []);
  const reviews = useMemo(() => listReviews(), []);
  const globalAverageRating = useMemo(() => {
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return reviews.length ? total / reviews.length : 0;
  }, [reviews]);
  const ratingEntries = useMemo(
    () =>
      Object.entries(ratingMap).map(([targetId, rating]) => ({
        targetId,
        ...rating,
      })),
    [ratingMap]
  );
  const topRated = useMemo(
    () =>
      [...ratingEntries]
        .sort((a, b) => b.average - a.average)
        .slice(0, 3),
    [ratingEntries]
  );
  const mostReviewed = useMemo(
    () =>
      [...ratingEntries]
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
    [ratingEntries]
  );

  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString(locale) : t("analytics.labels.notAvailable");

  const renderTopItemRow = (item: TopItem) => (
    <tr key={item.id}>
      <td>{item.name}</td>
      <td>{t(`analytics.labels.type.${item.type}` as const)}</td>
      <td>{formatCount(item.totalQuantity, locale)}</td>
      <td>{formatCurrency(item.totalRevenueBase, currency)}</td>
    </tr>
  );

  return (
    <main id="main-content" tabIndex={-1} className="analytics-shell ng-mobile-shell">
      <header className="analytics-hero">
        <p className="analytics-hero__eyebrow">{t("analytics.hero.label")}</p>
        <h1>{t("analytics.hero.title")}</h1>
        <p className="analytics-hero__subtitle">{t("analytics.hero.subtitle")}</p>
      </header>

      <section className="analytics-section">
        <h2>{t("analytics.sections.keyMetrics")}</h2>
        <div className="analytics-grid analytics-grid--metrics">
          <AnalyticsCard title={t("analytics.cards.ordersSummary")}>
            <div className="analytics-metric">
              <span className="analytics-metric__value">{formatCount(ordersSummary.ordersCount, locale)}</span>
              <span className="analytics-metric__label">{t("analytics.metrics.ordersCount")}</span>
            </div>
            <div className="analytics-metric">
              <span className="analytics-metric__value">
                {formatCurrency(ordersSummary.totalRevenueBase, currency)}
              </span>
              <span className="analytics-metric__label">{t("analytics.metrics.totalRevenue")}</span>
            </div>
            <div className="analytics-metric">
              <span className="analytics-metric__value">
                {formatCurrency(ordersSummary.averageOrderValueBase, currency)}
              </span>
              <span className="analytics-metric__label">{t("analytics.metrics.aov")}</span>
            </div>
            <div className="analytics-metric-group">
              <div>
                <span className="analytics-metric__label">{t("analytics.metrics.firstOrder")}</span>
                <span className="analytics-metric__value">{formatDate(ordersSummary.firstOrderAt)}</span>
              </div>
              <div>
                <span className="analytics-metric__label">{t("analytics.metrics.lastOrder")}</span>
                <span className="analytics-metric__value">{formatDate(ordersSummary.lastOrderAt)}</span>
              </div>
            </div>
            <div className="analytics-metric">
              <span className="analytics-metric__value">
                {formatCount(ordersSummary.repeatCustomerEstimate, locale)}
              </span>
              <span className="analytics-metric__label">{t("analytics.metrics.repeatEstimate")}</span>
            </div>
          </AnalyticsCard>

          <AnalyticsCard title={t("analytics.cards.loyalty")}>
            <p className="analytics-card__note">{t("analytics.labels.loyaltyHint")}</p>
            <div className="analytics-metric">
              <span className="analytics-metric__value">{formatCount(loyaltySummary.totalPoints, locale)}</span>
              <span className="analytics-metric__label">{t("analytics.metrics.loyaltyPoints")}</span>
            </div>
            <p className="analytics-card__note">
              {loyaltySummary.currentTierLabel ??
                t("analytics.labels.loyaltyTierUnavailable")}
            </p>
          </AnalyticsCard>

          <AnalyticsCard title={t("analytics.cards.audience")}>
            <div className="analytics-metric">
              <span className="analytics-metric__value">{formatCount(audienceSummary.totalContacts, locale)}</span>
              <span className="analytics-metric__label">{t("analytics.metrics.audienceTotal")}</span>
            </div>
            <div className="analytics-metric">
              <span className="analytics-metric__value">{formatCount(audienceSummary.withOrdersEstimate, locale)}</span>
              <span className="analytics-metric__label">{t("analytics.metrics.audienceWithOrders")}</span>
            </div>
          </AnalyticsCard>

          <AnalyticsCard title={t("analytics.cards.referrals")}>
            <div className="analytics-referrals__stats">
              <div>
                <span>{t("analytics.metrics.referralOrders")}</span>
                <strong>{formatCount(referralSummary.totalReferrals, locale)}</strong>
              </div>
              <div>
                <span>{t("analytics.labels.referralCredit")}</span>
                <strong>{formatCurrency(referralSummary.totalCreditBase, currency)}</strong>
              </div>
            </div>
            <p className="analytics-card__note">{t("analytics.labels.referralTopCodes")}</p>
            {referralSummary.topCodes.length ? (
              <ul className="analytics-referrals__list">
                {referralSummary.topCodes.map((entry) => (
                  <li key={entry.code}>
                    <span>{entry.code}</span>
                    <span>
                      {t("analytics.labels.referralOrders")}: {formatCount(entry.orders, locale)}
                    </span>
                    <span>
                      {t("analytics.labels.referralCredit")}: {formatCurrency(entry.creditBase, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="analytics-card__note">{t("analytics.labels.notAvailable")}</p>
            )}
          </AnalyticsCard>
        </div>
      </section>

      <section className="analytics-section">
        <h2>{t("analytics.sections.topItems")}</h2>
        <div className="analytics-card analytics-card--full">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>{t("analytics.table.name")}</th>
                <th>{t("analytics.table.type")}</th>
                <th>{t("analytics.table.quantity")}</th>
                <th>{t("analytics.table.revenue")}</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item) => renderTopItemRow(item))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="analytics-section">
        <h2>{t("analytics.sections.reviews")}</h2>
        <div className="analytics-grid analytics-grid--reviews">
          <AnalyticsCard title={t("analytics.cards.reviewSummary")}>
            <div className="analytics-metric">
              <span className="analytics-metric__value">{formatRating(globalAverageRating)}</span>
              <span className="analytics-metric__label">{t("analytics.metrics.globalRating")}</span>
            </div>
            <p className="analytics-card__note">
              {t("analytics.labels.reviewCount", { count: formatCount(reviews.length, locale) })}
            </p>
          </AnalyticsCard>
          <AnalyticsCard title={t("analytics.cards.topRated")}>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>{t("analytics.table.name")}</th>
                  <th>{t("analytics.table.rating")}</th>
                  <th>{t("analytics.table.reviews")}</th>
                </tr>
              </thead>
              <tbody>
                {topRated.length ? (
                  topRated.map((entry) => (
                    <tr key={entry.targetId}>
                      <td>{resolveTargetName(entry.targetId)}</td>
                      <td>{formatRating(entry.average)}</td>
                      <td>{formatCount(entry.count, locale)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>{t("analytics.labels.notAvailable")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </AnalyticsCard>
          <AnalyticsCard title={t("analytics.cards.mostReviewed")}>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>{t("analytics.table.name")}</th>
                  <th>{t("analytics.table.rating")}</th>
                  <th>{t("analytics.table.reviews")}</th>
                </tr>
              </thead>
              <tbody>
                {mostReviewed.length ? (
                  mostReviewed.map((entry) => (
                    <tr key={`review-${entry.targetId}`}>
                      <td>{resolveTargetName(entry.targetId)}</td>
                      <td>{formatRating(entry.average)}</td>
                      <td>{formatCount(entry.count, locale)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>{t("analytics.labels.notAvailable")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </AnalyticsCard>
        </div>
      </section>

      <section className="analytics-section">
        <h2>{t("analytics.sections.favorites")}</h2>
        <div className="analytics-grid analytics-grid--favorites">
          <AnalyticsCard title={t("analytics.cards.favorites")}>
            <p className="analytics-card__note">{t("analytics.labels.favoritesHint")}</p>
            {favoritesSummary.topFavoriteIds.length ? (
              <ul className="analytics-list">
                {favoritesSummary.topFavoriteIds.map((favoriteId) => (
                  <li key={`fav-${favoriteId}`}>{resolveTargetName(favoriteId)}</li>
                ))}
              </ul>
            ) : (
              <p className="analytics-card__note">{t("analytics.labels.notAvailable")}</p>
            )}
          </AnalyticsCard>
          <AnalyticsCard title={t("analytics.cards.compare")}>
            <p className="analytics-card__note">{t("analytics.labels.compareHint")}</p>
            {compareSummary.mostComparedIds.length ? (
              <ul className="analytics-list">
                {compareSummary.mostComparedIds.map((compareId) => (
                  <li key={`cmp-${compareId}`}>{resolveTargetName(compareId)}</li>
                ))}
              </ul>
            ) : (
              <p className="analytics-card__note">{t("analytics.labels.notAvailable")}</p>
            )}
          </AnalyticsCard>
        </div>
      </section>

      <section className="analytics-section">
        <h2>{t("analytics.sections.flowUsage")}</h2>
        <AnalyticsCard title={t("analytics.cards.flowUsage")}>
          <div className="analytics-flow-grid">
            {[
              { key: "finder", used: flowUsage.usedFinder },
              { key: "coach", used: flowUsage.usedCoach },
              { key: "gift", used: flowUsage.usedGiftBuilder },
            ].map((badge) => (
              <span key={badge.key} className={`analytics-chip${badge.used ? " is-used" : ""}`}>
                {t(`analytics.flow.${badge.key}` as const)} ·{" "}
                {badge.used ? t("analytics.flow.statusUsed") : t("analytics.flow.statusUntracked")}
              </span>
            ))}
          </div>
        </AnalyticsCard>
      </section>
    </main>
  );
}
