import type { IncomingMessage, ServerResponse } from "http";

export type Request = IncomingMessage & {
  url?: string;
  method?: string;
  body?: any;
  query?: Record<string, string>;
};

export type Response = ServerResponse & {
  status: (code: number) => Response;
  json: (payload: unknown) => void;
};