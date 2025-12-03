import { reviewsHandler, enhanceApiResponse, normalizeServerlessRequest } from "./http";
import type { IncomingMessage, ServerResponse } from "http";

type ServerlessRequest = IncomingMessage & { body?: any; query?: Record<string, string> };
type ServerlessResponse = ServerResponse & {
  status: (code: number) => ServerlessResponse;
  json: (payload: unknown) => ServerlessResponse;
};

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  await normalizeServerlessRequest(req);
  enhanceApiResponse(res);
  return reviewsHandler(req as any, res as any);
}
