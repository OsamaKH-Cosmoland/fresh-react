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

export default function CardGrid() {
  const initial = [
    { id: 1, title: "Apple", desc: "Short description" },
    { id: 2, title: "Banana", desc: "Short description" },
    { id: 3, title: "Pineapple", desc: "Short description" },
    { id: 4, title: "Peach", desc: "Short description" },
    { id: 5, title: "Berries", desc: "Short description" },
    { id: 6, title: "Mango", desc: "Short description"}
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
            <p> {c.desc} </p>
            <button className="primary-btn">Open</button>
          </article>
        );
      })}
    </section>
  );
}
