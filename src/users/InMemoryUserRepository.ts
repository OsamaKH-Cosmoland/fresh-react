import type { User, UserRepository } from './UserRepository';

export class InMemoryUserRepository implements UserRepository {
  private readonly users: Map<string, User>;

  constructor(initialUsers: User[] = []) {
    this.users = new Map(initialUsers.map((user) => [user.id, user]));
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async save(user: User): Promise<User> {
    const stored = { ...user };
    this.users.set(user.id, stored);
    return stored;
  }
}
