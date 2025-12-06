import { useState } from "react";
import type React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { PRODUCT_INDEX } from "../data/products";
import { apiPost } from "../lib/api";
import { sendOrderToN8N, type OrderWebhookPayload } from "../api/orders";
import type { Order } from "../types/order";
import { Button, Card, InputField, SectionTitle, TextareaField } from "../components/ui";
import { useCart } from "@/cart/cartStore";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  notes: "",
};

type CheckoutForm = typeof EMPTY_FORM;

type StatusMessage = { type: "error" | "success"; message: string };

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
  const {
    cartItems,
    totalQuantity,
    subtotal,
    clearCart,
    savedCarts,
    activeSavedCartId,
    saveCurrentCart,
    loadSavedCart,
    deleteSavedCart,
    renameSavedCart,
  } = useCart();
  const [formData, setFormData] = useState<CheckoutForm>(EMPTY_FORM);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checkoutStatus, setCheckoutStatus] = useState<StatusMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const totalItems = totalQuantity;
  const cartIsEmpty = cartItems.length === 0;
  const canSaveBag = Boolean(saveName.trim()) && cartItems.length > 0;

  const handleSaveBag = () => {
    setSavedFeedback(null);
    if (!canSaveBag) {
      setSavedFeedback("Name your ritual and add a product before saving.");
      return;
    }
    if (saveCurrentCart(saveName)) {
      setSavedFeedback("Bag saved.");
      setSaveName("");
    } else {
      setSavedFeedback("Unable to save the bag right now.");
    }
  };

  const handleLoadBag = (id: string, name: string) => {
    if (loadSavedCart(id)) {
      setSavedFeedback(`Loaded "${name}".`);
    }
  };

  const handleDeleteBag = (id: string, name: string) => {
    if (deleteSavedCart(id)) {
      setSavedFeedback(`Deleted "${name}".`);
    }
  };

  const handleRenameBag = (id: string, currentName: string) => {
    const nextName = window.prompt("Rename saved bag", currentName);
    if (!nextName) return;
    if (renameSavedCart(id, nextName)) {
      setSavedFeedback(`Renamed to "${nextName}".`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
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

  const requiredFields = ["fullName", "phone", "email", "address", "city"] as const;
  const isFormValid =
    formData.fullName.trim() &&
    formData.phone.trim() &&
    formData.email.trim() &&
    formData.address.trim() &&
    formData.city.trim();

const handlePlaceOrder = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault?.();
    if (cartIsEmpty) {
      setStatus({ type: "error", message: "Add at least one product before placing an order." });
      return;
    }
    const newFieldErrors: Record<string, string> = {};
    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        newFieldErrors[field] = "Can't leave this field empty";
      }
    });
    if (Object.keys(newFieldErrors).length) {
      setFieldErrors(newFieldErrors);
      setStatus({ type: "error", message: "Please complete the required delivery details." });
      return;
    }
    setIsSubmitting(true);
    setStatus(null);
    setCheckoutStatus(null);
    setFieldErrors({});
    try {
      const orderId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : generateOrderId();
      const order: Order = {
        id: orderId,
        createdAt: new Date().toISOString(),
        paymentMethod: "cash_on_delivery",
        status: "pending",
        totals: {
          items: totalItems,
          subtotal: Number(subtotal.toFixed(2)),
          subTotal: Number(subtotal.toFixed(2)),
          shipping: 0,
          currency: "EGP",
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
      const itemsPayload = cartItems.map((item) => {
        const product = PRODUCT_INDEX[item.id] ?? {};
        return {
          title: product.title ?? "Custom item",
          quantity: item.quantity,
        };
      });
      const orderPayload: OrderWebhookPayload = {
        orderId: payloadOrderId,
        orderNumber: savedOrder.orderCode ?? `NG-${Date.now()}`,
        email: formData.email.trim(),
        customerName: formData.fullName.trim(),
        items: itemsPayload,
        total: Number(subtotal.toFixed(2)),
        currency: "EGP",
      };

      const n8nResponse = await sendOrderToN8N({
        orderId: payloadOrderId,
        orderNumber: orderPayload.orderNumber,
        email: orderPayload.email || "guest@example.com",
        customerName: orderPayload.customerName || "Guest Customer",
        items: itemsPayload,
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

      clearCart();
      setFormData(EMPTY_FORM);
      setStatus({
        type: "success",
        message: `Your cash order ${savedOrder.id ?? orderId} has been received. Our concierge will call to confirm delivery and collect payment in cash upon arrival.`,
      });
      window.alert("Your cash order was placed successfully!");
    } catch (error) {
      console.error("Checkout submit failed", error);
      const message = (error as Error)?.message ?? "Unable to place order right now.";
      setStatus({ type: "error", message });
      window.alert(message);
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
            <Card className="checkout-form-card">
              <SectionTitle
                title="Delivery details"
                subtitle="Complete the delivery info and our concierge will confirm the order."
              />
              <div className="checkout-fields">
                <InputField
                  label="Full name"
                  name="fullName"
                  placeholder="Sara Nour"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  error={fieldErrors.fullName}
                />
                <InputField
                  label="Phone number"
                  name="phone"
                  type="tel"
                  placeholder="+20 1X XXX XXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  error={fieldErrors.phone}
                />
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="sara@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  error={fieldErrors.email}
                />
                <InputField
                  label="City"
                  name="city"
                  placeholder="Cairo"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  error={fieldErrors.city}
                />
                <InputField
                  label="Address / Landmark"
                  name="address"
                  placeholder="Building, street, floor..."
                  value={formData.address}
                  onChange={handleChange}
                  required
                  containerClassName="checkout-span-2"
                  error={fieldErrors.address}
                />
                <TextareaField
                  label="Notes for the courier (optional)"
                  name="notes"
                  placeholder="Entrance code, ideal delivery slot, etc."
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  containerClassName="checkout-span-2"
                />
              </div>

              <SectionTitle title="Payment method" className="mt-6" />
              <fieldset className="checkout-payment">
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
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  className="ghost-btn"
                  onClick={goToCart}
                >
                  Adjust bag
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="cta-btn"
                  disabled={!isFormValid || cartIsEmpty || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Place cash order"}
                </Button>
              </div>
            </Card>
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

            <Card className="checkout-saved-bags">
              <SectionTitle
                title="Saved bags"
                subtitle="Reuse rituals or save the bag you already curated."
                align="left"
                className="mb-4"
              />
              <div className="saved-bags-form">
                <InputField
                  label="Bag name"
                  placeholder="Evening Ritual, Gift Set..."
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  containerClassName="saved-bags-form-field"
                />
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleSaveBag}
                  disabled={!canSaveBag}
                  className="saved-bags-save-btn"
                >
                  Save bag
                </Button>
              </div>
              {savedFeedback && <p className="saved-bags-feedback">{savedFeedback}</p>}
              {savedCarts.length === 0 ? (
                <p className="saved-bags-empty">You haven&apos;t saved a bag yet.</p>
              ) : (
                <ul className="saved-bags-list">
                  {savedCarts.map((saved) => {
                    const savedTotal = saved.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                    const isActive = saved.id === activeSavedCartId;
                    return (
                      <li key={saved.id} className={`saved-bag ${isActive ? "is-active" : ""}`}>
                        <div>
                          <p className="saved-bag-title">{saved.name}</p>
                          <p className="saved-bag-meta">
                            {saved.items.length} {saved.items.length === 1 ? "item" : "items"} ·{" "}
                            {savedTotal.toFixed(2)} EGP
                          </p>
                        </div>
                        <div className="saved-bag-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoadBag(saved.id, saved.name)}
                            disabled={isActive}
                          >
                            {isActive ? "Active" : "Load"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRenameBag(saved.id, saved.name)}>
                            Rename
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteBag(saved.id, saved.name)}>
                            Delete
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

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
