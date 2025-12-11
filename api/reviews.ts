import { enhanceApiResponse, normalizeServerlessRequest, reviewsHandler } from "./http-barrel.js";

export default async function handler(
  req: Parameters<typeof reviewsHandler>[0],
  res: Parameters<typeof reviewsHandler>[1]
) {
  await normalizeServerlessRequest(req as any);
  enhanceApiResponse(res as any);
  return reviewsHandler(req as any, res as any);
}
