import { useEffect } from "react";
import { Button } from "@/components/ui";
import { FadeIn } from "@/components/animate";
import { useCart } from "@/cart/cartStore";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cartItems, subtotal, totalQuantity, updateQuantity, removeItem } = useCart();

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

  return (
    <div className={`cart-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <div className="cart-drawer__backdrop" onClick={onClose} />
      <FadeIn>
        <aside className="cart-drawer__panel">
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
                      <p className="cart-drawer__meta">{item.price.toFixed(2)} EGP</p>
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

          <footer className="cart-drawer__footer" data-animate="fade-in">
            <div className="cart-drawer__subtotal">
              <span>Subtotal</span>
              <strong>{subtotal.toFixed(2)} EGP</strong>
            </div>
            <Button variant="primary" size="lg" className="cart-drawer__checkout" onClick={goToCheckout} disabled={!canCheckout}>
              Go to checkout
            </Button>
          </footer>
        </aside>
      </FadeIn>
    </div>
  );
}
