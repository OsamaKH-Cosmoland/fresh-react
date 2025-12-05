import { useEffect, useMemo, useState } from "react";
import LayoutLab from "./labs/LayoutLab";
import RitualPlanner from "./pages/RitualPlanner";
import RitualFinder from "./pages/RitualFinder";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersAdmin from "./pages/OrdersAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import { apiGet, apiPost, apiDelete, apiPut } from "./lib/api";
import type { Product } from "./types/product";

const SHOW_LAB = true;

const PRESET_PRODUCTS = [
  { name: "Hydra Serum", price: 45 },
  { name: "Glow Cream", price: 32 },
  { name: "Velvet Cleanser", price: 28 },
  { name: "Silk Toner", price: 22 },
  { name: "Botanical Mist", price: 18 },
];

function ProductShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"none" | "asc" | "desc">("none");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = (await res.json()) as Product[];
        setProducts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function addProduct() {
    const n = Number(price);
    const clean = name.trim();
    if (!clean || Number.isNaN(n) || n < 0) return;

    const res = await apiPost("/products", { name: clean, price: n });
    if (!res.ok) {
      console.error("Failed to create product");
      return;
    }
    const created = (await res.json()) as Product;
    setProducts((prev) => [created, ...prev]);
    setName("");
    setPrice("");
  }

  async function deleteProduct(id: string) {
    const res = await apiDelete(`/products?id=${encodeURIComponent(id)}`);
    if (!res.ok) {
      console.error("Failed to delete product");
      return;
    }
    setProducts((prev) => prev.filter((f) => f._id !== id));
  }

  async function updateProduct(id: string, currentName: string, currentPrice: number) {
    const newName = prompt("Enter New Name:", currentName);
    const newPrice = prompt("Enter New Price:", String(currentPrice));
    const parsedPrice = newPrice ? Number(newPrice) : NaN;
    if (!newName || Number.isNaN(parsedPrice)) return;

    const res = await apiPut(`/products?id=${encodeURIComponent(id)}`, {
      name: newName,
      price: parsedPrice,
    });
    if (!res.ok) {
      alert("Failed to update product");
      return;
    }
    const updated = (await res.json()) as Product;
    setProducts((prev) => prev.map((f) => (f._id === id ? updated : f)));
  }

  const filtered = useMemo(() => {
    const n = Number(minPrice || 0);
    const q = query.trim().toLowerCase();
    return products.filter(
      (item) => item.price >= n && (q === "" || item.name.toLowerCase().includes(q))
    );
  }, [products, minPrice, query]);

  const sorted = useMemo(() => {
    if (sortBy === "asc") return [...filtered].sort((a, b) => a.price - b.price);
    if (sortBy === "desc") return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [filtered, sortBy]);

  const total = useMemo(() => sorted.reduce((sum, item) => sum + item.price, 0), [sorted]);
  const canAdd = name.trim() && !Number.isNaN(Number(price)) && Number(price) >= 0;

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <h1>Product Lab</h1>

      <fieldset style={{ marginBottom: 16 }}>
        <legend>Add Product</legend>
        <input placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button onClick={addProduct} disabled={!canAdd}>
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
                <button onClick={() => deleteProduct(item._id)}>Delete</button>
                <button onClick={() => updateProduct(item._id, item.name, item.price)}>Edit</button>
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

  return SHOW_LAB ? <LayoutLab /> : <ProductShop />;
}
