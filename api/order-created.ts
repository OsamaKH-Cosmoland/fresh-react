import { orderCreatedWebhookHandler, enhanceApiResponse, normalizeServerlessRequest } from "./http.js";
import { withSentry } from "../src/infrastructure/monitoring/sentry.js";

async function orderCreatedRoute(req: Parameters<typeof orderCreatedWebhookHandler>[0], res: Parameters<typeof orderCreatedWebhookHandler>[1]) {
  await normalizeServerlessRequest(req);
  enhanceApiResponse(res);
  return orderCreatedWebhookHandler(req, res);
}

export default withSentry(orderCreatedRoute, "/api/order-created");
