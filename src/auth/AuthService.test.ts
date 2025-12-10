import { AuthService } from './AuthService';
import type { UserRepository, User } from '../users/UserRepository';

class FakeUserRepository implements UserRepository {
  constructor(
    private readonly user: User | null = null,
    private readonly error: Error | null = null,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    if (this.error) {
      throw this.error;
    }
    return this.user && this.user.email === email ? this.user : null;
  }

  async findById(_id: string): Promise<User | null> {
    return null;
  }

  async save(user: User): Promise<User> {
    return user;
  }
}

describe('AuthService', () => {
  it('returns a token when the user exists', async () => {
    const user: User = { id: 'u1', email: 'test@example.com', name: 'Test' };
    const repo = new FakeUserRepository(user);
    const service = new AuthService(repo);

    await expect(service.login('test@example.com')).resolves.toBe('token-for-u1');
  });

  it('throws when no user exists for the given email', async () => {
    const repo = new FakeUserRepository(null);
    const service = new AuthService(repo);

    await expect(service.login('missing@example.com')).rejects.toThrow('Invalid credentials');
  });

  it('propagates repository errors', async () => {
    const repo = new FakeUserRepository(null, new Error('DB failure'));
    const service = new AuthService(repo);

    await expect(service.login('any@example.com')).rejects.toThrow('DB failure');
  });
});
