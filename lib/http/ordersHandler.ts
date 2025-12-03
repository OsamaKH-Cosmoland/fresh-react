// HTTP adapter for order endpoints.
import type { IncomingMessage, ServerResponse } from "http";
import type { EmailProvider } from "../../providers/emailProvider";
import { createOrder, listOrders, notifyTelegramTest, ordersStream, updateOrderStatus } from "../../server/services/orders";

type Request = IncomingMessage & { method?: string; body?: any; query?: Record<string, string>; url?: string };
type Response = ServerResponse & { status: (code: number) => Response; json: (payload: unknown) => void };

export function streamOrdersHandler(_req: Request, res: Response) {
  const bus = ordersStream();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders?.();
  res.write(`event: connected\ndata: {}\n\n`);

  const heartbeat = setInterval(() => {
    if (res.writableEnded) return;
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 25000);

  const handleNewOrder = (order: unknown) => {
    if (res.writableEnded) return;
    res.write(`event: new-order\n`);
    res.write(`data: ${JSON.stringify(order)}\n\n`);
  };

  bus.on("new-order", handleNewOrder);

  const close = () => {
    clearInterval(heartbeat);
    bus.off("new-order", handleNewOrder);
  };

  _req.on("close", close);
  _req.on("error", close);
}

export function buildOrdersHandler({ emailProvider }: { emailProvider: EmailProvider }) {
  return async function ordersHandler(req: Request, res: Response) {
    try {
      if (req.method === "OPTIONS") {
        res.setHeader("Allow", "GET,POST,PATCH,OPTIONS");
        return res.status(204).end();
      }

      if (req.method === "GET") {
        const limitParam = Number.parseInt(req.query?.limit ?? "50", 10);
        const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 500)) : 50;
        const docs = await listOrders(limit);
        return res.status(200).json(docs);
      }

      if (req.method === "POST") {
        const result = await createOrder(req.body, undefined, emailProvider);
        return res
          .status(201)
          .json({ ok: true, orderId: result.stored.id, orderCode: result.stored.orderCode });
      }

      if (req.method === "PATCH") {
        const id = req.query?.id || (req.body as any)?.id;
        if (!id) {
          return res.status(400).json({ error: "Missing order id" });
        }
        const status = (req.body as any)?.status;
        if (!status) {
          return res.status(400).json({ error: "Missing status" });
        }
        const updated = await updateOrderStatus(id, status);
        if (!updated) {
          return res.status(404).json({ error: "Order not found" });
        }
        return res.status(200).json(updated);
      }

      res.setHeader("Allow", ["GET", "POST", "PATCH"]);
      return res.status(405).end("Method Not Allowed");
    } catch (error: any) {
      const statusCode = error?.statusCode ?? 500;
      const message = error?.message ?? "Server error";
      console.error("API /api/orders error:", error);
      return res.status(statusCode).json({ error: message });
    }
  };
}

export async function notifyTestHandler(_req: Request, res: Response) {
  try {
    const result = await notifyTelegramTest();
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error?.statusCode ?? 500).json({ ok: false, error: error?.message ?? "Server error" });
  }
}
