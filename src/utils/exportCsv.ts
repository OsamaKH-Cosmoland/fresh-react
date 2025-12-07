import type { AdminOrder } from "@/pages/AdminDashboard";

const escapeCsv = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  const needEscape = text.includes(",") || text.includes('"') || text.includes("\n");
  if (!needEscape) return text;
  return `"${text.replace(/"/g, '""')}"`;
};

export function exportOrdersToCsv(orders: AdminOrder[]): string {
  const headers = [
    "Order ID",
    "Order Code",
    "Status",
    "Created At",
    "Customer Name",
    "Phone",
    "City",
    "Items Count",
    "Item Summary",
    "Subtotal",
    "Total Amount",
    "Notes",
  ];
  const rows = orders.map((order) => {
    const items = order.items ?? [];
    const summary = items
      .map((item) => `${item.name ?? "Item"} x${item.quantity ?? 1}`)
      .join("; ");
    const notes = order.notes ?? order.customerNotes ?? "";
    return [
      escapeCsv(order.id),
      escapeCsv(order.orderCode),
      escapeCsv(order.status),
      escapeCsv(order.createdAt),
      escapeCsv(order.customerName),
      escapeCsv(order.customerPhone),
      escapeCsv(order.city),
      escapeCsv(items.reduce((total, item) => total + (item.quantity ?? 0), 0)),
      escapeCsv(summary),
      escapeCsv(order.subtotal ?? order.totalAmount),
      escapeCsv(order.totalAmount ?? order.subtotal),
      escapeCsv(notes),
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}
