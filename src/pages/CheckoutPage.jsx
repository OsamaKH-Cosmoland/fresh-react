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

const TRUST_POINTS = [
  {
    title: "Secure checkout",
    copy: "Your details are encrypted and confirmed directly with our concierge.",
  },
  {
    title: "Cash on delivery",
    copy: "Review your NaturaGloss ritual before paying the courier in cash.",
  },
  {
    title: "Complimentary care",
    copy: "Every order ships with tailored ritual guidance and after-care support.",
  },
];

export default function CheckoutPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => readCart());
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null);
  const [checkoutStatus, setCheckoutStatus] = useState(null);
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
    formData.email.trim() &&
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
    setCheckoutStatus(null);
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

      const payloadOrderId = savedOrder.id ?? orderId;
      const itemsSummary = cartItems
        .map((item) => {
          const product = PRODUCT_INDEX[item.id] ?? {};
          return `${item.quantity}x ${product.title ?? "Custom item"}`;
        })
        .join(", ");
      const orderPayload = {
        orderId: payloadOrderId,
        orderNumber: savedOrder.orderCode ?? `NG-${Date.now()}`,
        email: formData.email.trim(),
        customerName: formData.fullName.trim(),
        items: itemsSummary,
        total: subtotal.toFixed(2),
        currency: "EGP",
      };

      const n8nResponse = await sendOrderToN8N({
        orderId: payloadOrderId,
        orderNumber: orderPayload.orderNumber,
        email: orderPayload.email || "guest@example.com",
        customerName: orderPayload.customerName || "Guest Customer",
        items: cartItems.map((item) => {
          const product = PRODUCT_INDEX[item.id] ?? {};
          return {
            title: product.title ?? "Custom item",
            quantity: item.quantity,
          };
        }),
        total: Number(subtotal.toFixed(2)),
        currency: "EGP",
      });
      console.log("[checkout] order forwarded to n8n", n8nResponse);

      try {
        const vercelResponse = await fetch("/api/order-created", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        const vercelData = await vercelResponse.json().catch(() => ({}));
        if (vercelResponse.ok && vercelData?.ok) {
          setCheckoutStatus({
            type: "success",
            message: "Order confirmation email sent. Please check your inbox shortly.",
          });
        } else {
          console.error("order-created API error", vercelData);
          setCheckoutStatus({
            type: "error",
            message: "Order received, but we could not send the confirmation email yet.",
          });
        }
      } catch (workflowError) {
        console.error("order-created API request failed", workflowError);
        setCheckoutStatus({
          type: "error",
          message: "Order received, but we could not send the confirmation email yet.",
        });
      }

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
      <Navbar
        sticky={false}
        onMenuToggle={() => setDrawerOpen(true)}
        cartCount={totalItems}
        showSectionLinks={false}
      />
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
                <input type="email" name="email" placeholder="sara@example.com" value={formData.email} onChange={handleChange} required />
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
            {checkoutStatus && (
              <p
                className={`checkout-status ${
                  checkoutStatus.type === "success" ? "checkout-status--success" : "checkout-status--error"
                }`}
              >
                {checkoutStatus.message}
              </p>
            )}

            <div className="checkout-actions">
              <button type="button" className="ghost-btn" onClick={goToCart}>Adjust bag</button>
              <button
                type="submit"
                className="cta-btn"
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

            <div className="checkout-trust-card" aria-live="polite">
              <h3>You&apos;re in safe hands</h3>
              <ul className="checkout-trust-list">
                {TRUST_POINTS.map((point) => (
                  <li key={point.title} className="checkout-trust-item">
                    <span className="checkout-trust-icon" aria-hidden="true">✶</span>
                    <div>
                      <strong>{point.title}</strong>
                      <p>{point.copy}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

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
