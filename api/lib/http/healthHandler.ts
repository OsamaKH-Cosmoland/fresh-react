// Minimal health endpoint.
import type { IncomingMessage, ServerResponse } from "http";

type Response = ServerResponse & { status: (code: number) => Response; json: (payload: unknown) => void };

export default async function healthHandler(_req: IncomingMessage, res: Response) {
  res.status(200).json({ ok: true, time: new Date().toISOString() });
}
