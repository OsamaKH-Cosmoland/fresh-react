import { productsHandler, enhanceApiResponse, normalizeServerlessRequest } from "./http-barrel.js";

export default async function handler(
  req: Parameters<typeof productsHandler>[0],
  res: Parameters<typeof productsHandler>[1]
) {
  await normalizeServerlessRequest(req);
  enhanceApiResponse(res);
  return productsHandler(req, res);
}
