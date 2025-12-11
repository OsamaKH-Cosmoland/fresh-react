import fs from "fs";
import https from "https";
import { fileURLToPath } from "url";
import type { NotificationContext, NotificationService } from "../../domain/shared/NotificationService";

type TelegramConfig = { token: string; chatId: string };

const sanitizeString = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const resolveFromCandidates = (...values: string[]) => {
  for (const value of values) {
    const cleaned = sanitizeString(value);
    if (cleaned) return cleaned;
  }
  return "";
};

const postJson = async (url: string, payload: unknown) => {
  if (typeof fetch === "function") {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  const target = new URL(url);
  const bodyString = JSON.stringify(payload);

  return new Promise<{ ok: boolean; status: number; statusText: string; text: () => Promise<string> }>((resolve, reject) => {
    const request = https.request(
      {
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyString),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString();
          resolve({
            ok: !!(response.statusCode && response.statusCode >= 200 && response.statusCode < 300),
            status: response.statusCode ?? 0,
            statusText: response.statusMessage ?? "",
            text: async () => text,
          });
        });
      }
    );

    request.on("error", reject);
    request.write(bodyString);
    request.end();
  });
};

/**
 * Sends notifications to Telegram using the Bot API, loading credentials from env/config.
 */
export class TelegramNotificationService implements NotificationService {
  private cachedConfig: TelegramConfig | null = null;

  constructor(private readonly logger: Pick<Console, "warn" | "error" | "log"> = console) {}

  private loadTelegramConfigFile() {
    try {
      const configPath = new URL("../../../config/telegram.config.json", import.meta.url);
      const resolvedPath = fileURLToPath(configPath);
      if (!fs.existsSync(resolvedPath)) return {};
      const raw = fs.readFileSync(resolvedPath, "utf8");
      if (!raw.trim()) return {};
      const parsed = JSON.parse(raw);
      return {
        token: sanitizeString(parsed.botToken ?? parsed.token ?? parsed.telegramBotToken),
        chatId: sanitizeString(parsed.chatId ?? parsed.telegramChatId ?? parsed.telegram_chat_id),
      };
    } catch (error) {
      this.logger.warn("[telegram] failed to read telegram.config.json", error);
      return {};
    }
  }

  private getConfig(): TelegramConfig {
    if (this.cachedConfig) return this.cachedConfig;

    const envToken = resolveFromCandidates(
      process.env.TELEGRAM_BOT_TOKEN || "",
      process.env.VITE_TELEGRAM_BOT_TOKEN || "",
      process.env.REACT_APP_TELEGRAM_BOT_TOKEN || "",
      process.env.NG_TELEGRAM_BOT_TOKEN || ""
    );
    const envChat = resolveFromCandidates(
      process.env.TELEGRAM_CHAT_ID || "",
      process.env.VITE_TELEGRAM_CHAT_ID || "",
      process.env.REACT_APP_TELEGRAM_CHAT_ID || "",
      process.env.NG_TELEGRAM_CHAT_ID || ""
    );

    if (envToken && envChat) {
      this.cachedConfig = { token: envToken, chatId: envChat };
      return this.cachedConfig;
    }

    const fileConfig = this.loadTelegramConfigFile();
    this.cachedConfig = {
      token: envToken || (fileConfig as any).token || "",
      chatId: envChat || (fileConfig as any).chatId || "",
    };
    return this.cachedConfig;
  }

  async notify(recipient: string, message: string, context?: NotificationContext): Promise<void> {
    const { token, chatId: defaultChat } = this.getConfig();
    const chatId = sanitizeString(context?.recipients?.telegram ?? (recipient || defaultChat));

    if (!token || !chatId) {
      throw Object.assign(new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars."), { code: "MISSING_TELEGRAM_CONFIG" });
    }

    this.logger.log(`[telegram] notifying ${chatId}`);
    if (typeof fetch !== "function") {
      this.logger.warn("[telegram] global fetch unavailable; using https fallback");
    }

    const body = {
      chat_id: chatId,
      text: message,
      disable_web_page_preview: true,
    };

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await postJson(url, body);
    if (!res.ok) {
      const textBody = await res.text().catch(() => "");
      const error = new Error(textBody || res.statusText || "Telegram request failed");
      throw Object.assign(error, { status: res.status });
    }
  }
}
