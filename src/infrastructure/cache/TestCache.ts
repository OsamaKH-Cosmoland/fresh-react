import type { Cache } from "@/domain/cache/Cache";

export class TestCache implements Cache {
  private readonly entries = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.entries.get(key) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.entries.set(key, value);
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}
