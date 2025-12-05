import { useEffect, useMemo, useState } from "react";
import { Button, Card, SectionTitle } from "../components/ui";

type OrderStatus = "pending" | "confirmed" | "shipped" | "cancelled" | string;

interface AdminOrder {
  id: string;
  orderCode?: string;
  status: OrderStatus;
  createdAt?: string;
  totalAmount?: number;
  customerName?: string;
  customerPhone?: string;
  city?: string;
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
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

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
          totalAmount:
            order.totals?.subtotal ?? order.totals?.total ?? order.total ?? order.subtotal ?? 0,
          customerName: order.customer?.name,
          customerPhone: order.customer?.phone,
          city: order.customer?.city,
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

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => statusFilter === "all" || order.status === statusFilter),
    [orders, statusFilter]
  );

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
    } catch (error) {
      console.error("Order status update failed:", error);
      setOrdersError((error as Error)?.message ?? "Unable to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <main className="admin-dashboard" style={{ padding: 32, gap: 32 }}>
      <SectionTitle
        title="Admin Dashboard"
        subtitle="Monitor orders and reviews without touching the API layer."
        align="left"
      />

      <div className="admin-panels" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Card className="admin-orders-card">
          <SectionTitle
            title="Orders"
            subtitle="Review and update recent NaturaGloss orders."
            align="left"
            className="mb-4"
          />
          <div className="admin-orders-toolbar" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
            <div>
              <label htmlFor="status-filter" className="text-sm text-gray-600 mr-2">
                Filter:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "all")}
              >
                <option value="all">All</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
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
                    <tr key={order.id}>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</td>
                      <td>{order.orderCode ?? order.id}</td>
                      <td>{order.customerName ?? "—"}</td>
                      <td>{order.customerPhone ?? "—"}</td>
                      <td>{order.city ?? "—"}</td>
                      <td>{order.totalAmount ? `${order.totalAmount} EGP` : "—"}</td>
                      <td>
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
