import { AuthService } from './AuthService';
import type { NotificationService } from '../../domain/shared/NotificationService';
import type { User, UserRepository } from '../../domain/users/UserRepository';

const createUserRepository = (): jest.Mocked<UserRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  updateById: jest.fn(),
  save: jest.fn(),
  deleteById: jest.fn(),
  listAll: jest.fn(),
});

const createNotificationService = (): jest.Mocked<NotificationService> => ({
  notify: jest.fn(),
});

describe('AuthService', () => {
  it('returns a token when the user exists', async () => {
    const user: User = { id: 'u1', email: 'test@example.com', name: 'Test' };
    const repo = createUserRepository();
    repo.findByEmail.mockResolvedValue(user);
    const notificationService = createNotificationService();
    notificationService.notify.mockResolvedValue();
    const service = new AuthService(repo, notificationService);

    await expect(service.login('test@example.com')).resolves.toBe('token-for-u1');
    expect(repo.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(notificationService.notify).toHaveBeenCalledWith(
      user.email,
      'Login notification',
      {
        category: 'auth',
        subject: 'Login notification',
      },
    );
  });

  it('throws when no user exists for the given email', async () => {
    const repo = createUserRepository();
    repo.findByEmail.mockResolvedValue(null);
    const notificationService = createNotificationService();
    const service = new AuthService(repo, notificationService);

    await expect(service.login('missing@example.com')).rejects.toThrow('Invalid credentials');
    expect(notificationService.notify).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    const repo = createUserRepository();
    repo.findByEmail.mockRejectedValue(new Error('DB failure'));
    const notificationService = createNotificationService();
    const service = new AuthService(repo, notificationService);

    await expect(service.login('any@example.com')).rejects.toThrow('DB failure');
    expect(notificationService.notify).not.toHaveBeenCalled();
  });

  it('propagates email delivery failures after finding the user', async () => {
    const user: User = { id: 'u2', email: 'notify@example.com', name: 'Notify' };
    const repo = createUserRepository();
    repo.findByEmail.mockResolvedValue(user);
    const notificationService = createNotificationService();
    notificationService.notify.mockRejectedValue(new Error('email-down'));
    const service = new AuthService(repo, notificationService);

    await expect(service.login('notify@example.com')).rejects.toThrow('email-down');
  });
});
