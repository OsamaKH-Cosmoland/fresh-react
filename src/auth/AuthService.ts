import type { EmailService } from '../notifications/EmailService';
import type { UserRepository } from '../users/UserRepository';

/**
 * Coordinates user authentication flows and side effects (email notifications).
 */
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  async login(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    await this.emailService.sendLoginNotification(user.email);

    return `token-for-${user.id}`;
  }
}
