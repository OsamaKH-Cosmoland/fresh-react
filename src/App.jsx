import { useEffect, useMemo, useState } from "react";
import LayoutLab from "./labs/LayoutLab.jsx"; // ✅ added
import RitualPlanner from "./pages/RitualPlanner.jsx";

const SHOW_LAB = true; // ✅ toggle between lab & fruit shop

const PRESET_FRUITS = [
  { name: "Apple", price: 12 },
  { name: "Banana", price: 8 },
  { name: "Cherry", price: 15 },
  { name: "Grapes", price: 18 },
  { name: "Mango", price: 20 },
  { name: "Orange", price: 10 },
  { name: "Peach", price: 14 },
  { name: "Pear", price: 11 },
  { name: "Plum", price: 9 },
  { name: "Kiwi", price: 13 },
];

function FruitShop() {
  const [fruits, setFruits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState(0);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("none"); // 'asc' | 'desc' | 'none'
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/fruits");
        if (!res.ok) throw new Error("Failed to fetch fruits");
        const data = await res.json();
        setFruits(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function addFruit() {
    const n = Number(price);
    const clean = name.trim();
    if (!clean || Number.isNaN(n) || n < 0) return;

    const res = await fetch("/api/fruits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clean, price: n }),
    });

    if (!res.ok) {
      console.error("Failed to create fruit");
      return;
    }

    const created = await res.json();
    setFruits((prev) => [created, ...prev]);
    setName("");
    setPrice("");
  }

  async function deleteFruit(id) {
    const res = await fetch(`/api/fruits?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      console.error("Failed to delete fruit");
      return;
    }
    setFruits((prev) => prev.filter((f) => f._id !== id));
  }

  async function updateFruit(id, name, price) {
    const newName = prompt("Enter New Name:", name);
    const newPrice = prompt("Enter New Price:", price);
    if (!newName || !newPrice) return;

    const res = await fetch(`/api/fruits.js?id${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, price: Number(newPrice) }),
    });

    if (!res.ok) {
      alert("Failed to update fruit");
      return;
    }

    const updated = await res.json();
    setFruits((prev) => prev.map((f) => (f.id === id ? updated : f)));
  }

  const filtered = useMemo(() => {
    const n = Number(minPrice || 0);
    const q = query.trim().toLowerCase();
    return fruits.filter(
      (item) => item.price >= n && (q === "" || item.name.toLowerCase().includes(q))
    );
  }, [fruits, minPrice, query]);

  const sorted = useMemo(() => {
    if (sortBy === "asc") return [...filtered].sort((a, b) => a.price - b.price);
    if (sortBy === "desc") return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [filtered, sortBy]);

  const total = useMemo(() => sorted.reduce((sum, item) => sum + item.price, 0), [sorted]);

  const canAdd = name.trim() && !Number.isNaN(Number(price)) && Number(price) >= 0;

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <h1>Fruit Shop</h1>

      <fieldset style={{ marginBottom: 16 }}>
        <legend>Add Fruit</legend>
        <input
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button onClick={addFruit} disabled={!canAdd}>
          Add
        </button>
      </fieldset>

      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <label>
          Min Price:{" "}
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </label>

        <label>
          Search By Name:{" "}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Apple, Banana..."
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setSortBy("asc")}>Price ↑</button>
          <button onClick={() => setSortBy("desc")}>Price ↓</button>
          <button onClick={() => setSortBy("none")}>Clear Sort</button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <ul>
            {sorted.map((item) => (
              <li key={item._id}>
                {item.name} — ${item.price}{" "}
                <button onClick={() => deleteFruit(item._id)}>Delete</button>
                <button onClick={() => updateFruit(item._id, item.name, item.price)}>Edit</button>
              </li>
            ))}
          </ul>
          <p>
            <b>Total:</b> ${total}
          </p>
        </>
      )}
    </main>
  );
}

// ✅ Export logic — toggles between your two apps
export default function App() {
  const path =
    typeof window !== "undefined"
      ? window.location.pathname.replace(/\/+$/, "") || "/"
      : "/";

  if (path === "/rituals") {
    return <RitualPlanner />;
  }

  return SHOW_LAB ? <LayoutLab /> : <FruitShop />;
}
