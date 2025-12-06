import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { FadeIn } from "@/components/animate";
import { useCart } from "@/cart/cartStore";

interface NavbarProps {
  onMenuToggle: () => void;
  sticky?: boolean;
  brand?: string;
  cartCount?: number;
  showSectionLinks?: boolean;
}

export default function Navbar({
  onMenuToggle,
  sticky = false,
  brand = "NaturaGloss",
  cartCount = 0,
  showSectionLinks = true,
}: NavbarProps) {
  const [elevated, setElevated] = useState(false);
  const { totalQuantity } = useCart();
  const displayCount = totalQuantity ?? cartCount;
  const itemLabel = displayCount === 1 ? "item" : "items";
  const buildSectionHref = (hash: string) => {
    const base = import.meta.env.BASE_URL || "/";
    const normalized = base.endsWith("/") ? base : `${base}/`;
    const target = String(hash).replace(/^#/, "");
    return `${normalized}#${target}`;
  };

  useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setElevated(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  const navActions = (
    <div className="nav-actions">
      <Button
        variant="secondary"
        className="nav-cart"
        size="md"
        onClick={() => {
          const base = import.meta.env.BASE_URL ?? "/";
          const location = `${base}?view=cart`;
          window.location.href = location;
        }}
        aria-label={`View cart (${displayCount} ${itemLabel})`}
      >
        <span className="nav-cart__glow" aria-hidden="true" />
        <span className="nav-cart__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path
              d="M4 5h2l1.6 8.4c.1.6.7 1.1 1.3 1.1h7.5c.6 0 1.2-.5 1.3-1.1L19 8H7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="19" r="1.3" />
            <circle cx="17" cy="19" r="1.3" />
          </svg>
        </span>
        <span className="nav-cart__label">Cart</span>
        <span className="nav-cart__count">{displayCount}</span>
      </Button>
      <button className="hamburger" aria-label="Open menu" onClick={onMenuToggle}>
        <span />
        <span />
        <span />
      </button>
    </div>
  );

  return (
    <header className={`navbar rise-once ${sticky ? "sticky" : ""} ${elevated ? "elevated" : ""}`}>
      <div className="nav-inner">
        <FadeIn>
          <a className="brand" href="/">
            {brand}
          </a>
        </FadeIn>
        {showSectionLinks ? (
          <FadeIn>
            <div className="nav-main">
              <div className="nav-links-row">
                <nav className="nav-links">
                  <a className="nav-pill" href={buildSectionHref("grid")}>
                    Collection
                  </a>
                  <a className="nav-pill" href="?view=ritualfinder">
                    Find My Product
                  </a>
                  <a className="nav-pill" href="/stories">
                    Our Journal
                  </a>
                </nav>
              </div>
              {navActions}
            </div>
          </FadeIn>
        ) : (
          navActions
        )}
      </div>
    </header>
  );
}
