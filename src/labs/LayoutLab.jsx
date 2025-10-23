import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import CardGrid from "../components/CardGrid.jsx";
import { PRODUCT_INDEX } from "../data/products.js";

const ANNOUNCEMENTS = [
  { id: 0, text: "Because your body deserves natural luxury", className: "announcement-message--secondary" },
  { id: 1, text: "Inspired by European cosmetic standards, handcrafted in Egypt", className: "announcement-message--primary" },
];

function CartIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M7 4h-2a1 1 0 0 0 0 2h1.15l1.64 7.37a2 2 0 0 0 1.95 1.56h7.3a2 2 0 0 0 1.94-1.52l1.1-4.23A1 1 0 0 0 19.1 8H8.54l-.36-1.6A2 2 0 0 0 7 4Zm3 15a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm8-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
      />
    </svg>
  );
}

export default function LayoutLab() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(1);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveAnnouncement((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const showPrevAnnouncement = () => {
    setActiveAnnouncement((prev) => (prev - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);
  };

  const showNextAnnouncement = () => {
    setActiveAnnouncement((prev) => (prev + 1) % ANNOUNCEMENTS.length);
  };

  const addItemToCart = useCallback((item) => {
    setCartItems((previous) => {
      const prev = Array.isArray(previous) ? previous : [];
      const next = prev.map((entry) =>
        entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
      );
      if (prev.some((entry) => entry.id === item.id)) {
        return next;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const handleAddToCart = useCallback(
    (item) => {
      addItemToCart(item);
    },
    [addItemToCart]
  );

  const handleRemoveFromCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (!existing) {
        return prev;
      }
      if (existing.quantity <= 1) {
        return prev.filter((entry) => entry.id !== item.id);
      }
      return prev.map((entry) =>
        entry.id === item.id ? { ...entry, quantity: entry.quantity - 1 } : entry
      );
    });
  };

  const handleClearCart = () => setCartItems([]);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const addProductById = useCallback(
    (id) => {
      const product = PRODUCT_INDEX[id];
      if (product) {
        addItemToCart(product);
      }
    },
    [addItemToCart]
  );

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const { type, payload } = event.data ?? {};
      if (type === "ADD_RITUAL_TO_CART" && Array.isArray(payload?.productIds)) {
        payload.productIds.forEach((productId) => addProductById(productId));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [addProductById]);

  const openRitualPlanner = () => {
    const base = (import.meta.env.BASE_URL ?? "/");
    const plannerUrl = new URL(base, window.location.origin);
    const cleanBasePath = plannerUrl.pathname.replace(/\/$/, "");
    plannerUrl.pathname = `${cleanBasePath}/rituals`;
    plannerUrl.hash = "";
    window.open(plannerUrl.toString(), "_blank");
  };

  return (
    <div>
      {/* Sticky variant demo */}
      <div className="announcement-bar" role="status" aria-live="polite">
        <button
          type="button"
          className="announcement-nav announcement-nav--prev"
          aria-label="Previous announcement"
          onClick={showPrevAnnouncement}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="announcement-track">
          {ANNOUNCEMENTS.map((announcement, index) => (
            <span
              key={announcement.id}
              className={`announcement-message ${announcement.className ?? ""} ${index === activeAnnouncement ? "is-active" : ""}`}
            >
              {announcement.text}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="announcement-nav announcement-nav--next"
          aria-label="Next announcement"
          onClick={showNextAnnouncement}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <Navbar
        sticky
        onMenuToggle={() => setDrawerOpen(true)}
        onGetStarted={openRitualPlanner}
      />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="container">
        <section className="hero-layout">
          <div className="hero">
            <h1>NaturaGloss</h1>
            <p>Elevate your daily ritual with nutrient-rich botanicals and luminous finishes.</p>
          </div>
          <aside className="cart-summary" aria-label="Shopping cart" aria-live="polite">
            <header className="cart-header">
              <span className="cart-icon">
                <CartIcon />
              </span>
              <div>
                <p className="cart-title">Cart</p>
                <span className="cart-count">{totalItems} item{totalItems === 1 ? "" : "s"}</span>
              </div>
            </header>
            {cartItems.length === 0 ? (
              <p className="cart-empty">Add a treatment to see it here.</p>
            ) : (
              <ul className="cart-list">
                {cartItems.map((item) => (
                  <li key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <span>{item.title}</span>
                      <span className="cart-qty">×{item.quantity}</span>
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveFromCart(item)}
                      aria-label={`Remove one ${item.title}`}
                    >
                      Remove item
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {cartItems.length > 0 && (
              <footer className="cart-footer">
                <button
                  type="button"
                  className="clear-cart-btn"
                  onClick={handleClearCart}
                >
                  Delete all
                </button>
              </footer>
            )}
          </aside>
        </section>

        <CardGrid
          onAddToCart={handleAddToCart}
        />
      </main>
    </div>
  );
}
