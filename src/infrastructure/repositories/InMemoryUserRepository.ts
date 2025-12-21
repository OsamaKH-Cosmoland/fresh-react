import type { User, UserRepository } from '../../domain/users/UserRepository';

/**
 * In-memory implementation of `UserRepository` used for tests and simple services.
 */
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

  async updateById(id: string, updates: Partial<User>): Promise<User | null> {
    const existing = this.users.get(id);
    if (!existing) {
      return null;
    }
    const updated: User = { ...existing, ...updates };
    this.users.set(id, { ...updated });
    return updated;
  }

  async save(user: User): Promise<User> {
    const stored = { ...user };
    this.users.set(user.id, stored);
    return stored;
  }

  async deleteById(id: string): Promise<void> {
    this.users.delete(id);
  }

  async listAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

/** Helper that preloads the in-memory repo with initial data for tests. */
export function buildTestUserRepository(initialUsers: User[] = []): UserRepository {
  return new InMemoryUserRepository(initialUsers);
}
export const defaultSeededUsers: User[] = [
  { id: 'server-user', email: 'user@example.com', name: 'Server User' },
  { id: 'u1', email: 'osamakhaireldin@gmail.com', name: 'Osama' },
];
