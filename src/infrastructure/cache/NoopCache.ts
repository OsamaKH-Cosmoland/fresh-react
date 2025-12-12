import type { Cache } from "@/domain/cache/Cache";

export class NoopCache implements Cache {
  get<T>(_key: string): T | undefined {
    return undefined;
  }

  set<T>(_key: string, _value: T, _ttlMs?: number): void {
    // noop
  }

  delete(_key: string): void {
    // noop
  }

  clear(): void {
    // noop
  }
}
