import type { EmailProvider } from "./providers/emailProvider";
import { FakeEmailProvider } from "./providers/fakeEmailProvider";
import { GmailEmailProvider } from "./providers/gmailEmailProvider";
import { buildOrdersHandler, notifyTestHandler, streamOrdersHandler } from "./lib/http/ordersHandler";
import { enhanceApiResponse } from "./lib/http/responseHelpers";
import { normalizeServerlessRequest } from "./lib/http/serverlessHelpers";
import type { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";

const createEmailProvider = (): EmailProvider => {
  try {
    return new GmailEmailProvider();
  } catch (error) {
    console.warn("[email] GmailEmailProvider unavailable:", error);
    return new FakeEmailProvider();
  }
};

const emailProvider = createEmailProvider();
const ordersHandler = buildOrdersHandler({ emailProvider });

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  console.log("orders handler version 2 loaded");
  enhanceApiResponse(res);

  try {
    await normalizeServerlessRequest(req);
    const pathname = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`).pathname;

    if (pathname === "/api/orders/stream") {
      return streamOrdersHandler(req as any, res as any);
    }

    if (pathname === "/api/notify-test") {
      return notifyTestHandler(req as any, res as any);
    }

    if (req.method === "POST") {
      const payload = req.body ?? {};
      const customer = typeof payload?.customer === "object" ? payload.customer : {};
      const hasCustomerName = typeof customer?.name === "string" && customer.name.trim().length > 0;
      const hasCustomerPhone = typeof customer?.phone === "string" && customer.phone.trim().length > 0;
      const items = Array.isArray(payload?.items) ? payload.items : [];

      if (!hasCustomerName || !hasCustomerPhone) {
        return res.status(400).json({ error: "Customer name and phone are required" });
      }

      if (!items.length) {
        return res.status(400).json({ error: "Order must include at least one item" });
      }
    }

    return await ordersHandler(req as any, res as any);
  } catch (error: any) {
    console.error("orders handler error", error);
    const message = typeof error?.message === "string" ? error.message : "Unexpected server error";
    if (res.headersSent) {
      return res.end();
    }
    return res.status(500).json({ error: "Internal server error", details: message });
  }
}
