import type { ConfigProvider } from "@/domain/config/ConfigProvider";
import type { FeatureFlagProvider } from "@/domain/config/FeatureFlagProvider";

const DEFAULT_TRUE = new Set(["true", "1", "yes", "on"]);
const DEFAULT_FALSE = new Set(["false", "0", "no", "off"]);

const normalizeFlag = (flagName: string) => {
  const upper = flagName.toUpperCase();
  return upper.startsWith("FEATURE_") ? upper : `FEATURE_${upper}`;
};

export type SimpleFeatureFlagOptions = {
  overrides?: Record<string, boolean>;
  defaults?: Record<string, boolean>;
};

export class SimpleFeatureFlagProvider implements FeatureFlagProvider {
  private readonly overrides: Record<string, boolean>;
  private readonly defaults: Record<string, boolean>;

  constructor(
    private readonly configProvider: ConfigProvider,
    options?: SimpleFeatureFlagOptions
  ) {
    this.overrides = {};
    this.defaults = {};
    if (options?.overrides) {
      Object.entries(options.overrides).forEach(([key, value]) => {
        this.overrides[normalizeFlag(key)] = value;
      });
    }
    if (options?.defaults) {
      Object.entries(options.defaults).forEach(([key, value]) => {
        this.defaults[normalizeFlag(key)] = value;
      });
    }
  }

  async isEnabled(flagName: string, context?: Record<string, unknown>): Promise<boolean> {
    const normalized = normalizeFlag(flagName);
    if (normalized in this.overrides) {
      return this.overrides[normalized];
    }
    const contextOverride = this.resolveContextValue(normalized, flagName, context);
    if (contextOverride !== undefined) {
      return contextOverride;
    }
    const envValue = this.configProvider.get(normalized) ?? this.configProvider.get(flagName);
    if (envValue !== undefined) {
      const parsed = envValue.trim().toLowerCase();
      if (DEFAULT_TRUE.has(parsed)) return true;
      if (DEFAULT_FALSE.has(parsed)) return false;
    }
    if (normalized in this.defaults) {
      return this.defaults[normalized];
    }
    return false;
  }

  private resolveContextValue(
    normalized: string,
    flagName: string,
    context?: Record<string, unknown>,
  ): boolean | undefined {
    if (!context) return undefined;
    const candidates: (Record<string, unknown> | undefined)[] = [
      this.safeRecord(context["featureFlags"]),
      this.safeRecord(context["flags"]),
      this.safeRecord(context),
    ];
    for (const candidate of candidates) {
      if (!candidate) continue;
      for (const key of [normalized, flagName, flagName.toUpperCase(), flagName.toLowerCase()]) {
        if (Object.prototype.hasOwnProperty.call(candidate, key)) {
          const parsed = this.parseContextBoolean(candidate[key]);
          if (parsed !== undefined) {
            return parsed;
          }
        }
      }
    }
    return undefined;
  }

  private safeRecord(value: unknown): Record<string, unknown> | undefined {
    if (value && typeof value === "object") {
      return value as Record<string, unknown>;
    }
    return undefined;
  }

  private parseContextBoolean(value: unknown): boolean | undefined {
    if (typeof value === "boolean") {
      return value;
    }
    const normalized = String(value ?? "").trim().toLowerCase();
    if (DEFAULT_TRUE.has(normalized)) return true;
    if (DEFAULT_FALSE.has(normalized)) return false;
    return undefined;
  }
}
