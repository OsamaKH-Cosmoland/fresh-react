import { useEffect, useMemo, useState } from "react";
import LayoutLab from "./labs/LayoutLab";
import RitualPlanner from "./pages/RitualPlanner";
import RitualFinder from "./pages/RitualFinder";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersAdmin from "./pages/OrdersAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import { apiGet, apiPost, apiDelete, apiPut } from "./lib/api";
import type { Fruit } from "./types/fruit";

const SHOW_LAB = true;

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
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"none" | "asc" | "desc">("none");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/fruits");
        if (!res.ok) throw new Error("Failed to fetch fruits");
        const data = (await res.json()) as Fruit[];
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

    const res = await apiPost("/fruits", { name: clean, price: n });
    if (!res.ok) {
      console.error("Failed to create fruit");
      return;
    }
    const created = (await res.json()) as Fruit;
    setFruits((prev) => [created, ...prev]);
    setName("");
    setPrice("");
  }

  async function deleteFruit(id: string) {
    const res = await apiDelete(`/fruits?id=${encodeURIComponent(id)}`);
    if (!res.ok) {
      console.error("Failed to delete fruit");
      return;
    }
    setFruits((prev) => prev.filter((f) => f._id !== id));
  }

  async function updateFruit(id: string, currentName: string, currentPrice: number) {
    const newName = prompt("Enter New Name:", currentName);
    const newPrice = prompt("Enter New Price:", String(currentPrice));
    const parsedPrice = newPrice ? Number(newPrice) : NaN;
    if (!newName || Number.isNaN(parsedPrice)) return;

    const res = await apiPut(`/fruits?id=${encodeURIComponent(id)}`, {
      name: newName,
      price: parsedPrice,
    });
    if (!res.ok) {
      alert("Failed to update fruit");
      return;
    }
    const updated = (await res.json()) as Fruit;
    setFruits((prev) => prev.map((f) => (f._id === id ? updated : f)));
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
        <input placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
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
            onChange={(e) => setMinPrice(Number(e.target.value))}
          />
        </label>

        <label>
          Search By Name:{" "}
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Apple, Banana..." />
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

export default function App() {
  const view =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("view")
      : null;
  const path =
    typeof window !== "undefined"
      ? window.location.pathname.replace(/\/+$/, "") || "/"
      : "/";

  if (view === "cart" || path === "/cart") return <CartPage />;
  if (view === "checkout" || path === "/checkout") return <CheckoutPage />;
  if (view === "admin" || path === "/admin") return <AdminDashboard />;
  if (view === "orders" || path === "/orders") return <OrdersAdmin />;
  if (view === "ritualplanner" || path === "/rituals") return <RitualPlanner />;
  if (view === "ritualfinder" || path === "/ritual-finder") return <RitualFinder />;

  return SHOW_LAB ? <LayoutLab /> : <FruitShop />;
}
