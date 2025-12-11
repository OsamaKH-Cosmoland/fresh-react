export type User = {
  id: string;
  email: string;
  name: string;
};

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  deleteById(id: string): Promise<void>;
}
