export type User = {
  id: string;
  email: string;
  name: string;
};

/**
 * Abstraction over user storage so callers can find/save/delete users without
 * knowing about the persistence mechanism.
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updateById(id: string, updates: Partial<User>): Promise<User | null>;
  save(user: User): Promise<User>;
  deleteById(id: string): Promise<void>;
  listAll(): Promise<User[]>;
}
