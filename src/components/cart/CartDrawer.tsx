import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { FadeIn } from "@/components/animate";
import { useCart } from "@/cart/cartStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTranslation } from "@/localization/locale";
import { formatVariantMeta } from "@/utils/variantDisplay";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const {
    cartItems,
    subtotal,
    totalQuantity,
    updateQuantity,
    removeItem,
    savedCarts,
    activeSavedCartId,
    saveCurrentCart,
    loadSavedCart,
    deleteSavedCart,
  } = useCart();
  const [saveName, setSaveName] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const savedSummary = useMemo(
    () =>
      savedCarts.map((saved) => ({
        ...saved,
        itemCount: saved.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
    [savedCarts]
  );

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const canCheckout = totalQuantity > 0;
  const { t } = useTranslation();

  const renderVariantMeta = (
    label?: string,
    attributes?: Record<string, string>,
    className = "cart-drawer__variant"
  ) => {
    const variantMeta = formatVariantMeta(label, attributes);
    if (!variantMeta) return null;
    return <p className={className}>{variantMeta}</p>;
  };

  const goToCheckout = () => {
    if (!canCheckout) return;
    onClose();
    const base = import.meta.env.BASE_URL ?? "/";
    const url = new URL(base, window.location.origin);
    url.searchParams.set("view", "checkout");
    url.hash = "";
    window.location.href = url.toString();
  };

  const increment = (itemId: string, current: number) => {
    updateQuantity(itemId, current + 1);
  };

  const decrement = (itemId: string, current: number) => {
    if (current <= 1) {
      removeItem(itemId);
      return;
    }
    updateQuantity(itemId, current - 1);
  };

  const handleSaveCart = () => {
    if (!saveName.trim()) {
      setSaveMessage("Please provide a name for the routine.");
      return;
    }
    const success = saveCurrentCart(saveName);
    if (success) {
      setSaveMessage("Saved. Load it anytime.");
      setSaveName("");
    } else {
      setSaveMessage("Add products before saving.");
    }
  };

  return (
    <div className={`cart-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <div className="cart-drawer__backdrop" onClick={onClose} />
      <FadeIn>
        <aside className="cart-drawer__panel ng-mobile-shell">
          <header className="cart-drawer__header">
            <div>
              <p className="cart-drawer__eyebrow">NaturaGloss</p>
              <h2>Your bag</h2>
            </div>
            <button type="button" className="cart-drawer__close" aria-label="Close cart" onClick={onClose}>
              ×
            </button>
          </header>

          <div className="cart-drawer__content">
            {cartItems.length === 0 ? (
              <p className="cart-drawer__empty">Your bag is currently empty.</p>
            ) : (
              <ul className="cart-drawer__list">
                {cartItems.map((item) => (
                  <li key={item.id} className="cart-drawer__item">
                    <div>
                      <p className="cart-drawer__title">{item.name}</p>
                      {renderVariantMeta(item.variantLabel, item.variantAttributes)}
                      <p className="cart-drawer__meta">{formatCurrency(item.price)}</p>
                      {item.bundleId && (
                        <div className="cart-drawer__bundle-meta">
                          {item.bundleCompareAt && item.bundleCompareAt > item.price && (
                            <p className="cart-drawer__bundle-compare">
                              Regular {formatCurrency(item.bundleCompareAt)}
                            </p>
                          )}
                          {item.bundleSavings && item.bundleSavings > 0 && (
                            <p className="cart-drawer__bundle-savings">
                              You save {formatCurrency(item.bundleSavings)}
                              {item.bundleSavingsPercent ? ` (${item.bundleSavingsPercent}%)` : ""}
                            </p>
                          )}
                          {item.bundleItems && item.bundleItems.length > 0 && (
                            <ul className="cart-drawer__bundle-items">
                              {item.bundleItems.map((bundleItem) => (
                                <li key={`${item.bundleId}-${bundleItem.productId}`}>
                                  <span>
                                    {bundleItem.name} × {bundleItem.quantity}
                                  </span>
                                  {renderVariantMeta(
                                    bundleItem.variantLabel,
                                    bundleItem.variantAttributes,
                                    "cart-drawer__sub-variant"
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      {item.giftBox && (
                        <div className="cart-drawer__gift-meta">
                          <p className="cart-drawer__gift-label">Gift box · {item.giftBox.styleName}</p>
                          {item.giftBox.addons && item.giftBox.addons.length > 0 && (
                            <p className="cart-drawer__gift-addons">
                              Includes {item.giftBox.addons.join(", ")}
                            </p>
                          )}
                          {item.giftBox.note && (
                            <p className="cart-drawer__gift-note">“{item.giftBox.note}”</p>
                          )}
                          {item.giftBox.items && item.giftBox.items.length > 0 && (
                            <ul className="cart-drawer__gift-items">
                              {item.giftBox.items.map((giftItem) => (
                                <li key={`${item.id}-${giftItem.productId}`}>
                                  <span>{giftItem.name}</span>
                                  {renderVariantMeta(
                                    giftItem.variantLabel,
                                    giftItem.variantAttributes,
                                    "cart-drawer__sub-variant"
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="cart-drawer__controls">
                      <div className="cart-drawer__quantity">
                        <button type="button" onClick={() => decrement(item.id, item.quantity)} aria-label="Decrease quantity">
                          –
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => increment(item.id, item.quantity)} aria-label="Increase quantity">
                          +
                        </button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cart-drawer__remove"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <section className="cart-drawer__saved" data-animate="fade-in">
            <div className="cart-drawer__saved-header">
          <h3>Saved routines</h3>
              <p>Preserve your current bag to revisit later.</p>
            </div>
            <div className="cart-drawer__saved-input">
              <input
                type="text"
                placeholder="Name this routine"
                value={saveName}
                onChange={(event) => setSaveName(event.target.value)}
              />
              <Button variant="ghost" size="md" onClick={handleSaveCart}>
                Save
              </Button>
            </div>
            {saveMessage && <p className="cart-drawer__saved-message">{saveMessage}</p>}
            {savedSummary.length > 0 ? (
              <ul className="cart-drawer__saved-list">
                {savedSummary.map((saved) => (
                  <li key={saved.id} className="cart-drawer__saved-item">
                    <div>
                      <p className="cart-drawer__saved-title">{saved.name}</p>
                      <p className="cart-drawer__saved-meta">
                        {saved.itemCount} item{saved.itemCount === 1 ? "" : "s"} ·{" "}
                        {new Date(saved.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="cart-drawer__saved-actions">
                      <Button
                        variant={saved.id === activeSavedCartId ? "ghost" : "secondary"}
                        size="sm"
                        onClick={() => loadSavedCart(saved.id)}
                        disabled={saved.id === activeSavedCartId}
                      >
                        {saved.id === activeSavedCartId ? "Loaded" : "Load"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteSavedCart(saved.id)}>
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cart-drawer__saved-empty">You have no saved routines yet.</p>
            )}
          </section>

          <footer className="cart-drawer__footer" data-animate="fade-in">
            <div className="cart-drawer__subtotal">
              <span>Subtotal</span>
              <strong>{subtotal.toFixed(2)} EGP</strong>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="cart-drawer__checkout"
              onClick={goToCheckout}
              disabled={!canCheckout}
            >
              {t("cta.proceedToCheckout")}
            </Button>
          </footer>
        </aside>
      </FadeIn>
    </div>
  );
}
