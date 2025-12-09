import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { type CartItem, useCart } from "@/cart/cartStore";
import { PRODUCT_INDEX } from "../data/products";
import { ritualBundles } from "@/content/bundles";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTranslation } from "@/localization/locale";
import { trackEvent } from "@/analytics/events";
import { formatVariantMeta } from "@/utils/variantDisplay";

const parsePrice = (price: string | number) => {
  const number = parseFloat(String(price).replace(/[^\d.]/g, ""));
  return Number.isNaN(number) ? 0 : number;
};

export default function CartPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { cartItems, totalQuantity, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { t } = useTranslation();
  const totalItems = totalQuantity ?? cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const renderVariantDetail = (item: CartItem) => {
    const meta = formatVariantMeta(item.variantLabel, item.variantAttributes);
    if (!meta) return null;
    return <p className="cart-page__variant">{meta}</p>;
  };

  const goToCollection = () => {
    const base = import.meta.env.BASE_URL ?? "/";
    window.location.href = base;
  };

  const goToCheckout = () => {
    const base = import.meta.env.BASE_URL ?? "/";
    const checkoutUrl = new URL(base, window.location.origin);
    checkoutUrl.searchParams.set("view", "checkout");
    checkoutUrl.hash = "";
    trackEvent({
      type: "start_checkout",
      subtotal,
      itemCount: totalItems,
    });
    window.location.href = checkoutUrl.toString();
  };

  const incrementItem = (itemId: string) => {
    const item = cartItems.find((entry) => entry.id === itemId);
    if (!item) return;
    updateQuantity(itemId, item.quantity + 1);
  };

  const decrementItem = (itemId: string) => {
    const item = cartItems.find((entry) => entry.id === itemId);
    if (!item) return;
    updateQuantity(itemId, item.quantity - 1);
  };

  const trackRemovalEvent = (item: CartItem) => {
    trackEvent({
      type: "remove_from_cart",
      itemType: item.giftBox ? "gift" : item.bundleId ? "bundle" : "product",
      id: item.bundleId ?? item.productId ?? item.id,
      quantity: item.quantity,
      variantId: item.variantId,
    });
  };

  const handleRemoveItem = (item: CartItem) => {
    trackRemovalEvent(item);
    removeItem(item.id);
  };

  return (
    <div className="cart-page">
      <Navbar
        sticky={false}
        onMenuToggle={() => setDrawerOpen(true)}
        cartCount={totalItems}
      />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="cart-shell ng-mobile-shell">
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
                  if (item.giftBox) {
                    return (
                      <li key={item.id} className="cart-page-item cart-page-gift">
                        <div className="cart-page-info">
                          <h3>Gift · {item.giftBox.styleName}</h3>
                          {renderVariantDetail(item)}
                          <span className="cart-page-price">{formatCurrency(item.price)}</span>
                          {item.giftBox.note && (
                            <p className="cart-page-bundle-note">“{item.giftBox.note}”</p>
                          )}
                          {item.giftBox.addons && item.giftBox.addons.length > 0 && (
                            <p className="cart-page-bundle-note">
                              Extras: {item.giftBox.addons.join(", ")}
                            </p>
                          )}
                          {item.giftBox.items && item.giftBox.items.length > 0 && (
                            <ul className="cart-page-bundle-items">
                              {item.giftBox.items.map((giftItem) => {
                                const giftVariant = formatVariantMeta(
                                  giftItem.variantLabel,
                                  giftItem.variantAttributes
                                );
                                return (
                                  <li key={`${item.id}-${giftItem.productId}`}>
                                    {giftItem.name}
                                    {giftVariant && (
                                      <p className="cart-page__sub-variant">{giftVariant}</p>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                        <div className="cart-page-actions">
                          <div className="cart-qty-controls" aria-label={`Quantity of gift ${item.giftBox.styleName}`}>
                            <button type="button" onClick={() => decrementItem(item.id)} aria-label="Remove one gift">
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => incrementItem(item.id)} aria-label="Add one gift">
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => handleRemoveItem(item)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    );
                  }

                  if (item.bundleId) {
                    const bundle = ritualBundles.find((entry) => entry.id === item.bundleId);
                    if (!bundle) return null;
                    return (
                      <li key={item.id} className="cart-page-item">
                        <div className="cart-page-info">
                          <h3>{bundle.name}</h3>
                          {renderVariantDetail(item)}
                          <p>{bundle.tagline}</p>
                          <span className="cart-page-price">{formatCurrency(item.price)}</span>
                          {item.bundleSavings && item.bundleSavings > 0 && (
                            <p className="cart-page-bundle-note">
                              You save {formatCurrency(item.bundleSavings)}
                            </p>
                          )}
                          {item.bundleItems && item.bundleItems.length > 0 && (
                            <ul className="cart-page-bundle-items">
                              {item.bundleItems.map((bundleItem) => {
                                const bundleVariant = formatVariantMeta(
                                  bundleItem.variantLabel,
                                  bundleItem.variantAttributes
                                );
                                return (
                                  <li key={`${item.bundleId}-${bundleItem.productId}`}>
                                    {bundleItem.name} × {bundleItem.quantity}
                                    {bundleVariant && (
                                      <p className="cart-page__sub-variant">{bundleVariant}</p>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                        <div className="cart-page-actions">
                          <div className="cart-qty-controls" aria-label={`Quantity of ${bundle.name}`}>
                            <button type="button" onClick={() => decrementItem(item.id)} aria-label={`Remove one ${bundle.name}`}>
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => incrementItem(item.id)} aria-label={`Add one ${bundle.name}`}>
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => handleRemoveItem(item)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    );
                  }

                  const product = PRODUCT_INDEX[item.id];
                  if (!product) return null;
                  return (
                    <li key={item.id} className="cart-page-item">
                      <div className="cart-page-info">
                        <h3>{product.title}</h3>
                        {renderVariantDetail(item)}
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
                          onClick={() => handleRemoveItem(item)}
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
                {t("cta.backToShop")}
              </button>
              <button type="button" className="ghost-btn" onClick={clearCart}>
                {t("cta.clearBag")}
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
                {t("cta.proceedToCheckout")}
              </button>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
