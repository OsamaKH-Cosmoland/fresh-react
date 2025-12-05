import { orderCreatedWebhookHandler, enhanceApiResponse, normalizeServerlessRequest } from "./http.js";

export default async function handler(req: Parameters<typeof orderCreatedWebhookHandler>[0], res: Parameters<typeof orderCreatedWebhookHandler>[1]) {
  await normalizeServerlessRequest(req);
  enhanceApiResponse(res);
  return orderCreatedWebhookHandler(req, res);
}
