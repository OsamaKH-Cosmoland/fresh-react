import { loginHandler } from './loginHandler';

type MockRequest = {
  method?: string;
  body?: Record<string, any>;
};

type MockResponse = {
  status: jest.Mock<MockResponse>;
  json: jest.Mock<MockResponse>;
  setHeader: jest.Mock<void>;
  getHeader: jest.Mock<string | undefined>;
  end: jest.Mock<void>;
  _status?: number;
  _json?: unknown;
};

const createMockResponse = (): MockResponse => {
  const res = {
    status: jest.fn().mockImplementation((code: number) => {
      res._status = code;
      return res;
    }),
    json: jest.fn().mockImplementation((payload: unknown) => {
      res._json = payload;
      return res;
    }),
    setHeader: jest.fn(),
    getHeader: jest.fn().mockReturnValue(undefined),
    end: jest.fn(),
    _status: undefined,
    _json: undefined,
  };
  return res as MockResponse;
};

describe('loginHandler', () => {
  it('returns 200 and a token for a known email', async () => {
    const req: MockRequest = { method: 'POST', body: { email: 'user@example.com' } };
    const res = createMockResponse();

    await loginHandler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: 'token-for-server-user' });
  });

  it('returns 401 when credentials are invalid', async () => {
    const req: MockRequest = { method: 'POST', body: { email: 'missing@example.com' } };
    const res = createMockResponse();

    await loginHandler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });

  it('returns 400 when email is not provided', async () => {
    const req: MockRequest = { method: 'POST', body: {} };
    const res = createMockResponse();

    await loginHandler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing email' });
  });
});
