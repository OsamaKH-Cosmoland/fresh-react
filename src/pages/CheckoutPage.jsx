import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { readCart, writeCart, subscribeToCart } from "../utils/cartStorage.js";
import { PRODUCT_INDEX } from "../data/products.js";
import { apiPost } from "../lib/api";
import { sendOrderToN8N } from "../api/orders.js";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  notes: "",
};

const parsePrice = (price) => {
  const number = parseFloat(String(price).replace(/[^\d.]/g, ""));
  return Number.isNaN(number) ? 0 : number;
};

const generateOrderId = () => `NG-${Date.now().toString(36).toUpperCase()}`;

export default function CheckoutPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => readCart());
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { writeCart(cartItems); }, [cartItems]);
  useEffect(() => subscribeToCart(setCartItems), []);

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

  const cartIsEmpty = cartItems.length === 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const goToCollection = () => {
    const base = import.meta.env.BASE_URL ?? "/";
    const collectionUrl = new URL(base, window.location.origin);
    collectionUrl.searchParams.delete("view");
    collectionUrl.hash = "grid";
    window.location.href = collectionUrl.toString();
  };

  const goToCart = () => {
    const base = import.meta.env.BASE_URL ?? "/";
    const cartUrl = new URL(base, window.location.origin);
    cartUrl.searchParams.set("view", "cart");
    cartUrl.hash = "";
    window.location.href = cartUrl.toString();
  };

  const isFormValid =
    formData.fullName.trim() &&
    formData.phone.trim() &&
    formData.address.trim() &&
    formData.city.trim();

  const handlePlaceOrder = async (event) => {
    event?.preventDefault?.();
    if (cartIsEmpty) {
      setStatus({ type: "error", message: "Add at least one product before placing an order." });
      return;
    }
    if (!isFormValid) {
      setStatus({ type: "error", message: "Please complete the required delivery details." });
      return;
    }
    setIsSubmitting(true);
    setStatus(null);
    try {
      const orderId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : generateOrderId();
      const order = {
        id: orderId,
        createdAt: new Date().toISOString(),
        paymentMethod: "cash_on_delivery",
        status: "pending",
        totals: {
          items: totalItems,
          subtotal: Number(subtotal.toFixed(2)),
        },
        customer: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          notes: formData.notes.trim(),
        },
        items: cartItems.map((item) => {
          const product = PRODUCT_INDEX[item.id] ?? {};
          return {
            id: item.id,
            title: product.title ?? "Custom item",
            quantity: item.quantity,
            unitPrice: product.price ?? "0 EGP",
          };
        }),
      };

      const response = await apiPost("/orders", order);
      if (!response.ok) {
        let message = `Unable to submit order (status ${response.status}).`;
        try {
          const errorBody = await response.json();
          if (errorBody?.error) message = errorBody.error;
        } catch {}
        throw new Error(message);
      }

      const savedOrder = await response.json().catch(() => order);

      const orderPayload = {
        orderId: savedOrder.id ?? orderId,
        orderNumber: savedOrder.orderCode ?? orderId,
        email: formData.email.trim() || "guest@example.com", // TODO: require customer email once UX allows
        customerName: formData.fullName.trim() || "Guest Customer",
        items: cartItems.map((item) => {
          const product = PRODUCT_INDEX[item.id] ?? {};
          return {
            title: product.title ?? "Custom item",
            quantity: item.quantity,
          };
        }),
        total: Number(subtotal.toFixed(2)),
        currency: "EGP", // TODO: derive currency dynamically when multi-currency is supported
      };

      const n8nResponse = await sendOrderToN8N(orderPayload);
      console.log("[checkout] order forwarded to n8n", n8nResponse);
      writeCart([]);
      setCartItems([]);
      setFormData(EMPTY_FORM);
      setStatus({
        type: "success",
        message: `Your cash order ${savedOrder.id ?? orderId} has been received. Our concierge will call to confirm delivery and collect payment in cash upon arrival.`,
      });
      window.alert("Your cash order was placed successfully!");
    } catch (error) {
      console.error("Checkout submit failed", error);
      setStatus({ type: "error", message: error.message ?? "Unable to place order right now." });
      window.alert(error.message ?? "Unable to place order right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <Navbar sticky={false} onMenuToggle={() => setDrawerOpen(true)} cartCount={totalItems} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="checkout-shell">
        <header className="checkout-hero">
          <p className="checkout-eyebrow">Cash on Delivery</p>
          <h1>Secure your ritual delivery</h1>
          <p>
            Complete your delivery details and confirm the order. Payment is collected in cash when
            your NaturaGloss ritual arrives.
          </p>
        </header>

        <section className="checkout-grid">
          <form className="checkout-form" onSubmit={handlePlaceOrder}>
            <fieldset className="checkout-fields">
              <legend>Delivery details</legend>
              <label>
                Full name
                <input type="text" name="fullName" placeholder="Sara Nour" value={formData.fullName} onChange={handleChange} required />
              </label>
              <label>
                Phone number
                <input type="tel" name="phone" placeholder="+20 1X XXX XXXX" value={formData.phone} onChange={handleChange} required />
              </label>
              <label>
                Email
                <input type="email" name="email" placeholder="sara@example.com" value={formData.email} onChange={handleChange} />
              </label>
              <label>
                City
                <input type="text" name="city" placeholder="Cairo" value={formData.city} onChange={handleChange} required />
              </label>
              <label className="checkout-span-2">
                Address / Landmark
                <input type="text" name="address" placeholder="Building, street, floor..." value={formData.address} onChange={handleChange} required />
              </label>
              <label className="checkout-span-2">
                Notes for the courier (optional)
                <textarea name="notes" rows="3" placeholder="Entrance code, ideal delivery slot, etc." value={formData.notes} onChange={handleChange} />
              </label>
            </fieldset>

            <fieldset className="checkout-payment">
              <legend>Payment method</legend>
              <label className="checkout-cash-option">
                <input type="radio" name="payment" checked readOnly />
                <div>
                  <strong>Cash on Delivery</strong>
                  <span>Pay the courier once your NaturaGloss box is delivered.</span>
                </div>
              </label>
            </fieldset>

            {status?.type === "error" && <p className="checkout-status checkout-status--error">{status.message}</p>}

            <div className="checkout-actions">
              <button type="button" className="ghost-btn" onClick={goToCart}>Adjust bag</button>
              <button
                type="submit"
                className="cta-btn"
                onClick={handlePlaceOrder}
                disabled={!isFormValid || cartIsEmpty || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Place cash order"}
              </button>
            </div>
          </form>

          <aside className="checkout-summary" aria-live="polite">
            <h2>Order summary</h2>
            {cartIsEmpty ? (
              <div className="checkout-empty">
                <p>Your bag is empty. Add a treatment to continue.</p>
                <button type="button" className="cta-btn" onClick={goToCollection}>Return to collection</button>
              </div>
            ) : (
              <>
                <ul className="checkout-items">
                  {cartItems.map((item) => {
                    const product = PRODUCT_INDEX[item.id];
                    if (!product) return null;
                    return (
                      <li key={item.id}>
                        <div>
                          <p className="checkout-item-title">{product.title}</p>
                          <p className="checkout-item-desc">{product.desc}</p>
                        </div>
                        <div className="checkout-item-meta">
                          <span>{product.price}</span>
                          <span>× {item.quantity}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <dl className="checkout-totals">
                  <div><dt>Items</dt><dd>{totalItems}</dd></div>
                  <div><dt>Subtotal</dt><dd>{subtotal.toFixed(2)} EGP</dd></div>
                  <div><dt>Payment</dt><dd>Cash on delivery</dd></div>
                </dl>
                <p className="checkout-note">
                  Our concierge will contact you to confirm the delivery window. Payment is collected
                  in cash upon delivery.
                </p>
              </>
            )}

            {status?.type === "success" && (
              <div className="checkout-status checkout-status--success">
                <p>{status.message}</p>
                <button type="button" className="ghost-btn" onClick={goToCollection}>Continue shopping</button>
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
