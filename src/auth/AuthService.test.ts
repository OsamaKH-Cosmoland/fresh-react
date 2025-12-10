import { AuthService } from './AuthService';
import { buildTestUserRepository } from '../users/InMemoryUserRepository';

describe('AuthService', () => {
  it('returns a token when the user exists', async () => {
    const repo = buildTestUserRepository([{ id: 'u1', email: 'test@example.com', name: 'Test' }]);
    const service = new AuthService(repo);

    const token = await service.login('test@example.com');

    expect(token).toBe('token-for-u1');
  });

  it('throws when no user exists for the given email', async () => {
    const repo = buildTestUserRepository([]);
    const service = new AuthService(repo);

    await expect(service.login('missing@example.com')).rejects.toThrow('Invalid credentials');
  });
});
