import { useEffect, useState } from "react";

export default function Navbar({
  onMenuToggle,
  sticky = false,
  brand = "NaturaGloss",
  cartCount = 0,
}) {
  const [elevated, setElevated] = useState(false);
  const itemLabel = cartCount === 1 ? "item" : "items";

  useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setElevated(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  return (
    <header className={`navbar rise-once ${sticky ? "sticky" : ""} ${elevated ? "elevated" : ""}`}>
      <div className="nav-inner">
        <a className="brand" href="/">{brand}</a>
        <nav className="nav-links">
          <a className="nav-pill" href="#grid">Collection</a>
          <a className="nav-pill" href="#about">About</a>
        </nav>
        <div className="nav-actions">
          <a
            className="nav-cart"
            href="?view=cart"
            aria-label={`View cart (${cartCount} ${itemLabel})`}
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
            <span className="nav-cart__count">{cartCount}</span>
          </a>
          <button className="hamburger" aria-label="Open menu" onClick={onMenuToggle}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}
