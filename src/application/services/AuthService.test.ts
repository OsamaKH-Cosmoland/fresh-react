import { AuthService } from './AuthService';
import type { UserRepository, User } from '../../domain/users/UserRepository';
import { FakeNotificationService } from '../../infrastructure/notifications/FakeNotificationService';

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

  async deleteById(_id: string): Promise<void> {
    return;
  }

  async listAll(): Promise<User[]> {
    return this.user ? [this.user] : [];
  }
}

describe('AuthService', () => {
  it('returns a token when the user exists', async () => {
    const user: User = { id: 'u1', email: 'test@example.com', name: 'Test' };
    const repo = new FakeUserRepository(user);
    const notificationService = new FakeNotificationService();
    const service = new AuthService(repo, notificationService);

    await expect(service.login('test@example.com')).resolves.toBe('token-for-u1');
    expect(notificationService.calls[0]).toMatchObject({ recipient: 'test@example.com' });
  });

  it('throws when no user exists for the given email', async () => {
    const repo = new FakeUserRepository(null);
    const notificationService = new FakeNotificationService();
    const service = new AuthService(repo, notificationService);

    await expect(service.login('missing@example.com')).rejects.toThrow('Invalid credentials');
    expect(notificationService.calls).toHaveLength(0);
  });

  it('propagates repository errors', async () => {
    const repo = new FakeUserRepository(null, new Error('DB failure'));
    const notificationService = new FakeNotificationService();
    const service = new AuthService(repo, notificationService);

    await expect(service.login('any@example.com')).rejects.toThrow('DB failure');
    expect(notificationService.calls).toHaveLength(0);
  });

  it('propagates email delivery failures after finding the user', async () => {
    const user: User = { id: 'u2', email: 'notify@example.com', name: 'Notify' };
    const repo = new FakeUserRepository(user);
    const notificationService = {
      async notify() {
        throw new Error('email-down');
      },
    } as any;
    const service = new AuthService(repo, notificationService);

    await expect(service.login('notify@example.com')).rejects.toThrow('email-down');
  });
});
