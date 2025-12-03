import { fruitsHandler, enhanceApiResponse, normalizeServerlessRequest } from "./http";

export default async function handler(req: Parameters<typeof fruitsHandler>[0], res: Parameters<typeof fruitsHandler>[1]) {
  await normalizeServerlessRequest(req);
  enhanceApiResponse(res);
  return fruitsHandler(req, res);
}
