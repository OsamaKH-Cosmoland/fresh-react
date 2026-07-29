import { productsHandler, enhanceApiResponse, normalizeServerlessRequest } from "./http-barrel.js";
import { withSentry } from "../src/infrastructure/monitoring/sentry.js";

async function productsRoute(
  req: Parameters<typeof productsHandler>[0],
  res: Parameters<typeof productsHandler>[1]
) {
  await normalizeServerlessRequest(req);
  enhanceApiResponse(res);
  return productsHandler(req, res);
}

export default withSentry(productsRoute, "/api/products");
