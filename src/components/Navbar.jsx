import { useEffect, useState } from "react";

export default function Navbar({
  onMenuToggle,
  sticky = false,
  brand = "LayoutLab",
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
        <div className="debug-box"></div>

        {/* Desktop nav */}
        <nav className="nav-links">
          <a href="#grid">Grid</a>
          <a href="#forms">Forms</a>
          <a href="#about">About</a>
        </nav>

        {/* Right actions */}
        <div className="nav-actions">
          <button className="ghost-btn">Sign in</button>
          <button className="cta-btn">Get Started</button>
          <button className="hamburger" aria-label="Open menu" onClick={onMenuToggle}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
