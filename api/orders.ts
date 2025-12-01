import type { EmailProvider } from "../src/providers/emailProvider";
import { FakeEmailProvider } from "../src/providers/fakeEmailProvider";
import { GmailEmailProvider } from "../src/providers/gmailEmailProvider";
import { buildOrdersHandler } from "./http/ordersHandler";
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

const parseRequestBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", resolve);
    req.on("error", reject);
  }).catch(() => {});
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return {};

  const contentType = req.headers["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
};

const enhanceRequest = async (req: IncomingMessage) => {
  const parsedUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  (req as any).query = Object.fromEntries(parsedUrl.searchParams.entries());
  if (req.method && req.method !== "GET") {
    (req as any).body = await parseRequestBody(req);
  } else {
    (req as any).body = {};
  }
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await enhanceRequest(req);
  return ordersHandler(req as any, res as any);
}
