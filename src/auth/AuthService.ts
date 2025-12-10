import type { UserRepository } from '../users/UserRepository';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async login(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    return `token-for-${user.id}`;
  }
}
