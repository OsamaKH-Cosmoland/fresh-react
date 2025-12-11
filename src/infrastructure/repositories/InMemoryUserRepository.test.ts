import type { UserRepository, User } from '../../domain/users/UserRepository';
import { buildTestUserRepository, InMemoryUserRepository } from './InMemoryUserRepository';

let repo: UserRepository;

beforeEach(() => {
  repo = new InMemoryUserRepository();
});

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

describe('InMemoryUserRepository', () => {
  it('returns the saved user when fetched by id', async () => {
    const user: User = { id: 'u1', email: 'user@example.com', name: 'Test User' };
    await repo.save(user);
    const result = await repo.findById(user.id);
    expect(result).toEqual(user);
  });

  it('returns null when the id is missing', async () => {
    const result = await repo.findById('missing');
    expect(result).toBeNull();
  });

  it('returns the saved user when fetched by email', async () => {
    const user: User = { id: 'u2', email: 'other@example.com', name: 'Other' };
    await repo.save(user);
    const result = await repo.findByEmail(user.email);
    expect(result).toEqual(user);
  });

  it('returns null when the email is missing', async () => {
    const result = await repo.findByEmail('nope@example.com');
    expect(result).toBeNull();
  });

  it('removes a user when deleteById is called', async () => {
    const user: User = { id: 'u3', email: 'delete@example.com', name: 'To Delete' };
    await repo.save(user);
    await repo.deleteById(user.id);
    const result = await repo.findById(user.id);
    expect(result).toBeNull();
  });

  it('does not throw when deleting a non-existent user', async () => {
    await expect(repo.deleteById('missing')).resolves.toBeUndefined();
  });

  describe('listAll()', () => {
    it('returns an empty array when no users are saved', async () => {
      const list = await repo.listAll();
      expect(list).toEqual([]);
    });

    it('returns the single saved user', async () => {
      const user: User = { id: 'l1', email: 'list1@example.com', name: 'List One' };
      await repo.save(user);
      const list = await repo.listAll();
      expect(list).toEqual([user]);
    });

    it('returns all saved users in insertion order', async () => {
      const users: User[] = [
        { id: 'l2', email: 'list2@example.com', name: 'List Two' },
        { id: 'l3', email: 'list3@example.com', name: 'List Three' },
      ];
      await Promise.all(users.map((user) => repo.save(user)));
      const list = await repo.listAll();
      expect(list).toEqual(users);
    });
  });
});
