import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { apiGet } from "../lib/api";
import type { Order } from "../types/order";

const formatDate = (isoString?: string | number | Date) => {
  if (isoString === undefined || isoString === null) return "—";
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return String(isoString ?? "—");
  }
};

export default function OrdersAdmin() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet("/orders");
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? `Unable to load orders (${response.status}).`);
      }
      const data = (await response.json()) as Order[];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      setError((err as Error).message ?? "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const totalCashValue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order?.totals?.subtotal ?? 0), 0),
    [orders]
  );

  return (
    <div className="orders-page">
      <Navbar
        sticky={false}
        onMenuToggle={() => setDrawerOpen(true)}
        menuOpen={drawerOpen}
        cartCount={0}
      />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main id="main-content" tabIndex={-1} className="orders-shell">
        <header className="orders-hero">
          <h1>Cash Orders Inbox</h1>
          <p>Review every cash-on-delivery submission and coordinate fulfilment.</p>
          <div className="orders-meta">
            <span>{orders.length} orders</span>
            <span>{totalCashValue.toFixed(2)} EGP</span>
            <button type="button" className="ghost-btn" onClick={loadOrders} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          {error && <p className="orders-status orders-status--error">{error}</p>}
        </header>

        {loading ? (
          <p className="orders-status">Loading orders…</p>
        ) : (
          <section className="orders-list" aria-live="polite">
            {orders.length === 0 ? (
              <p>No orders yet. New cash submissions will appear here automatically.</p>
            ) : (
              orders.map((order) => (
                <article key={order.id ?? order.mongoId} className="orders-card">
                  <header>
                    <h2>{order.id}</h2>
                    <span className="orders-chip">{order.status ?? "pending"}</span>
                  </header>
                  <dl>
                    <div>
                      <dt>Placed</dt>
                      <dd>{formatDate(order.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Customer</dt>
                      <dd>
                        <strong>{order.customer?.name}</strong>
                        <span>{order.customer?.phone}</span>
                        <span>{order.customer?.city}</span>
                        <span>{order.customer?.address}</span>
                      </dd>
                    </div>
                    <div>
                      <dt>Items</dt>
                      <dd>
                        <ul>
                          {order.items?.map((item) => (
                            <li key={`${order.id}-${item.id}`}>
                              <span>{item.title}</span>
                              <span>
                                {item.unitPrice} × {item.quantity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{Number(order.totals?.subtotal ?? 0).toFixed(2)} EGP</dd>
                    </div>
                    {order.customer?.notes && (
                      <div>
                        <dt>Notes</dt>
                        <dd>{order.customer.notes}</dd>
                      </div>
                    )}
                  </dl>
                </article>
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}
