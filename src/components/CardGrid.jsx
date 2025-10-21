import { useState } from "react";

function Heart({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12.1 21.35l-1.1-.99C5.14 15.36 2 12.5 2 8.99 2 6.24 4.24 4 6.99 4c1.7 0 3.34.79 4.41 2.05A5.79 5.79 0 0 1 15.81 4C18.56 4 20.8 6.24 20.8 8.99c0 3.51-3.14 6.37-8.99 11.37l-.71.64z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5" 
      />
  
    </svg>
  )
}

export default function CardGrid({
  onAddToCart = () => {},
  onRemoveFromCart = () => {},
  cartQuantities = {},
}) {
  const initial = [
    { id: 1, title: "Silk Blossom Body Soap", desc: "Infused with jasmine petals for a velvety cleanse and lingering floral aura.", price: "$18.00" },
    { id: 2, title: "Calm & Glow Body Soap", desc: "Soothing chamomile and neroli calm the skin while mica pearls add a soft glow.", price: "$22.00" },
    { id: 3, title: "Body Balm", desc: "A concentrated butter blend that melts on contact to replenish deep hydration.", price: "$34.00" },
    { id: 4, title: "Hand Balm", desc: "Fast-absorbing restorative balm that cushions hands with botanical ceramides.", price: "$16.00" },
    { id: 5, title: "Hair Growth Oil", desc: "Lightweight elixir powered by rosemary stem cells and biotin to fortify roots.", price: "$42.00" },
    { id: 6, title: "Hair Shine & Anti-Frizz Oil", desc: "Silica-rich formula that seals cuticles for mirror-like gloss without weight.", price: "$38.00" }
  ];

  const [favs, setFavs] = useState(() => new Set());
  const toggleFav = (id) => {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFavKey = (e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFav(id);
    }
  };

  return (
    <section id="grid" className="card-grid">
      {initial.map((c) => {
        const isFav = favs.has(c.id);
        const quantityInCart = cartQuantities[c.id] ?? 0;
        return (
          <article
          key={c.id}
          className={`card ${isFav ? "is-fav" : ""}`}
          tabIndex="0"
          >
            <header className="card-head">
              <h3> {c.title} </h3>
              <button
              className="icon-btn"
              aria-pressed={isFav}
              aria-label={isFav ? "Unfavorite" : "Favorite"} 
              onClick={() => toggleFav(c.id)}
              onKeyDown={(e) => handleFavKey(e, c.id)}
              >
                <Heart filled={isFav} />
              </button>
            </header>
            <p className="card-desc">{c.desc}</p>
            <p className="card-price">{c.price}</p>
            <div className="card-actions">
              <button
                className="primary-btn"
                type="button"
                onClick={() => onAddToCart(c)}
              >
                Add to cart
              </button>
              <button
                className="remove-btn"
                type="button"
                onClick={() => onRemoveFromCart(c)}
                disabled={quantityInCart === 0}
              >
                Remove item
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
