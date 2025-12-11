import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import type { EmailProvider } from "../src/domain/shared/EmailProvider";
import { FakeEmailProvider } from "../src/infrastructure/email/fakeEmailProvider";
import { GmailEmailProvider } from "../src/infrastructure/email/gmailEmailProvider";
import {
  buildOrdersHandler,
  notifyTestHandler,
  streamOrdersHandler,
} from "./http-barrel.js";
import { enhanceApiResponse, normalizeServerlessRequest } from "./http-barrel.js";

type ServerlessRequest = IncomingMessage & {
  body?: any;
  query?: Record<string, string>;
  url?: string;
  method?: string;
};

type ServerlessResponse = ServerResponse & {
  status: (code: number) => ServerlessResponse;
  json: (payload: unknown) => ServerlessResponse;
};

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

export default async function handler(rawReq: ServerlessRequest, rawRes: ServerlessResponse) {
  const req = (await normalizeServerlessRequest(rawReq as any)) as ServerlessRequest;
  const res = rawRes as any;
  enhanceApiResponse(res);

  try {
    const pathname = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`).pathname;

    if (pathname === "/api/orders/stream") {
      return streamOrdersHandler(req as any, res as any);
    }

    if (pathname === "/api/notify-test") {
      return notifyTestHandler(req as any, res as any);
    }

    return ordersHandler(req as any, res as any);
  } catch (error: any) {
    console.error("orders handler error", error);
    if (res.headersSent) {
      return res.end();
    }
    return res.status(500).json({
      error: "Internal server error",
      details: typeof error?.message === "string" ? error.message : undefined,
    });
  }
}
