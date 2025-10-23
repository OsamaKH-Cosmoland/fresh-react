import { useEffect, useMemo, useState } from "react";
import { RITUALS } from "../data/rituals.js";
import { PRODUCT_INDEX } from "../data/products.js";

const DEFAULT_RITUAL = "radiance";

export default function RitualPlanner() {
  const [focusedRitual, setFocusedRitual] = useState(DEFAULT_RITUAL);
  const [status, setStatus] = useState(null);

  const activeRitual = RITUALS[focusedRitual] ?? RITUALS[DEFAULT_RITUAL];
  const ritualProducts = useMemo(
    () =>
      activeRitual.products
        .map((id) => PRODUCT_INDEX[id])
        .filter(Boolean),
    [activeRitual]
  );

  const ritualTotal = useMemo(() => {
    const sum = ritualProducts.reduce((acc, product) => acc + parseFloat(product.price), 0);
    return `${sum.toFixed(2)} EGP`;
  }, [ritualProducts]);

  useEffect(() => {
    if (!status) {
      return undefined;
    }
    const timer = setTimeout(() => setStatus(null), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  const notify = (type, message) => {
    setStatus({ type, message });
  };

  const sendProductsToOrigin = (productIds) => {
    const hasOpener = typeof window !== "undefined" && window.opener && !window.opener.closed;
    if (hasOpener) {
      window.opener.postMessage(
        { type: "ADD_RITUAL_TO_CART", payload: { productIds } },
        window.location.origin
      );
      notify("success", "Your ritual was added to the NaturaGloss bag.");
    } else {
      notify("info", "Keep the NaturaGloss collection tab open to sync your ritual bag.");
    }
  };

  const handleAddKit = () => {
    sendProductsToOrigin(activeRitual.products);
  };

  const handleAddSolo = (productId) => {
    sendProductsToOrigin([productId]);
  };

  const handleBackHome = () => {
    const base = import.meta.env.BASE_URL ?? "/";
    window.location.href = base;
  };

  const handleBackToLab = () => {
    if (typeof window !== "undefined") {
      window.close();
    }
    handleBackHome();
  };

  return (
    <div className="ritual-page">
      <button
        type="button"
        className="ritual-back-btn"
        aria-label="Back to NaturaGloss collection"
        onClick={handleBackToLab}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M5.707 12.707a1 1 0 0 1 0-1.414l4.95-4.95a1 1 0 1 1 1.414 1.414L8.828 11H18a1 1 0 1 1 0 2H8.828l3.243 3.243a1 1 0 0 1-1.414 1.414l-4.95-4.95Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <header className="ritual-hero">
        <p className="ritual-hero-kicker">NaturaGloss Atelier</p>
        <h1>Design your signature body ritual</h1>
        <p className="ritual-hero-copy">
          Begin with an intention, preview sensorial steps, then send your curated kit back to the
          NaturaGloss collection whenever you are ready.
        </p>
        <div className="ritual-hero-actions">
          <button type="button" className="cta-btn" onClick={handleAddKit}>
            Send current ritual to bag
          </button>
        </div>
      </header>

      <main className="ritual-shell">
        <aside className="ritual-focus-panel" aria-label="Select a NaturaGloss intention">
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
          <section className="ritual-services" aria-label="Member services">
            <h2>Signature services</h2>
            <ul>
              <li>15-minute ritual fitting with NaturaGloss atelier guides.</li>
              <li>Refill cadence reminders that match your lifestyle rhythm.</li>
              <li>Seasonal Nile Delta botanicals reserved for members.</li>
            </ul>
          </section>
        </aside>

        <section className="ritual-content" aria-live="polite">
          <p className="ritual-step-label">Step 2: Explore your ritual blueprint</p>
          <h2 className="ritual-heading">{activeRitual.title}</h2>
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
              <h3>Ritual companions</h3>
              <span className="ritual-kit-count">
                {ritualProducts.length} item{ritualProducts.length === 1 ? "" : "s"} | {ritualTotal}
              </span>
            </header>
            <div className="ritual-product-grid">
              {ritualProducts.map((product) => (
                <article key={product.id} className="ritual-product-card">
                  {product.image && <img src={product.image} alt={product.title} />}
                  <p className="ritual-product-name">{product.title}</p>
                  <p className="ritual-product-price">{product.price}</p>
                  <button
                    type="button"
                    className="ghost-btn ghost-btn--compact"
                    onClick={() => handleAddSolo(product.id)}
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
            <button type="button" className="cta-btn ritual-add-btn" onClick={handleAddKit}>
              Add entire ritual to bag
            </button>
            <button type="button" className="ghost-btn ritual-secondary-btn" onClick={handleBackHome}>
              Browse full apothecary
            </button>
          </div>
        </section>
      </main>

      {status && (
        <div className={`ritual-status ritual-status--${status.type}`} role="status">
          {status.message}
        </div>
      )}
    </div>
  );
}
