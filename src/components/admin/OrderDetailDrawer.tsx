import { useEffect } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { FadeIn } from "@/components/animate";
import { OrderStatus, AdminOrder } from "@/pages/AdminDashboard";

interface OrderDetailDrawerProps {
  open: boolean;
  order: AdminOrder | null;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}

export default function OrderDetailDrawer({
  open,
  order,
  onClose,
  onStatusChange,
}: OrderDetailDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  if (!order) return null;

  const statusOptions: OrderStatus[] = ["pending", "confirmed", "shipped", "cancelled"];

  const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : "—";
  const updated = order.updatedAt ? new Date(order.updatedAt).toLocaleString() : null;

  const copyToClipboard = async (text: string) => {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className={`order-detail-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <div className="order-detail-drawer__backdrop" onClick={onClose} />
      <FadeIn>
        <aside className="order-detail-drawer__panel">
          <header className="order-detail-drawer__header">
            <div>
              <p className="order-detail-drawer__eyebrow">Order Details</p>
              <h2>{order.orderCode ?? order.id}</h2>
            </div>
            <button type="button" className="order-detail-drawer__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </header>
          <SectionTitle title="Customer" align="left" className="mb-2" />
          <Card className="order-detail-card">
            <p className="order-detail-label">
              Name: <strong>{order.customerName ?? "—"}</strong>
            </p>
            <div className="order-detail-row">
              <span>Phone: {order.customerPhone ?? "—"}</span>
              {order.customerPhone && (
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.customerPhone)}>
                  Copy
                </Button>
              )}
            </div>
            <div className="order-detail-row">
              <span>Address: {order.city ?? "—"}</span>
              {order.city && (
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.city ?? "")}>
                  Copy
                </Button>
              )}
            </div>
            {order.notes && (
              <p className="order-detail-notes">
                Notes: <span>{order.notes}</span>
              </p>
            )}
          </Card>

          <SectionTitle title="Items" align="left" className="mb-2 mt-4" />
          <div className="order-detail-items">
            {(order.items ?? []).map((item) => (
              <div key={item.name} className="order-detail-item">
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.quantity} × {item.price} EGP
                  </p>
                </div>
                <strong>{item.quantity * item.price} EGP</strong>
              </div>
            ))}
            <div className="order-detail-summary">
              <span>Subtotal</span>
              <strong>{order.subtotal ?? order.totalAmount ?? 0} EGP</strong>
            </div>
            <div className="order-detail-summary">
              <span>Total</span>
              <strong>{order.totalAmount ?? order.subtotal ?? 0} EGP</strong>
            </div>
          </div>

          <SectionTitle title="Metadata" align="left" className="mb-2 mt-4" />
          <div className="order-detail-meta">
            <span className={`status-chip status-${order.status}`}>{order.status}</span>
            <span>Created: {created}</span>
            {updated && <span>Updated: {updated}</span>}
          </div>

          <div className="order-detail-status">
            <p>Status update</p>
            <select
              value={order.status}
              onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </aside>
      </FadeIn>
    </div>
  );
}
