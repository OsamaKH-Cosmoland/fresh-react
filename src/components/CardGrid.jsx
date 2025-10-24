import { useEffect, useRef, useState } from "react";
import { PRODUCTS } from "../data/products.js";

function Heart({ filled }) {
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

export default function CardGrid({
  onAddToCart = () => {},
}) {
  const initial = PRODUCTS;

  const recommendationMap = {
    2: 3,
    3: 2,
    1: 4,
    4: 1,
  };

  const [favs, setFavs] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  const hideTimer = useRef(null);

  const toggleFav = (id) => {
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

  const handleAdd = (item) => {
    onAddToCart(item);
    const recommendationId = recommendationMap[item.id];
    const recommendation = recommendationId
      ? initial.find((entry) => entry.id === recommendationId)
      : undefined;
    setToast({ visible: true, item, recommendation });
    scheduleToastHide();
  };

  const dismissToast = () => {
    setToast(null);
    clearToastTimer();
  };

  const handleFavKey = (e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFav(id);
    }
  };

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
                  <button
                    type="button"
                    className="toast-button"
                    onClick={() => handleAdd(toast.recommendation)}
                  >
                    Add {toast.recommendation.title}
                  </button>
                </>
              )}
              <button
                type="button"
                className="ghost-btn ghost-btn--compact"
                onClick={() => { window.location.href = `${import.meta.env.BASE_URL ?? "/"}?view=cart`; }}
              >
                View bag
              </button>
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
        {initial.map((c) => {
          const isFav = favs.has(c.id);
          return (
            <article
            key={c.id}
            className={`card rise-card ${isFav ? "is-fav" : ""}`}
            tabIndex="0"
            >
              {c.image && (
                <img
                  src={c.image}
                  alt={c.title}
                  className="card-img"
                />
              )}
              <header className="card-head">
                <h3> {c.title} </h3>
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
              <button
                className="primary-btn card-add"
                type="button"
                onClick={() => handleAdd(c)}
              >
                Add to cart
              </button>
            </article>
          );
        })}
      </section>
    </>
  );
}
