import type { IdGenerator } from "../../domain/shared/IdGenerator";
import { createFakeIdGenerator } from "../../domain/shared/fakeId";

export class FakeIdGenerator implements IdGenerator {
  private readonly next: () => string;

  constructor(prefix = "ID", startAt = 1) {
    this.next = createFakeIdGenerator(prefix, startAt);
  }

  nextId(): string {
    return this.next();
  }
}
