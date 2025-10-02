import { useMemo, useState } from "react";

const initial = [
  { id: 1, name: "Apple",  price: 12 },
  { id: 2, name: "Banana", price: 8  },
  { id: 3, name: "Cherry", price: 15 },
  { id: 4, name: "dates",  price: 5.5},
];

export default function App() {
  const [minPrice, setMinPrice] = useState(0);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("none"); // 'asc' | 'desc' | 'none'

  const filtered = useMemo(() => {
    const n = Number(minPrice || 0);
    const q = query.trim().toLowerCase();
    return initial.filter(
      (item) => item.price >= n && (q === "" || item.name.toLowerCase().includes(q))
    );
  }, [minPrice, query]);

  const sorted = useMemo(() => {
    if (sortBy === "asc")  return [...filtered].sort((a, b) => a.price - b.price);
    if (sortBy === "desc") return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [filtered, sortBy]);

  const total = useMemo(() => sorted.reduce((s, i) => s + i.price, 0), [sorted]);

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <h1>Fruit Shop</h1>

      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <label>
          Min price:{" "}
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="0"
          />
        </label>

        <label>
          Search by name:{" "}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Apple, Banana…"
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setSortBy("asc")}>Price ↑</button>
          <button onClick={() => setSortBy("desc")}>Price ↓</button>
          <button onClick={() => setSortBy("none")}>Clear sort</button>
        </div>
      </div>

      <ul>
        {sorted.map((item) => (
          <li key={item.id}>
            {item.name} — ${item.price}
          </li>
        ))}
      </ul>

      <p><b>Total:</b> ${total}</p>
    </main>
  );
}
