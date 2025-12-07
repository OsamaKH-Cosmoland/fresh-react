import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle, Button } from "../components/ui";
import { AdminOrder, OrderStatus } from "./AdminDashboard";

const DATE_RANGE = 30;

const buildOrderModel = (order: any): AdminOrder => ({
  id: order.id ?? order.mongoId ?? order.orderCode ?? `${order._id ?? Date.now()}`,
  orderCode: order.orderCode,
  status: order.status ?? "pending",
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  totalAmount:
    order.totals?.subtotal ?? order.totals?.total ?? order.total ?? order.subtotal ?? 0,
  subtotal: order.totals?.subtotal ?? order.subtotal,
  customerName: order.customer?.name,
  customerPhone: order.customer?.phone,
  city: order.customer?.city,
  items: order.items ?? order.lineItems ?? [],
  notes: order.customer?.notes ?? order.notes ?? "",
});

const formatDate = (date: Date) => date.toISOString().split("T")[0];

const getLastNDays = (n: number) => {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }
  return days;
};

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/orders?limit=200");
        if (!res.ok) throw new Error("Failed to load orders.");
        const data = (await res.json()) as any[];
        if (cancelled) return;
        setOrders(data.map(buildOrderModel));
      } catch (err) {
        if (cancelled) return;
        setError((err as Error)?.message ?? "Unable to load analytics data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (DATE_RANGE - 1));
    return orders.filter((order) => {
      if (!order.createdAt) return false;
      return new Date(order.createdAt).getTime() >= cutoff.getTime();
    });
  }, [orders]);

  const metrics = useMemo(() => {
    const totalRevenue = filtered.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0);
    const totalOrders = filtered.length;
    const avgOrder = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
    const itemTotals = filtered.reduce<Record<string, { quantity: number; revenue: number }>>(
      (acc, order) => {
        (order.items ?? []).forEach((item) => {
          if (!item.name) return;
          const entry = acc[item.name] ?? { quantity: 0, revenue: 0 };
          entry.quantity += item.quantity ?? 0;
          entry.revenue += (item.quantity ?? 0) * (item.price ?? 0);
          acc[item.name] = entry;
        });
        return acc;
      },
      {}
    );
    const topProduct = Object.entries(itemTotals).reduce(
      (best, [name, entry]) =>
        entry.quantity > best.quantity ? { name, ...entry } : best,
      { name: "—", quantity: 0, revenue: 0 }
    );
    return {
      totalRevenue,
      totalOrders,
      avgOrder,
      topProduct,
    };
  }, [filtered]);

  const chartDays = useMemo(() => {
    const days = getLastNDays(DATE_RANGE);
    return days.map((day) => {
      const ordersOnDay = filtered.filter((order) => (order.createdAt ?? "").startsWith(day));
      return {
        date: day,
        revenue: ordersOnDay.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0),
        orders: ordersOnDay.length,
      };
    });
  }, [filtered]);

  const maxRevenue = Math.max(...chartDays.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...chartDays.map((d) => d.orders), 1);

  return (
    <main className="admin-analytics-page" style={{ padding: 32 }}>
      <SectionTitle title="Admin Analytics" subtitle="Track sales, orders, and product demand." />
      <div className="analytics-metrics">
        <Card className="metric-card">
          <p>Total Revenue</p>
          <strong>{metrics.totalRevenue} EGP</strong>
        </Card>
        <Card className="metric-card">
          <p>Total Orders</p>
          <strong>{metrics.totalOrders}</strong>
        </Card>
        <Card className="metric-card">
          <p>Average Order</p>
          <strong>{metrics.avgOrder} EGP</strong>
        </Card>
        <Card className="metric-card">
          <p>Top product</p>
          <strong>{metrics.topProduct.name}</strong>
          <span>
            {metrics.topProduct.quantity} sold · {metrics.topProduct.revenue} EGP
          </span>
        </Card>
      </div>

      {loading ? (
        <p>Loading analytics…</p>
      ) : error ? (
        <p className="text-rose-600">{error}</p>
      ) : (
        <>
          <div className="analytics-charts">
            <Card>
              <SectionTitle title="Revenue (last 30 days)" align="left" className="mb-2" />
              <div className="chart-grid">
                {chartDays.map((day) => (
                  <div key={day.date} className="chart-bar">
                    <div
                      className="chart-bar__fill"
                      style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                      title={`Revenue: ${day.revenue} EGP`}
                    />
                    <small>{day.date.slice(5)}</small>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle title="Orders (last 30 days)" align="left" className="mb-2" />
              <div className="chart-grid">
                {chartDays.map((day) => (
                  <div key={`${day.date}-orders`} className="chart-bar">
                    <div
                      className="chart-bar__fill orders"
                      style={{ height: `${(day.orders / maxOrders) * 100}%` }}
                      title={`${day.orders} orders`}
                    />
                    <small>{day.date.slice(5)}</small>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card className="top-products-card">
            <SectionTitle title="Top products" align="left" className="mb-2" />
            <ul className="top-products-list">
              {Object.entries(
                filtered.reduce<Record<string, { quantity: number; revenue: number }>>((acc, order) => {
                  (order.items ?? []).forEach((item) => {
                    if (!item.name) return;
                    const entry = acc[item.name] ?? { quantity: 0, revenue: 0 };
                    entry.quantity += item.quantity ?? 0;
                    entry.revenue += (item.quantity ?? 0) * (item.price ?? 0);
                    acc[item.name] = entry;
                  });
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1].quantity - a[1].quantity)
                .slice(0, 6)
                .map(([name, stats]) => (
                  <li key={name}>
                    <span>{name}</span>
                    <span>
                      {stats.quantity} sold · {stats.revenue} EGP
                    </span>
                  </li>
                ))}
            </ul>
          </Card>
        </>
      )}
      <Button variant="ghost" size="md">
        Back to orders
      </Button>
    </main>
  );
}
