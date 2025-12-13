// Minimal health endpoint.
import type { IncomingMessage } from "http";
import { Response } from "./typeHandler";

export default async function healthHandler(_req: IncomingMessage, res: Response) {
  res.status(200).json({ ok: true, time: new Date().toISOString() });
}
