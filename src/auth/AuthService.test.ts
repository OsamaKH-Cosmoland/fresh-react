import { AuthService } from './AuthService';
import type { EmailService } from '../notifications/EmailService';
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

  async deleteById(): Promise<void> {
    return;
  }
}

class FakeEmailService implements EmailService {
  public readonly calls: string[] = [];

  async sendLoginNotification(email: string): Promise<void> {
    this.calls.push(email);
  }
}

describe('AuthService', () => {
  it('returns a token when the user exists', async () => {
    const user: User = { id: 'u1', email: 'test@example.com', name: 'Test' };
    const repo = new FakeUserRepository(user);
    const emailService = new FakeEmailService();
    const service = new AuthService(repo, emailService);

    await expect(service.login('test@example.com')).resolves.toBe('token-for-u1');
    expect(emailService.calls).toEqual(['test@example.com']);
  });

  it('throws when no user exists for the given email', async () => {
    const repo = new FakeUserRepository(null);
    const emailService = new FakeEmailService();
    const service = new AuthService(repo, emailService);

    await expect(service.login('missing@example.com')).rejects.toThrow('Invalid credentials');
    expect(emailService.calls).toHaveLength(0);
  });

  it('propagates repository errors', async () => {
    const repo = new FakeUserRepository(null, new Error('DB failure'));
    const emailService = new FakeEmailService();
    const service = new AuthService(repo, emailService);

    await expect(service.login('any@example.com')).rejects.toThrow('DB failure');
    expect(emailService.calls).toHaveLength(0);
  });
});
