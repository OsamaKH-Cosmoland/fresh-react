import fs from "fs";
import { fileURLToPath } from "url";
import type { ConfigProvider } from "@/domain/config/ConfigProvider";
import { getLogger } from "@/logging/globalLogger";

const sanitizeString = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const BOOLEAN_TRUE = new Set(["true", "1", "yes", "on"]);
const BOOLEAN_FALSE = new Set(["false", "0", "no", "off"]);

const resolveEnvCandidates = (key: string): string[] => {
  const normalized = key.toUpperCase();
  return [normalized, `VITE_${normalized}`, `REACT_APP_${normalized}`, `NG_${normalized}`];
};

const TELEGRAM_CONFIG_FILE = new URL("../../../config/telegram.config.json", import.meta.url);
const ORDERS_FALLBACK_FILE = new URL("../../../config/orders-fallback.json", import.meta.url);
export const DEFAULT_ORDERS_FALLBACK_PATH = fileURLToPath(ORDERS_FALLBACK_FILE);

export type EnvConfigProviderOptions = {
  env?: Record<string, string | undefined>;
  jsonFiles?: Record<string, URL>;
  pathFiles?: Record<string, URL>;
};

export class EnvConfigProvider implements ConfigProvider {
  private readonly env: Record<string, string | undefined>;
  private readonly overrideStrings = new Map<string, string>();
  private readonly objectStore = new Map<string, unknown>();
  private readonly pathStore = new Map<string, string>();

  constructor(options?: EnvConfigProviderOptions) {
    this.env = options?.env ?? process.env;
    const jsonFiles: Record<string, URL> = {
      TELEGRAM_CONFIG: TELEGRAM_CONFIG_FILE,
      ...(options?.jsonFiles ?? {}),
    };
    const pathFiles: Record<string, URL> = {
      ORDERS_FALLBACK_PATH: ORDERS_FALLBACK_FILE,
      ...(options?.pathFiles ?? {}),
    };

    Object.entries(jsonFiles).forEach(([key, url]) => {
      const parsed = this.loadJsonFile(url);
      if (parsed) {
        this.objectStore.set(key.toUpperCase(), parsed);
        if (key === "TELEGRAM_CONFIG") {
          const token =
            this.lookupFromObject(parsed, ["botToken", "token", "telegramBotToken", "telegram_bot_token"]);
          const chatId =
            this.lookupFromObject(parsed, ["chatId", "telegramChatId", "telegram_chat_id", "chat_id"]);
          if (token) {
            this.overrideStrings.set("TELEGRAM_BOT_TOKEN", token);
          }
          if (chatId) {
            this.overrideStrings.set("TELEGRAM_CHAT_ID", chatId);
          }
        }
      }
    });

    Object.entries(pathFiles).forEach(([key, url]) => {
      try {
        const pathValue = fileURLToPath(url);
        this.pathStore.set(key.toUpperCase(), pathValue);
      } catch (error) {
        // ignore invalid paths
      }
    });
  }

  get(key: string): string | undefined {
    const normalized = key.toUpperCase();
    const override = this.overrideStrings.get(normalized);
    if (override !== undefined) {
      return override;
    }
    const envValue = this.resolveEnvValue(normalized);
    if (envValue !== undefined) {
      return envValue;
    }
    return this.pathStore.get(normalized);
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
    if (BOOLEAN_TRUE.has(normalized)) return true;
    if (BOOLEAN_FALSE.has(normalized)) return false;
    return undefined;
  }

  getObject<T = unknown>(key: string): T | undefined {
    return this.objectStore.get(key.toUpperCase()) as T | undefined;
  }

  private resolveEnvValue(key: string): string | undefined {
    for (const candidate of resolveEnvCandidates(key)) {
      const value = sanitizeString(this.env[candidate]);
      if (value !== undefined) {
        return value;
      }
    }
    return undefined;
  }

  private lookupFromObject(obj: any, keys: string[]): string | undefined {
    for (const key of keys) {
      if (obj && typeof obj === "object" && Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = sanitizeString(obj[key]);
        if (value) return value;
      }
    }
    return undefined;
  }

  private loadJsonFile(fileUrl: URL): unknown | undefined {
    try {
      const filepath = fileURLToPath(fileUrl);
      if (!fs.existsSync(filepath)) return undefined;
      const raw = fs.readFileSync(filepath, "utf8");
      if (!raw.trim()) return undefined;
      return JSON.parse(raw);
    } catch (error) {
      getLogger().warn("[config] failed to load JSON config file", { file: fileUrl.href, error });
      return undefined;
    }
  }
}
