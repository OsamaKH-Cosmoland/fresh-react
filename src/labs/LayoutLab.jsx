import { useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import CardGrid from "../components/CardGrid.jsx";

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

  const cartQuantities = useMemo(() => {
    const map = {};
    for (const item of cartItems) {
      map[item.id] = item.quantity;
    }
    return map;
  }, [cartItems]);

  return (
    <div>
      {/* Sticky variant demo */}
      <Navbar sticky onMenuToggle={() => setDrawerOpen(true)} />
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
          onRemoveFromCart={handleRemoveFromCart}
          cartQuantities={cartQuantities}
        />

        <section id="forms" className="stack-lg">
          <h2>Responsive 2-Column Form (Stretch Goal)</h2>
          <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
            <label>
              First Name
              <input type="text" placeholder="Jane" required />
            </label>
            <label>
              Last Name
              <input type="text" placeholder="Doe" required />
            </label>
            <label className="span-2">
              Email
              <input type="email" placeholder="jane@doe.com" required />
            </label>
            <label>
              City
              <input type="text" placeholder="Alexandria" />
            </label>
            <label>
              Country
              <input type="text" placeholder="Egypt" />
            </label>
            <label className="span-2">
              Message
              <textarea rows="4" placeholder="Write your message..." />
            </label>

            <div className="span-2 form-actions">
              <button className="ghost-btn" type="reset">Reset</button>
              <button className="cta-btn" type="submit">Submit</button>
            </div>
          </form>
        </section>
      </main>

      {/* Non-sticky variant demo */}
      <section className="container stack-lg">
        <h2>Navbar (Non-Sticky Variant)</h2>
        <div className="demo-box">
          <Navbar sticky={false} onMenuToggle={() => setDrawerOpen(true)} brand="NaturaGloss (Static)" />
        </div>
      </section>
    </div>
  );
}
