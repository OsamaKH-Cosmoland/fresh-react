import crypto from "crypto";
import type { IdGenerator } from "../../domain/shared/IdGenerator";

const randomString = () => {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  }
  return crypto.randomBytes(9).toString("base64url").toUpperCase();
};

export class DefaultIdGenerator implements IdGenerator {
  constructor(private readonly prefix = "ID") {}

  nextId(): string {
    return `${this.prefix}-${randomString()}`;
  }
}
