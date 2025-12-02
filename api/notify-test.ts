import { notifyTestHandler } from "../lib/http/ordersHandler";
import { enhanceApiResponse } from "./http/responseHelpers";

export default function handler(req: Parameters<typeof notifyTestHandler>[0], res: Parameters<typeof notifyTestHandler>[1]) {
  enhanceApiResponse(res);
  return notifyTestHandler(req, res);
}
