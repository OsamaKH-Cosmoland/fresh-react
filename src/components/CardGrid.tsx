import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import type { CSSProperties } from "react";
import { PRODUCTS } from "../data/products";
import type { CatalogProduct } from "@/data/products";
import { Button, Card } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import {
  PRODUCT_DETAIL_MAP,
  PRODUCT_DETAIL_SLUGS_BY_TITLE,
} from "@/content/productDetails";
import { CompareToggle } from "@/components/CompareToggle";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { trackEvent } from "@/analytics/events";
import { useTranslation } from "@/localization/locale";

interface CardGridProps {
  onAddToCart?: (product: CatalogProduct) => void;
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12.1 21.35l-1.1-.99C5.14 15.36 2 12.5 2 8.99 2 6.24 4.24 4 6.99 4c1.7 0 3.34.79 4.41 2.05A5.79 5.79 0 0 1 15.81 4C18.56 4 20.8 6.24 20.8 8.99c0 3.51-3.14 6.37-8.99 11.37l-.71.64z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5" 
      />
  
    </svg>
  )
}

export default function CardGrid({ onAddToCart = () => {} }: CardGridProps) {
  const initial = PRODUCTS;
  const { addItem } = useCart();
  const { t, locale } = useTranslation();

  const recommendationMap: Record<number, number> = {
    2: 3,
    3: 2,
    1: 4,
    4: 1,
  };

  const [favs, setFavs] = useState<Set<number>>(() => new Set());
  const [toast, setToast] = useState<{
    visible: boolean;
    item: CatalogProduct;
    recommendation?: CatalogProduct;
  } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleFav = (id: number) => {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearToastTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const scheduleToastHide = () => {
    clearToastTimer();
    hideTimer.current = setTimeout(() => {
      setToast(null);
      hideTimer.current = null;
    }, 2800);
  };

  const handleAdd = (item: CatalogProduct) => {
    const priceValue = Number(
      String(item.price).replace(/[^\d.]/g, "") || "0"
    );
    const displayName = locale === "ar" ? item.titleAr ?? item.title : item.title;
    addItem({
      id: String(item.id ?? item._id ?? item.title),
      name: displayName ?? t("cardGrid.toast.itemFallback"),
      price: Number.isFinite(priceValue) ? priceValue : 0,
      imageUrl: item.image ?? undefined,
    });
    trackEvent({
      type: "add_to_cart",
      itemType: "product",
      id: String(item.id ?? item._id ?? item.title),
      quantity: 1,
      price: Number.isFinite(priceValue) ? priceValue : 0,
      source: "lab",
    });
    onAddToCart(item);
    const recommendationId = recommendationMap[item.id];
    const recommendation = recommendationId
      ? initial.find((entry: CatalogProduct) => entry.id === recommendationId)
      : undefined;
    setToast({ visible: true, item, recommendation });
    scheduleToastHide();
  };

  const dismissToast = () => {
    setToast(null);
    clearToastTimer();
  };

  const handleFavKey = (e: React.KeyboardEvent<HTMLButtonElement>, id: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFav(id);
    }
  };

  const navigateToProduct = useCallback((slug: string) => {
    const base = import.meta.env.BASE_URL ?? "/";
    const destination = new URL(base, window.location.origin);
    destination.pathname = `/products/${slug}`;
    window.location.href = destination.toString();
  }, []);

  useEffect(() => {
    return clearToastTimer;
  }, []);

  return (
    <>
      {toast?.visible && (
        <div className="toast" role="status" aria-live="polite">
          <span className="toast-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm4.707 8.293-4.5 4.5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414l1.293 1.293 3.793-3.793a1 1 0 1 1 1.414 1.414Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <div className="toast-body">
            <p className="toast-title">{t("cardGrid.toast.title")}</p>
            <p className="toast-copy">
              {t("cardGrid.toast.messagePrefix")}
              {(locale === "ar" ? toast.item?.titleAr : toast.item?.title) ??
                t("cardGrid.toast.itemFallback")}
              {t("cardGrid.toast.messageSuffix")}
            </p>
      <div className="toast-actions">
              {toast.recommendation && (
                <>
                  <p className="toast-suggestion">
                    {t("cardGrid.toast.pairPrefix")}{" "}
                    <strong>
                      {locale === "ar"
                        ? toast.recommendation.titleAr ?? toast.recommendation.title
                        : toast.recommendation.title}
                    </strong>{" "}
                    {t("cardGrid.toast.pairSuffix")}
                  </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAdd(toast.recommendation as CatalogProduct)}
              >
                {t("cardGrid.toast.addActionPrefix")}{" "}
                {locale === "ar"
                  ? toast.recommendation.titleAr ?? toast.recommendation.title
                  : toast.recommendation.title}
              </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { window.location.href = `${import.meta.env.BASE_URL ?? "/"}?view=cart`; }}
              >
                {t("cta.viewBag")}
              </Button>
            </div>
          </div>
          <button
            type="button"
            className="toast-close"
            aria-label={t("cardGrid.toast.dismiss")}
            onClick={dismissToast}
          >
            ×
          </button>
        </div>
      )}
      <section id="grid" className="card-grid">
        {initial.map((c: CatalogProduct, index: number) => {
          const isFav = favs.has(c.id);
          const delayStyle = { "--motion-delay": `${index * 80}ms` } as CSSProperties;
          const detailSlug = PRODUCT_DETAIL_SLUGS_BY_TITLE[c.title];
          const detail = detailSlug ? PRODUCT_DETAIL_MAP[detailSlug] : undefined;
          const compareId = detail?.productId ?? detailSlug ?? String(c.id);
          const displayTitle = locale === "ar" ? c.titleAr ?? c.title : c.title;
          const displayDesc = locale === "ar" ? c.descAr ?? c.desc : c.desc;
          return (
              <Card
                key={c.id}
                className={`card hover-lift ${isFav ? "is-fav" : ""}`}
                data-animate="fade-up"
                style={delayStyle}
                tabIndex={0}
              >
                <CompareToggle
                  id={compareId}
                  type="product"
                  className="compare-toggle compare-toggle--grid"
                  itemLabel={displayTitle}
                />
                <FavoriteToggle
                  id={String(c.id)}
                  type="product"
                  className="favorite-toggle favorite-toggle--grid"
                  itemLabel={displayTitle}
                />
                {c.image && (
                <img
                  src={c.image}
                  alt={displayTitle}
                  className="card-img"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <header className="card-head">
                <h3>{displayTitle}</h3>
                <button
                  className="icon-btn"
                  aria-pressed={isFav}
                  aria-label={
                    isFav ? t("cardGrid.actions.unfavorite") : t("cardGrid.actions.favorite")
                  }
                  onClick={() => toggleFav(c.id)}
                  onKeyDown={(e) => handleFavKey(e, c.id)}
                >
                  <Heart filled={isFav} />
                </button>
              </header>
              <p className="card-desc">{displayDesc}</p>
              <p className="card-price">{c.price}</p>
              <div className="card-actions">
                <Button
                  className="card-add"
                  variant="primary"
                  type="button"
                  onClick={() => handleAdd(c)}
                >
                  {t("cta.addToBag")}
                </Button>
                {detailSlug && (
                  <button
                    type="button"
                    className="card-detail-link"
                    onClick={() => navigateToProduct(detailSlug)}
                  >
                    {t("cta.viewDetails")}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </section>
    </>
  );
}
