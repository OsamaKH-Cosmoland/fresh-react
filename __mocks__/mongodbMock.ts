import { randomBytes } from "crypto";

export class ObjectId {
  value: string;

  constructor(value?: string) {
    this.value = value && value.trim().length ? value : ObjectId.generate();
  }

  static isValid(value?: string): boolean {
    return typeof value === "string" && value.length >= 12;
  }

  toString() {
    return this.value;
  }

  static generate(): string {
    return randomBytes(12).toString("hex");
  }
}

export class Collection {
  private readonly store = new Map<string, unknown>();

  insertOne(doc: { _id?: string }) {
    const id = doc._id ?? ObjectId.generate();
    this.store.set(id, { ...doc, _id: id });
    return { insertedId: id };
  }

  find() {
    return {
      toArray: async () => Array.from(this.store.values()),
    };
  }
}

export class Db {
  collection() {
    return new Collection();
  }
}

export class MongoClient {
  private clientDb: Db | null = null;

  async connect() {
    this.clientDb ??= new Db();
    return this;
  }

  db() {
    if (!this.clientDb) {
      this.clientDb = new Db();
    }
    return this.clientDb;
  }

  async close() {
    this.clientDb = null;
  }
}
