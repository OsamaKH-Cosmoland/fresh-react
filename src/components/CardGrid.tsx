import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import type { CSSProperties } from "react";
import { PRODUCTS } from "../data/products";
import type { Product } from "../types/product";
import { Button, Card } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import {
  PRODUCT_DETAIL_MAP,
  PRODUCT_DETAIL_SLUGS_BY_TITLE,
} from "@/content/productDetails";
import { CompareToggle } from "@/components/CompareToggle";
import { FavoriteToggle } from "@/components/FavoriteToggle";

interface CardGridProps {
  onAddToCart?: (product: Product) => void;
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

  const recommendationMap: Record<number, number> = {
    2: 3,
    3: 2,
    1: 4,
    4: 1,
  };

  const [favs, setFavs] = useState<Set<number>>(() => new Set());
  const [toast, setToast] = useState<{
    visible: boolean;
    item: Product;
    recommendation?: Product;
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

  const handleAdd = (item: Product) => {
    const priceValue = Number(
      String(item.price).replace(/[^\d.]/g, "") || "0"
    );
    addItem({
      id: String(item.id ?? item._id ?? item.title),
      name: item.title ?? item.name ?? "Product",
      price: Number.isFinite(priceValue) ? priceValue : 0,
      imageUrl: item.image ?? undefined,
    });
    onAddToCart(item);
    const recommendationId = recommendationMap[item.id];
    const recommendation = recommendationId
      ? initial.find((entry: Product) => entry.id === recommendationId)
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
            <p className="toast-title">Added to your cart</p>
            <p className="toast-copy">
              {toast.item?.title ?? "New item"} is now in your bag. Review your cart anytime.
            </p>
      <div className="toast-actions">
              {toast.recommendation && (
                <>
                  <p className="toast-suggestion">
                    Pair it with <strong>{toast.recommendation.title}</strong> for a complete ritual.
                  </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAdd(toast.recommendation as Product)}
              >
                Add {toast.recommendation.title}
              </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { window.location.href = `${import.meta.env.BASE_URL ?? "/"}?view=cart`; }}
              >
                View bag
              </Button>
            </div>
          </div>
          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={dismissToast}
          >
            ×
          </button>
        </div>
      )}
      <section id="grid" className="card-grid">
        {initial.map((c: Product, index: number) => {
          const isFav = favs.has(c.id);
          const delayStyle = { "--motion-delay": `${index * 80}ms` } as CSSProperties;
          const detailSlug = PRODUCT_DETAIL_SLUGS_BY_TITLE[c.title];
          const detail = detailSlug ? PRODUCT_DETAIL_MAP[detailSlug] : undefined;
          const compareId = detail?.productId ?? detailSlug ?? String(c.id);
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
                />
                <FavoriteToggle
                  id={String(c.id)}
                  type="product"
                  className="favorite-toggle favorite-toggle--grid"
                />
                {c.image && (
                <img
                  src={c.image}
                  alt={c.title}
                  className="card-img"
                />
              )}
              <header className="card-head">
                <h3>{c.title}</h3>
                <button
                  className="icon-btn"
                  aria-pressed={isFav}
                  aria-label={isFav ? "Unfavorite" : "Favorite"}
                  onClick={() => toggleFav(c.id)}
                  onKeyDown={(e) => handleFavKey(e, c.id)}
                >
                  <Heart filled={isFav} />
                </button>
              </header>
              <p className="card-desc">{c.desc}</p>
              <p className="card-price">{c.price}</p>
              <div className="card-actions">
                <Button
                  className="card-add"
                  variant="primary"
                  type="button"
                  onClick={() => handleAdd(c)}
                >
                  Add to cart
                </Button>
                {detailSlug && (
                  <button
                    type="button"
                    className="card-detail-link"
                    onClick={() => navigateToProduct(detailSlug)}
                  >
                    Learn more
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
