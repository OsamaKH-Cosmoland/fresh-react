import type { EmailProvider } from "../server/providers/emailProvider";
import { FakeEmailProvider } from "../server/providers/fakeEmailProvider";
import { GmailEmailProvider } from "../server/providers/gmailEmailProvider";
import { buildOrdersHandler } from "../lib/http/ordersHandler";
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
  try {
    return await ordersHandler(req as any, res as any);
  } catch (error) {
    console.error("[api/orders] error", error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "Internal server error" }));
  }
}
