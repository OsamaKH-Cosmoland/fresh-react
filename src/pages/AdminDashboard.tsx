import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { apiGet, API_BASE } from "../lib/api";
import type { Order } from "../types/order";

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP" }).format(Number(value ?? 0));

const formatTimestamp = (value: string | number | Date | null | undefined): string => {
  if (!value) return "—";
  try { return new Date(value).toLocaleString(); } catch { return String(value); }
};

const getOrderKey = (order: Order) =>
  order?.id ??
  order?.mongoId ??
  order?.orderCode ??
  `${order?.customer?.phone ?? "guest"}-${order?.createdAt ?? order?.totals?.subtotal ?? ""}`;

const NOTIFY_STORAGE_KEY = "admin-notifications";

type Toast = { id: string; message: string };

export default function AdminDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(NOTIFY_STORAGE_KEY) === "true";
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [highlighted, setHighlighted] = useState<Record<string, boolean>>({});

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const streamRef = useRef<EventSource | null>(null);
  const notificationSupported = typeof window !== "undefined" && "Notification" in window;

  const ordersEndpoint = `${API_BASE}/orders?limit=100`;
  const streamEndpoint = `${API_BASE}/orders/stream`;

  const pushToast = useCallback((message: string) => {
    const toastId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id: toastId, message }]);
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 5000);
    timersRef.current.push(timeout);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet("/orders?limit=100");
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
  }, []);

  const highlightOrder = useCallback((orderKey: string) => {
    setHighlighted((prev) => ({ ...prev, [orderKey]: true }));
    const timeout = setTimeout(() => {
      setHighlighted((prev) => {
        const next = { ...prev };
        delete next[orderKey];
        return next;
      });
    }, 4000);
    timersRef.current.push(timeout);
  }, []);

  const handleNewOrder = useCallback(
    (incoming: Order | null) => {
      if (!incoming) return;
      const orderKey = getOrderKey(incoming);

      setOrders((prev) => {
        const existingIndex = prev.findIndex(
          (entry) => getOrderKey(entry) === orderKey || entry.id === incoming.id
        );
        const next = existingIndex >= 0 ? [...prev] : [incoming, ...prev];
        if (existingIndex >= 0) {
          next.splice(existingIndex, 1);
          next.unshift(incoming);
        }
        return next.slice(0, 100);
      });

      highlightOrder(orderKey);
      pushToast(`New order ${incoming.orderCode ?? incoming.id} from ${incoming.customer?.name ?? "Unknown"}`);

      if (
        notificationsEnabled &&
        notificationSupported &&
        window.Notification.permission === "granted"
      ) {
        try {
          const notificationBody = [
            incoming.customer?.email,
            incoming.customer?.phone,
            `${formatCurrency(incoming?.totals?.subtotal)} | ${incoming.customer?.city ?? ""}`,
          ].filter(Boolean).join(" · ");
          new Notification(`New order ${incoming.orderCode ?? incoming.id}`, { body: notificationBody });
        } catch (notifyError) {
          console.error("Unable to show desktop notification", notifyError);
        }
      }
    },
    [highlightOrder, notificationSupported, notificationsEnabled, pushToast]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (streamRef.current) streamRef.current.close();
    const source = new EventSource(streamEndpoint);
    streamRef.current = source;

    source.addEventListener("new-order", (event) => {
      try {
        const parsed = JSON.parse(event.data) as Order;
        handleNewOrder(parsed);
      } catch (err) {
        console.error("Failed to parse new-order event", err);
      }
    });

    source.onerror = (event) => {
      console.error("Orders event stream error:", event);
    };

    return () => {
      source.close();
      streamRef.current = null;
    };
  }, [handleNewOrder, streamEndpoint]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  const totalValue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order?.totals?.subtotal ?? 0), 0),
    [orders]
  );

  const toggleNotifications = async () => {
    if (!notificationSupported) {
      pushToast("Desktop notifications are not supported in this browser.");
      return;
    }

    if (!notificationsEnabled) {
      const permission =
        window.Notification.permission === "default"
          ? await window.Notification.requestPermission()
          : window.Notification.permission;
      if (permission === "granted") {
        setNotificationsEnabled(true);
        window.localStorage.setItem(NOTIFY_STORAGE_KEY, "true");
        pushToast("Desktop notifications enabled.");
      } else {
        setNotificationsEnabled(false);
        window.localStorage.setItem(NOTIFY_STORAGE_KEY, "false");
        pushToast("Desktop notifications blocked.");
      }
    } else {
      setNotificationsEnabled(false);
      window.localStorage.setItem(NOTIFY_STORAGE_KEY, "false");
      pushToast("Desktop notifications disabled.");
    }
  };

  return (
    <div className="admin-dashboard">
      <Navbar sticky={false} onMenuToggle={() => setDrawerOpen(true)} cartCount={0} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="admin-container" aria-live="polite">
        <header className="admin-header">
          <div>
            <h1>Order Control Center</h1>
            <p>Monitor cash-on-delivery orders in real time.</p>
          </div>
          <div className="admin-actions">
            <button type="button" className="admin-button" onClick={fetchOrders} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button
              type="button"
              className={`admin-button ${notificationsEnabled ? "admin-button--active" : ""}`}
              onClick={toggleNotifications}
            >
              {notificationsEnabled ? "Disable Notifications" : "Enable Notifications"}
            </button>
          </div>
        </header>

        {error && <p className="admin-status admin-status--error">{error}</p>}

        <section className="admin-summary">
          <div>
            <span className="admin-summary__label">Orders</span>
            <span className="admin-summary__value">{orders.length}</span>
          </div>
          <div>
            <span className="admin-summary__label">Cash Value</span>
            <span className="admin-summary__value">{formatCurrency(totalValue)}</span>
          </div>
          <div>
            <span className="admin-summary__label">Notifications</span>
            <span className="admin-summary__value">
              {notificationSupported ? (notificationsEnabled ? "Enabled" : "Disabled") : "Unsupported"}
            </span>
          </div>
        </section>

        <div className="admin-table-container">
          {loading ? (
            <p className="admin-status">Loading orders…</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-empty">
                      No orders yet. Fresh submissions will appear here instantly.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const orderKey = getOrderKey(order);
                    const isHighlighted = highlighted[orderKey];
                    return (
                      <tr key={orderKey} className={isHighlighted ? "admin-row--new" : ""}>
                        <td className="font-semibold">{order.orderCode ?? order.id}</td>
                        <td>
                          <div className="admin-customer">
                            <span>{order.customer?.name ?? "—"}</span>
                            {order.customer?.city && <span className="admin-customer__muted">{order.customer.city}</span>}
                            {order.customer?.address && (
                              <span className="admin-customer__muted">{order.customer.address}</span>
                            )}
                          </div>
                        </td>
                        <td>{order.customer?.email ?? "—"}</td>
                        <td>{order.customer?.phone ?? "—"}</td>
                        <td>{formatCurrency(order?.totals?.subtotal)}</td>
                        <td>{formatTimestamp(order.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <div className="admin-toast-stack" aria-live="assertive" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className="admin-toast">
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
