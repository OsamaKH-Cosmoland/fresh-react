import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import CardGrid from "../components/CardGrid.jsx";
import collectionImage from "../assets/collection.png";
import iconLeft from "../assets/NaturaGloss_shiny_gold_icon_left.webp";
import iconMiddle from "../assets/NaturaGloss_shiny_gold_icon_middle.webp";
import iconRight from "../assets/NaturaGloss_shiny_gold_icon_right.webp";
import { PRODUCT_INDEX } from "../data/products.js";
import {
  addCartItem,
  readCart,
  subscribeToCart,
  writeCart,
} from "../utils/cartStorage.js";

const ANNOUNCEMENTS = [
  { id: 0, text: "Because your body deserves natural luxury", className: "announcement-message--secondary" },
  { id: 1, text: "Inspired by European cosmetic standards, handcrafted in Egypt", className: "announcement-message--primary" },
];

export default function LayoutLab() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => readCart());
  const [activeAnnouncement, setActiveAnnouncement] = useState(1);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveAnnouncement((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    writeCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    return subscribeToCart(setCartItems);
  }, []);

  const showPrevAnnouncement = () => {
    setActiveAnnouncement((prev) => (prev - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);
  };

  const showNextAnnouncement = () => {
    setActiveAnnouncement((prev) => (prev + 1) % ANNOUNCEMENTS.length);
  };

  const addItemToCart = useCallback((item) => {
    setCartItems((previous) => addCartItem(previous, item));
  }, []);

  const handleAddToCart = useCallback(
    (item) => {
      addItemToCart(item);
    },
    [addItemToCart]
  );

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

  const openPlanner = () => {
    const base = import.meta.env.BASE_URL ?? "/";
    const plannerUrl = new URL(base, window.location.origin);
    plannerUrl.searchParams.set("view", "ritualplanner");
    plannerUrl.hash = "";
    window.location.href = plannerUrl.toString();
  };

  return (
    <div className="landing-page">
      <div className="legacy-announcement">
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
      </div>
      <Navbar sticky onMenuToggle={() => setDrawerOpen(true)} onGetStarted={openPlanner} cartCount={totalItems} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="landing-hero">
        <div className="landing-hero__copy">
          <h1>Luxury Inspired by Nature’s Essence</h1>
          <p>
            Indulge in a world of serenity and sophistication, natural care designed for those who
            value beauty with soul.
          </p>
        </div>
        <figure className="landing-hero__media">
          <img src={collectionImage} alt="NaturaGloss collection of botanical care" />
        </figure>
      </main>

      <section className="landing-values">
        <h2>Why Choose NaturaGloss</h2>
        <div className="landing-values__grid">
          <article>
            <img src={iconLeft} alt="" aria-hidden="true" />
            <h3>Small-Batch Quality</h3>
            <p>
              Handcrafted in limited runs to ensure every bar and balm is fresh and carefully made.
            </p>
          </article>
          <article>
            <img src={iconMiddle} alt="" aria-hidden="true" />
            <h3>Ingredient Transparency</h3>
            <p>
              Every ingredient fully listed — no hidden chemicals, just pure botanicals.
            </p>
          </article>
          <article>
            <img src={iconRight} alt="" aria-hidden="true" />
            <h3>EU-Inspired Standards</h3>
            <p>
              Formulated with guidance from European cosmetic safety and quality practices.
            </p>
          </article>
        </div>
      </section>

      <div className="legacy-section">
        <div className="container legacy-content">
          <section className="hero legacy-hero-intro" id="about">
            <h1>NaturaGloss</h1>
            <p>
              Elevate your daily ritual with nutrient-rich botanicals and luminous finishes, crafted
              in small batches for those who seek intentional, radiant self-care.
            </p>
          </section>

          <CardGrid
            onAddToCart={handleAddToCart}
          />
        </div>
      </div>
    </div>
  );
}
