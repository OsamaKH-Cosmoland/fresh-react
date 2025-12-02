import type { ServerResponse } from "http";

export function enhanceApiResponse(res: ServerResponse) {
  if (!(res as any).status) {
    (res as any).status = (code: number) => {
      res.statusCode = code;
      return res;
    };
  }
  if (!(res as any).json) {
    (res as any).json = (payload: unknown) => {
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json");
      }
      res.end(JSON.stringify(payload));
      return res;
    };
  }
}
