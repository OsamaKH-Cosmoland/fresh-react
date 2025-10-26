import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import {
  addCartItem,
  readCart,
  removeCartItem,
  subscribeToCart,
  writeCart,
} from "../utils/cartStorage.js";
import { PRODUCT_INDEX } from "../data/products.js";

const parsePrice = (price) => {
  const number = parseFloat(String(price).replace(/[^\d.]/g, ""));
  return Number.isNaN(number) ? 0 : number;
};

export default function CartPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => readCart());

  const goToCollection = () => {
    const base = import.meta.env.BASE_URL ?? "/";
    window.location.href = base;
  };

  const openPlanner = () => {
    const base = import.meta.env.BASE_URL ?? "/";
    const plannerUrl = new URL(base, window.location.origin);
    plannerUrl.searchParams.set("view", "ritualplanner");
    plannerUrl.hash = "";
    window.location.href = plannerUrl.toString();
  };

  const goToCheckout = () => {
    const base = import.meta.env.BASE_URL ?? "/";
    const checkoutUrl = new URL(base, window.location.origin);
    checkoutUrl.searchParams.set("view", "checkout");
    checkoutUrl.hash = "";
    window.location.href = checkoutUrl.toString();
  };

  useEffect(() => {
    writeCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    return subscribeToCart(setCartItems);
  }, []);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        const product = PRODUCT_INDEX[item.id];
        if (!product) return sum;
        return sum + parsePrice(product.price) * item.quantity;
      }, 0),
    [cartItems]
  );

  const updateCart = (updater) => {
    setCartItems((previous) => updater(previous));
  };

  const incrementItem = (id) => {
    const product = PRODUCT_INDEX[id];
    if (!product) return;
    updateCart((prev) => addCartItem(prev, product));
  };

  const decrementItem = (id) => {
    const product = PRODUCT_INDEX[id];
    if (!product) return;
    updateCart((prev) => removeCartItem(prev, product));
  };

  const removeItem = (id) => {
    updateCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    updateCart(() => []);
  };

  return (
    <div className="cart-page">
      <Navbar
        sticky={false}
        onMenuToggle={() => setDrawerOpen(true)}
        onGetStarted={openPlanner}
        cartCount={totalItems}
      />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="cart-shell">
        <header className="cart-header-block">
          <h1>Your NaturaGloss Bag</h1>
          <p>
            Review your curated ritual before checkout. Adjust quantities or keep exploring the collection.
          </p>
        </header>

        {cartItems.length === 0 ? (
          <section className="cart-empty-state">
            <p>Your bag is feeling light. Add a treatment from the collection to begin your ritual.</p>
            <button type="button" className="cta-btn" onClick={goToCollection}>
              Return to collection
            </button>
          </section>
        ) : (
          <section className="cart-layout">
            <div className="cart-items-panel" aria-live="polite">
              <ul className="cart-page-list">
                {cartItems.map((item) => {
                  const product = PRODUCT_INDEX[item.id];
                  if (!product) return null;
                  return (
                    <li key={item.id} className="cart-page-item">
                      <div className="cart-page-info">
                        <h3>{product.title}</h3>
                        <p>{product.desc}</p>
                        <span className="cart-page-price">{product.price}</span>
                      </div>
                      <div className="cart-page-actions">
                        <div className="cart-qty-controls" aria-label={`Quantity of ${product.title}`}>
                          <button type="button" onClick={() => decrementItem(item.id)} aria-label={`Remove one ${product.title}`}>
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => incrementItem(item.id)} aria-label={`Add one ${product.title}`}>
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => removeItem(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="cart-controls">
                <button type="button" className="ghost-btn" onClick={goToCollection}>
                  Continue shopping
                </button>
                <button type="button" className="ghost-btn" onClick={clearCart}>
                  Clear bag
                </button>
              </div>
            </div>

            <aside className="cart-summary-panel">
              <h2>Order Summary</h2>
              <dl>
                <div>
                  <dt>Items</dt>
                  <dd>{totalItems}</dd>
                </div>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{subtotal.toFixed(2)} EGP</dd>
                </div>
              </dl>
              <p className="cart-summary-note">
                Shipping and taxes are calculated at checkout. NaturaGloss offers complimentary ritual fitting on orders over 750 EGP.
              </p>
              <button type="button" className="cta-btn" onClick={goToCheckout}>
                Proceed to checkout
              </button>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
