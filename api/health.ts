import type { ServerResponse } from "http";

type ServerlessResponse = ServerResponse & {
  status: (code: number) => ServerlessResponse;
  json: (payload: unknown) => ServerlessResponse;
};

function enhanceApiResponse(res: ServerlessResponse) {
  if (!res.status) {
    (res as any).status = (code: number) => {
      res.statusCode = code;
      return res;
    };
  }
  if (!res.json) {
    (res as any).json = (payload: unknown) => {
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json");
      }
      res.end(JSON.stringify(payload));
      return res;
    };
  }
}

export default function handler(_req: unknown, res: ServerlessResponse) {
  enhanceApiResponse(res);
  return res.status(200).json({ ok: true, time: new Date().toISOString() });
}
