import { useEffect, useState } from "react";

export default function Navbar({
  onMenuToggle,
  onGetStarted = () => {},
  sticky = false,
  brand = "NaturaGloss",
  cartCount = 0,
}) {
  const [elevated, setElevated] = useState(false);

  useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setElevated(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  return (
    <header className={`navbar ${sticky ? "sticky" : ""} ${elevated ? "elevated" : ""}`}>
      <div className="nav-inner">
        <a className="brand" href="/">{brand}</a>
        <nav className="nav-links">
          <a href="#grid">Collection</a>
          <a href="#about">About</a>
          <a href="?view=cart">Cart ({cartCount})</a>
        </nav>
        <div className="nav-actions">
          <a className="ghost-btn nav-cart" href="?view=cart">
            Cart ({cartCount})
          </a>
          <button className="cta-btn" onClick={onGetStarted}>Get Started</button>
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
