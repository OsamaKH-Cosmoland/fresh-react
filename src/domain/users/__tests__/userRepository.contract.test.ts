import type { User, UserRepository } from "@/domain/users/UserRepository";
import { InMemoryUserRepository } from "@/infrastructure/repositories/InMemoryUserRepository";

type RepositoryFactory = {
  name: string;
  create(): UserRepository;
};

const implementations: RepositoryFactory[] = [
  { name: "InMemoryUserRepository", create: () => new InMemoryUserRepository() },
];

const buildUser = (id: string, overrides?: Partial<User>): User => ({
  id,
  email: `${id}@example.com`,
  name: `User ${id}`,
  ...overrides,
});

implementations.forEach(({ name, create }) => {
  describe(`${name} contract`, () => {
    let repo: UserRepository;

    beforeEach(() => {
      repo = create();
    });

    it("starts empty", async () => {
      await expect(repo.listAll()).resolves.toEqual([]);
    });

    it("saves and finds a user by id", async () => {
      const user = buildUser("save-1");
      await repo.save(user);
      await expect(repo.findById(user.id)).resolves.toEqual(user);
    });

    it("returns null when finding by unknown id", async () => {
      await expect(repo.findById("missing")).resolves.toBeNull();
    });

    it("saves and finds a user by email", async () => {
      const user = buildUser("save-2");
      await repo.save(user);
      await expect(repo.findByEmail(user.email)).resolves.toEqual(user);
    });

    it("returns null when finding by unknown email", async () => {
      await expect(repo.findByEmail("missing@example.com")).resolves.toBeNull();
    });

    it("updates an existing user via updateById", async () => {
      const user = buildUser("update-by-id");
      await repo.save(user);
      const updates = { name: "Updated Name" };
      const updated = await repo.updateById(user.id, updates);
      expect(updated).toEqual(expect.objectContaining({ ...user, ...updates }));
      await expect(repo.findById(user.id)).resolves.toEqual(expect.objectContaining({ ...user, ...updates }));
    });

    it("returns null when updating a missing user", async () => {
      await expect(repo.updateById("missing", { name: "Nope" })).resolves.toBeNull();
    });

    it("updates an existing user when saving with the same id", async () => {
      const user = buildUser("updatable");
      await repo.save(user);
      const updated = { ...user, name: "Updated Name" };
      const saved = await repo.save(updated);
      expect(saved.name).toBe("Updated Name");
      await expect(repo.findById(user.id)).resolves.toEqual(expect.objectContaining({ name: "Updated Name" }));
    });

    it("removes users when deleteById is invoked", async () => {
      const user = buildUser("delete-me");
      await repo.save(user);
      await repo.deleteById(user.id);
      await expect(repo.findById(user.id)).resolves.toBeNull();
    });

    it("ignores delete calls for missing ids", async () => {
      await expect(repo.deleteById("missing")).resolves.toBeUndefined();
    });

    it("listAll returns all stored users", async () => {
      const users = [buildUser("list1"), buildUser("list2")];
      await Promise.all(users.map((user) => repo.save(user)));
      const listed = await repo.listAll();
      expect(listed).toHaveLength(users.length);
      expect(listed).toEqual(expect.arrayContaining(users));
    });
  });
});
