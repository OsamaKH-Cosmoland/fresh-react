import { useEffect, useMemo, useState } from "react";
import { Button, Card, SectionTitle, InputField } from "../components/ui";
import OrderDetailDrawer from "../components/admin/OrderDetailDrawer";
import { exportOrdersToCsv } from "../utils/exportCsv";

type OrderStatus = "pending" | "confirmed" | "shipped" | "cancelled" | string;

export interface AdminOrder {
  id: string;
  orderCode?: string;
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
  totalAmount?: number;
  subtotal?: number;
  customerName?: string;
  customerPhone?: string;
  city?: string;
  items?: Array<{ name?: string; quantity?: number; price?: number }>;
  notes?: string;
}

interface AdminReview {
  id: string;
  name?: string;
  rating?: number;
  message?: string;
  createdAt?: string;
}

const STATUS_OPTIONS: OrderStatus[] = ["pending", "confirmed", "shipped", "cancelled"];

export default function AdminDashboard() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "last7" | "last30">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const res = await fetch("/api/orders?limit=100");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Failed to load orders (${res.status}).`);
        }
        const data = (await res.json()) as any[];
        if (cancelled) return;
        const mapped = data.map((order) => ({
          id: order.id ?? order.mongoId ?? order.orderCode ?? `${order._id ?? Date.now()}`,
          orderCode: order.orderCode,
          status: order.status ?? "pending",
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          subtotal: order.totals?.subtotal ?? order.subtotal,
          totalAmount:
            order.totals?.subtotal ?? order.totals?.total ?? order.total ?? order.subtotal ?? 0,
          customerName: order.customer?.name,
          customerPhone: order.customer?.phone,
          city: order.customer?.city,
          items: order.items ?? order.lineItems ?? [],
          notes: order.customer?.notes ?? order.notes ?? "",
        }));
        setOrders(mapped);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load orders:", error);
        setOrdersError((error as Error)?.message ?? "Unable to load orders.");
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };
    const loadReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);
      try {
        const res = await fetch("/api/reviews?limit=100");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Failed to load reviews (${res.status}).`);
        }
        const data = (await res.json()) as any[];
        if (cancelled) return;
        const mapped = data.map((review) => ({
          id: review.mongoId ?? review.id ?? `${review.name}-${review.createdAt}`,
          name: review.name,
          rating: Number(review.rating ?? 0),
          message: review.message,
          createdAt: review.createdAt,
        }));
        setReviews(mapped);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load reviews:", error);
        setReviewsError((error as Error)?.message ?? "Unable to load reviews.");
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };

    loadOrders();
    loadReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const startOfLast7 = startOfToday - 6 * 24 * 60 * 60 * 1000;
    const startOfLast30 = startOfToday - 29 * 24 * 60 * 60 * 1000;
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      const createdAt = order.createdAt ? new Date(order.createdAt).getTime() : null;
      if (dateFilter === "today" && (!createdAt || createdAt < startOfToday)) {
        return false;
      }
      if (dateFilter === "last7" && (!createdAt || createdAt < startOfLast7)) {
        return false;
      }
      if (dateFilter === "last30" && (!createdAt || createdAt < startOfLast30)) {
        return false;
    }

    if (query) {
      const haystack = [
        order.customerName,
        order.customerPhone,
        order.orderCode,
        order.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  }, [orders, statusFilter, dateFilter, searchQuery]);

  const handleExportCsv = () => {
    if (typeof window === "undefined" || filteredOrders.length === 0) return;
    const csv = exportOrdersToCsv(filteredOrders);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    anchor.href = url;
    anchor.download = `orders-${date}.csv`;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0);
    const todayOrders = orders.filter((order) => {
      if (!order.createdAt) return false;
      const createdDate = new Date(order.createdAt);
      return createdDate.toDateString() === new Date().toDateString();
    });
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0);
    return {
      totalOrders,
      totalRevenue,
      ordersToday: todayOrders.length,
      todayRevenue,
    };
  }, [orders]);
  }, [orders, statusFilter, dateFilter, searchQuery]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    if (!newStatus || !orderId) return;
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed to update (status ${response.status}).`);
      }
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
        );
        setSelectedOrder((prev) =>
          prev && prev.id === orderId ? { ...prev, status: newStatus } : prev
        );
    } catch (error) {
      console.error("Order status update failed:", error);
      setOrdersError((error as Error)?.message ?? "Unable to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="admin-dashboard" style={{ padding: 32, gap: 32 }}>
      <SectionTitle
        title="Admin Dashboard"
        subtitle="Monitor orders and reviews without touching the API layer."
        align="left"
      />

      <div className="admin-panels" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Card className="admin-orders-card">
          <div className="admin-orders-header">
            <div>
              <SectionTitle
                title="Orders"
                subtitle="Review and update recent NaturaGloss orders."
                align="left"
                className="mb-4"
              />
              <div className="admin-metrics-grid">
                <div className="metric-card">
                  <p>Total orders</p>
                  <strong>{metrics.totalOrders}</strong>
                </div>
                <div className="metric-card">
                  <p>Total revenue</p>
                  <strong>{metrics.totalRevenue} EGP</strong>
                </div>
                <div className="metric-card">
                  <p>Orders today</p>
                  <strong>{metrics.ordersToday}</strong>
                </div>
                <div className="metric-card">
                  <p>Today's revenue</p>
                  <strong>{metrics.todayRevenue} EGP</strong>
                </div>
              </div>
            </div>
            <div className="admin-filters">
              <div className="filter-group">
                <p>Status</p>
                <div className="filter-pills">
                  <Button
                    variant={statusFilter === "all" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    className="filter-pill"
                  >
                    All
                  </Button>
                  {STATUS_OPTIONS.map((value) => (
                    <Button
                      key={value}
                      variant={statusFilter === value ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setStatusFilter(value)}
                      className="filter-pill"
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <p>Date</p>
                <div className="filter-pills">
                  {[
                    ["all", "All time"],
                    ["today", "Today"],
                    ["last7", "Last 7 days"],
                    ["last30", "Last 30 days"],
                  ].map(([value, label]) => (
                    <Button
                      key={value}
                      variant={dateFilter === value ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setDateFilter(value as "all" | "today" | "last7" | "last30")}
                      className="filter-pill"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <InputField
                label="Search"
                placeholder="Search name, phone, order code..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                containerClassName="admin-search-field"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCsv}
                disabled={filteredOrders.length === 0}
                className="export-button"
              >
                Export CSV
              </Button>
            </div>
          </div>

          {ordersLoading ? (
            <p>Loading orders…</p>
          ) : ordersError ? (
            <p className="text-rose-600">{ordersError}</p>
          ) : (
            <div className="admin-orders-table" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                  <tr key={order.id} onClick={() => setSelectedOrder(order)}>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</td>
                      <td>{order.orderCode ?? order.id}</td>
                      <td>{order.customerName ?? "—"}</td>
                      <td>{order.customerPhone ?? "—"}</td>
                      <td>{order.city ?? "—"}</td>
                      <td>{order.totalAmount ? `${order.totalAmount} EGP` : "—"}</td>
                      <td>
                        <div className="order-status-cell">
                          <span className={`status-chip status-${order.status}`}>{order.status}</span>
                          <select
                            value={order.status}
                            onChange={(event) => handleStatusUpdate(order.id, event.target.value)}
                            disabled={updatingOrderId === order.id}
                          >
                            {[...STATUS_OPTIONS, order.status]
                              .filter((value, index, array) => array.indexOf(value) === index)
                              .map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, order.status)}
                          disabled={updatingOrderId === order.id}
                        >
                          {updatingOrderId === order.id ? "Updating…" : "Update"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}
      <OrderDetailDrawer
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusUpdate}
      />
        </Card>

        <Card className="admin-reviews-card">
          <SectionTitle
            title="Customer Reviews"
            subtitle="See what customers are saying about NaturaGloss."
            align="left"
            className="mb-4"
          />
          {reviewsLoading ? (
            <p>Loading reviews…</p>
          ) : reviewsError ? (
            <p className="text-rose-600">{reviewsError}</p>
          ) : (
            <div className="admin-reviews-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reviews.map((review) => (
                <Card key={review.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <strong>{review.name || "Anonymous"}</strong>
                    <span>
                      ⭐ {review.rating ?? 0} / 5 ·{" "}
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{review.message}</p>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
