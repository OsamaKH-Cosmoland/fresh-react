import { loginHandler } from './loginHandler';

type MockRequest = {
  method?: string;
  body?: Record<string, unknown>;
};

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  end: (body?: unknown) => MockResponse;
  setHeader: jest.Mock<void>;
  _status?: number;
  _json?: unknown;
  _ended?: unknown;
};

const createMockReqRes = (
  method: string,
  body: Record<string, unknown> = {},
): { req: MockRequest; res: MockResponse } => {
  const res: MockResponse = {
    status(code: number) {
      res._status = code;
      return res;
    },
    json(payload: unknown) {
      res._json = payload;
      return res;
    },
    end(body?: unknown) {
      res._ended = body;
      return res;
    },
    setHeader: jest.fn(),
  };
  const req: MockRequest = { method, body };
  return { req, res };
};

describe('loginHandler', () => {
  it('handles OPTIONS requests', async () => {
    const { req, res } = createMockReqRes('OPTIONS');

    await loginHandler(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'POST,OPTIONS');
    expect(res._status).toBe(204);
    expect(res._ended).toBeUndefined();
  });

  it('rejects non-POST methods', async () => {
    const { req, res } = createMockReqRes('GET');

    await loginHandler(req as any, res as any);

    expect(res._status).toBe(405);
    expect(res._ended).toBe('Method Not Allowed');
  });

  it('returns 400 when email is missing', async () => {
    const { req, res } = createMockReqRes('POST', {});

    await loginHandler(req as any, res as any);

    expect(res._status).toBe(400);
    expect(res._json).toEqual({ error: 'Missing email' });
  });

  it('returns 200 with a token for known emails', async () => {
    const { req, res } = createMockReqRes('POST', { email: 'user@example.com' });

    await loginHandler(req as any, res as any);

    expect(res._status).toBe(200);
    expect(res._json).toEqual({ token: 'token-for-server-user' });
  });

  it('returns 401 for unknown emails', async () => {
    const { req, res } = createMockReqRes('POST', { email: 'nope@example.com' });

    await loginHandler(req as any, res as any);

    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Invalid credentials' });
  });
});
