import type { EmailProvider } from "../src/providers/emailProvider";
import { FakeEmailProvider } from "../src/providers/fakeEmailProvider";
import { GmailEmailProvider } from "../src/providers/gmailEmailProvider";
import { buildOrdersHandler } from "../server/http/ordersHandler";
import { enhanceApiResponse } from "./http/responseHelpers";
import { normalizeServerlessRequest } from "./http/serverlessHelpers";
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
