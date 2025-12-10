const crypto = require("crypto");

class ObjectId {
  constructor(value) {
    this.value = typeof value === "string" && value.trim().length ? value : ObjectId.generate();
  }

  static isValid(value) {
    return typeof value === "string" && value.length >= 12;
  }

  toString() {
    return this.value;
  }

  static generate() {
    return crypto.randomBytes(12).toString("hex");
  }
}

class Collection {
  constructor() {
    this._store = new Map();
  }

  insertOne(doc) {
    this._store.set(doc._id ?? ObjectId.generate(), { ...doc });
    return { insertedId: doc._id ?? ObjectId.generate() };
  }

  find() {
    return { toArray: async () => Array.from(this._store.values()) };
  }
}

class Db {
  collection() {
    return new Collection();
  }
}

class MongoClient {
  constructor() {
    this._db = new Db();
  }

  db() {
    return this._db;
  }

  async connect() {
    return this;
  }

  async close() {
    return Promise.resolve();
  }
}

module.exports = { ObjectId, Collection, Db, MongoClient };
