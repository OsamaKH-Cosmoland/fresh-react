import type { EmailProvider } from "../providers/emailProvider";
import { FakeEmailProvider } from "../providers/fakeEmailProvider";
import { GmailEmailProvider } from "../providers/gmailEmailProvider";
import { buildOrdersHandler, notifyTestHandler, streamOrdersHandler } from "../lib/http/ordersHandler";
import { enhanceApiResponse } from "../lib/http/responseHelpers";
import { normalizeServerlessRequest } from "../lib/http/serverlessHelpers";
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
  await normalizeServerlessRequest(req);
  enhanceApiResponse(res);
  const pathname = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`).pathname;

  if (pathname === "/api/orders/stream") {
    return streamOrdersHandler(req as any, res as any);
  }

  if (pathname === "/api/notify-test") {
    return notifyTestHandler(req as any, res as any);
  }
  try {
    return await ordersHandler(req as any, res as any);
  } catch (error) {
    console.error("[api/orders] error", error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "Internal server error" }));
  }
}
