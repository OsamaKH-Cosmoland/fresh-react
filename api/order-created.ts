import orderCreatedWebhookHandler from "./lib/http/orderCreatedWebhookHandler";
import { enhanceApiResponse } from "./lib/http/responseHelpers";
import { normalizeServerlessRequest } from "./lib/http/serverlessHelpers";

export default async function handler(req: Parameters<typeof orderCreatedWebhookHandler>[0], res: Parameters<typeof orderCreatedWebhookHandler>[1]) {
  await normalizeServerlessRequest(req);
  enhanceApiResponse(res);
  return orderCreatedWebhookHandler(req, res);
}
