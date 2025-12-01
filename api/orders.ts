import type { EmailProvider } from "../src/providers/emailProvider";
import { FakeEmailProvider } from "../src/providers/fakeEmailProvider";
import { GmailEmailProvider } from "../src/providers/gmailEmailProvider";
import { buildOrdersHandler } from "./http/ordersHandler";
import type { IncomingMessage, ServerResponse } from "http";

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

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return ordersHandler(req as any, res as any);
}
