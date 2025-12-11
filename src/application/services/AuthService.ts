import type { NotificationService } from '../../domain/shared/NotificationService';
import type { UserRepository } from '../../domain/users/UserRepository';

/**
 * Coordinates user authentication flows and side effects (email notifications).
 */
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async login(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    await this.notificationService.notify(user.email, 'Login notification', {
      category: 'auth',
      subject: 'Login notification',
    });

    return `token-for-${user.id}`;
  }
}
