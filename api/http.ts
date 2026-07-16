import type { IncomingMessage, ServerResponse } from "http";
export { default as orderCreatedWebhookHandler } from "../src/presentation/http/handlers/orderCreatedWebhookHandler.js";
export { enhanceApiResponse } from "../src/presentation/http/responseHelpers.js";
export { normalizeServerlessRequest } from "../src/presentation/http/serverlessHelpers.js";

export type ApiRequest = IncomingMessage & {
  body?: any;
  method?: string;
  query?: Record<string, string>;
  url?: string;
};

export type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => ApiResponse;
};
