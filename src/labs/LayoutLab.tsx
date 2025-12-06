import { Button } from "../components/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import CardGrid from "../components/CardGrid";
import ReviewsSection from "../components/ReviewsSection";
import collectionImage from "../assets/collection.png";
import iconLeft from "../assets/NaturaGloss_shiny_gold_icon_left.webp";
import iconMiddle from "../assets/NaturaGloss_shiny_gold_icon_middle.webp";
import iconRight from "../assets/NaturaGloss_shiny_gold_icon_right.webp";
import { PRODUCT_INDEX } from "../data/products";
import { addCartItem, readCart, subscribeToCart, writeCart, type CartItem } from "../utils/cartStorage";
import type { Product } from "../types/product";

const ANNOUNCEMENTS = [
  { id: 0, text: "Because your body deserves natural luxury", className: "announcement-message--secondary" },
  { id: 1, text: "Inspired by European cosmetic standards, handcrafted in Egypt", className: "announcement-message--primary" },
];

export default function LayoutLab() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => readCart());
  const [activeAnnouncement, setActiveAnnouncement] = useState(1);
  const rotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const announcementCount = ANNOUNCEMENTS.length || 1;

  const restartRotation = useCallback(() => {
    if (rotationRef.current) {
      clearInterval(rotationRef.current);
    }
    rotationRef.current = setInterval(() => {
      setActiveAnnouncement((prev) => (prev + 1) % announcementCount);
    }, 5000);
  }, [announcementCount]);

  useEffect(() => {
    restartRotation();
    return () => {
      if (rotationRef.current) clearInterval(rotationRef.current);
    };
  }, [restartRotation]);

  useEffect(() => {
    writeCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    return subscribeToCart(setCartItems);
  }, []);

  const showPrevAnnouncement = () => {
    setActiveAnnouncement((prev) => (prev - 1 + announcementCount) % announcementCount);
    restartRotation();
  };

  const showNextAnnouncement = () => {
    setActiveAnnouncement((prev) => (prev + 1) % announcementCount);
    restartRotation();
  };

  const addItemToCart = useCallback((item: Product) => {
    setCartItems((previous) => addCartItem(previous, item));
  }, []);

  const handleAddToCart = useCallback(
    (item: Product) => {
      addItemToCart(item);
    },
    [addItemToCart]
  );

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const addProductById = useCallback(
    (id: number) => {
      const product = PRODUCT_INDEX[id];
      if (product) {
        addItemToCart(product);
      }
    },
    [addItemToCart]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const { type, payload } = event.data ?? {};
      if (type === "ADD_RITUAL_TO_CART" && Array.isArray(payload?.productIds)) {
        payload.productIds.forEach((productId: number) => addProductById(productId));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [addProductById]);

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
      <Navbar sticky onMenuToggle={() => setDrawerOpen(true)} cartCount={totalItems} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="landing-hero">
        <div className="landing-hero__copy rise-sequence">
          <h1>Luxury Inspired by Nature’s Essence</h1>
          <p>
            Indulge in a world of serenity and sophistication, natural care designed for those who
            value beauty with soul.
          </p>
        </div>
        <figure className="landing-hero__media rise-once">
          <img src={collectionImage} alt="NaturaGloss collection of botanical care" />
        </figure>
      </main>
      <section
        className="landing-stories rise-sequence"
        aria-labelledby="landing-stories-title"
      >
        <div className="landing-stories__content">
          <p className="landing-stories__eyebrow">The Ritual Journal</p>
          <h2 id="landing-stories-title">Ritual Stories</h2>
          <p>
            Slow, sensory routines captured in words—read how botanicals, breath, and intention
            guide each evening, morning, and pause.
          </p>
          <div className="landing-stories__actions">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => (window.location.href = "/stories")}
            >
              Our Journal
            </Button>
          </div>
        </div>
      </section>

      <section className="landing-values rise-sequence">
        <h2>Why Choose NaturaGloss</h2>
        <div className="landing-values__grid rise-grid">
          <article className="rise-sequence">
            <img src={iconLeft} alt="" aria-hidden="true" />
            <h3>Small-Batch Quality</h3>
            <p>
              Handcrafted in limited runs to ensure every bar and balm is fresh and carefully made.
            </p>
          </article>
          <article className="rise-sequence">
            <img src={iconMiddle} alt="" aria-hidden="true" />
            <h3>Ingredient Transparency</h3>
            <p>
              Every ingredient fully listed — no hidden chemicals, just pure botanicals.
            </p>
          </article>
          <article className="rise-sequence">
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
          <section className="hero legacy-hero-intro rise-sequence" id="about">
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

      <ReviewsSection />
    </div>
  );
}
