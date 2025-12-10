import type { User, UserRepository } from './UserRepository';

export class InMemoryUserRepository implements UserRepository {
  private readonly users: Map<string, User>;

  constructor(initialUsers: User[] = []) {
    this.users = new Map();
    initialUsers.forEach((user) => this.users.set(user.id, { ...user }));
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async save(user: User): Promise<User> {
    const stored = { ...user };
    this.users.set(user.id, stored);
    return stored;
  }
}

export function buildTestUserRepository(initialUsers: User[] = []): UserRepository {
  return new InMemoryUserRepository(initialUsers);
}
