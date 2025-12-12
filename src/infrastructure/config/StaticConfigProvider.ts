import type { ConfigProvider } from "@/domain/config/ConfigProvider";

export type StaticConfigOptions = {
  values?: Record<string, string | undefined>;
  objects?: Record<string, unknown>;
};

export class StaticConfigProvider implements ConfigProvider {
  private readonly values: Record<string, string>;
  private readonly objects: Record<string, unknown>;

  constructor(options?: StaticConfigOptions) {
    this.values = {};
    this.objects = {};
    if (options?.values) {
      Object.entries(options.values).forEach(([key, value]) => {
        if (value !== undefined) {
          this.values[key.toUpperCase()] = value;
        }
      });
    }
    if (options?.objects) {
      Object.entries(options.objects).forEach(([key, value]) => {
        this.objects[key.toUpperCase()] = value;
      });
    }
  }

  get(key: string): string | undefined {
    return this.values[key.toUpperCase()];
  }

  getNumber(key: string): number | undefined {
    const raw = this.get(key);
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const raw = this.get(key);
    if (raw === undefined) return undefined;
    const normalized = raw.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
    return undefined;
  }

  getObject<T = unknown>(key: string): T | undefined {
    return this.objects[key.toUpperCase()] as T | undefined;
  }
}
