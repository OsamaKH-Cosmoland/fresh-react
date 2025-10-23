import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import CardGrid from "../components/CardGrid.jsx";
import { PRODUCT_INDEX } from "../data/products.js";

const ANNOUNCEMENTS = [
  { id: 0, text: "Because your body deserves natural luxury", className: "announcement-message--secondary" },
  { id: 1, text: "Inspired by European cosmetic standards, handcrafted in Egypt", className: "announcement-message--primary" },
];

const RITUALS = {
  radiance: {
    id: "radiance",
    title: "Radiant Dawn Ritual",
    focus: "Amplify luminosity before celebrations or golden-hour moments.",
    description:
      "Saturate the skin with micro-fine botanicals and seal in chroma-rich nourishment for a glow that lingers long after sunset.",
    products: [1, 4],
    steps: [
      {
        title: "Bloom Infused Cleanse",
        body: "Massage Silk Blossom Body Soap over damp skin using upward strokes to boost circulation and deliver jasmine-derived antioxidants.",
      },
      {
        title: "Ceramide Veil Finish",
        body: "Warm a pearl of Hand Balm between palms, then press across décolletage and hands for a serum-like gleam without residue.",
      },
    ],
    tip: "For a camera-ready sheen, mist skin with warm water and re-press Hand Balm onto high points moments before stepping out.",
  },
  calm: {
    id: "calm",
    title: "Moonlit Reset Ritual",
    focus: "Recalibrate sensitized skin and ease the nervous system before restorative sleep.",
    description:
      "Bathe in blue chamomile steam, then cocoon skin with nutrient-dense lipids to balance moisture and melt away daily stress.",
    products: [2, 3],
    steps: [
      {
        title: "Chamomile Steam Bathe",
        body: "Glide Calm & Glow Body Soap across skin and pause; inhale neroli vapors three deep breaths before rinsing to signal calm.",
      },
      {
        title: "Melted Butter Wrap",
        body: "Melt Body Balm between fingertips and sweep over limbs while skin is still damp to seal hydration and restore elasticity.",
      },
    ],
    tip: "Layer Body Balm beneath a lightweight cotton robe for 5 minutes to create a self-heating cocoon that optimizes absorption.",
  },
  strength: {
    id: "strength",
    title: "Root-to-Tip Fortify Ritual",
    focus: "Rebuild scalp resilience and lock in glassy shine for textured or color-treated hair.",
    description:
      "Stimulate circulation at the scalp, then encase strands in lightweight glossifiers so hair feels strong, lifted, and frizz-free.",
    products: [5, 6],
    steps: [
      {
        title: "Micro-Circulation Activation",
        body: "Section hair and massage Hair Growth Oil into scalp with small circular motions to feed follicles with rosemary stem cells.",
      },
      {
        title: "Cuticle Glassing Finish",
        body: "Smooth Hair Shine & Anti-Frizz Oil over mid-lengths through ends, focusing on frizz zones for high-gloss control.",
      },
    ],
    tip: "Wrap hair in a warm towel for 8 minutes after oiling to drive botanicals deeper and boost resilience between salon visits.",
  },
};

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
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const [focusedRitual, setFocusedRitual] = useState("radiance");

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveAnnouncement((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!getStartedOpen) {
      return;
    }
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setGetStartedOpen(false);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [getStartedOpen]);

  const showPrevAnnouncement = () => {
    setActiveAnnouncement((prev) => (prev - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);
  };

  const showNextAnnouncement = () => {
    setActiveAnnouncement((prev) => (prev + 1) % ANNOUNCEMENTS.length);
  };

  const handleAddToCart = (item) => {
    setCartItems((prev) => {
      const next = prev.map((entry) =>
        entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
      );
      if (prev.some((entry) => entry.id === item.id)) {
        return next;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

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

  const activeRitual = RITUALS[focusedRitual] ?? RITUALS.radiance;
  const ritualProducts = useMemo(() => {
    if (!activeRitual) {
      return [];
    }
    return activeRitual.products
      .map((id) => PRODUCT_INDEX[id])
      .filter(Boolean);
  }, [activeRitual]);

  const ritualTotal = useMemo(() => {
    if (!ritualProducts.length) {
      return "0.00";
    }
    const sum = ritualProducts.reduce((acc, product) => acc + parseFloat(product.price), 0);
    return sum.toFixed(2);
  }, [ritualProducts]);

  const handleAddRitualToCart = (ids) => {
    ids.forEach((id) => {
      const product = PRODUCT_INDEX[id];
      if (product) {
        handleAddToCart(product);
      }
    });
    setGetStartedOpen(false);
  };

  const scrollToCollection = () => {
    const target = document.getElementById("grid");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setGetStartedOpen(false);
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
        onGetStarted={() => setGetStartedOpen(true)}
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

      {getStartedOpen && activeRitual && (
        <div
          className="ritual-overlay"
          role="presentation"
          onClick={() => setGetStartedOpen(false)}
        >
          <div
            className="ritual-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ritual-heading"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="ritual-close"
              aria-label="Close ritual planner"
              onClick={() => setGetStartedOpen(false)}
            >
              ×
            </button>
            <aside className="ritual-sidebar">
              <p className="ritual-step-label">Step 1: Choose your intention</p>
              <div className="ritual-focus-list">
                {Object.values(RITUALS).map((ritual) => (
                  <button
                    type="button"
                    key={ritual.id}
                    className={`ritual-focus-btn ${focusedRitual === ritual.id ? "is-active" : ""}`}
                    onClick={() => setFocusedRitual(ritual.id)}
                  >
                    <span className="ritual-focus-title">{ritual.title}</span>
                    <span className="ritual-focus-sub">{ritual.focus}</span>
                  </button>
                ))}
              </div>
              <div className="ritual-sidebar-footer">
                <p className="ritual-sidebar-heading">Signature services</p>
                <ul>
                  <li>Complimentary 15-minute ritual fitting by NaturaGloss atelier guides.</li>
                  <li>Personalized refill cadence reminders tailored to your lifestyle.</li>
                  <li>Members-only access to seasonal botanicals from the Nile Delta harvest.</li>
                </ul>
              </div>
            </aside>
            <section className="ritual-content">
              <p className="ritual-step-label">Step 2: Preview your NaturaGloss ritual</p>
              <h3 id="ritual-heading" className="ritual-heading">{activeRitual.title}</h3>
              <p className="ritual-description">{activeRitual.description}</p>

              <ul className="ritual-steps">
                {activeRitual.steps.map((step, index) => (
                  <li key={step.title}>
                    <span className="ritual-step-index">0{index + 1}</span>
                    <div>
                      <p className="ritual-step-title">{step.title}</p>
                      <p className="ritual-step-body">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="ritual-kit">
                <header>
                  <h4>Ritual companions</h4>
                  <span className="ritual-kit-count">
                    {ritualProducts.length} item{ritualProducts.length === 1 ? "" : "s"} | {ritualTotal} EGP
                  </span>
                </header>
                <div className="ritual-product-grid">
                  {ritualProducts.map((product) => (
                    <article key={product.id} className="ritual-product-card">
                      {product.image && (
                        <img src={product.image} alt={product.title} />
                      )}
                      <p className="ritual-product-name">{product.title}</p>
                      <p className="ritual-product-price">{product.price}</p>
                      <button
                        type="button"
                        className="ghost-btn ghost-btn--compact"
                        onClick={() => handleAddToCart(product)}
                      >
                        Add solo
                      </button>
                    </article>
                  ))}
                </div>
                <p className="ritual-tip">
                  <strong>Pro tip:</strong> {activeRitual.tip}
                </p>
              </div>

              <div className="ritual-actions">
                <button
                  type="button"
                  className="cta-btn ritual-add-btn"
                  onClick={() => handleAddRitualToCart(activeRitual.products)}
                >
                  Add this ritual to cart
                </button>
                <button
                  type="button"
                  className="ghost-btn ritual-secondary-btn"
                  onClick={scrollToCollection}
                >
                  Explore the full apothecary
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

    </div>
  );
}
