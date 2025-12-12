import type { User } from '../../domain/users/UserRepository';
import { buildTestUserRepository } from './InMemoryUserRepository';

describe('buildTestUserRepository', () => {
  it('pre-loads the repository with the provided users', async () => {
    const seededUser: User = { id: 's1', email: 'seed@example.com', name: 'Seed' };
    const seededRepo = buildTestUserRepository([seededUser]);
    const result = await seededRepo.findById(seededUser.id);
    expect(result).toEqual(seededUser);
  });

  it('does not share references with the seed data array', async () => {
    const seededUsers: User[] = [{ id: 's2', email: 'copy@example.com', name: 'Copy' }];
    const seededRepo = buildTestUserRepository(seededUsers);
    seededUsers[0].name = 'Mutated';
    const result = await seededRepo.findById('s2');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Copy');
  });
});
