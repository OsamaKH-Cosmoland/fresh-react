// File-based orders repository used as a local fallback cache.
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { Order } from "../../domain/shared/Order";
import type { OrdersRepository } from "./OrdersRepository";
import type { Clock } from "../../domain/shared/Clock";
import type { IdGenerator } from "../../domain/shared/IdGenerator";
import { InMemoryOrdersRepository } from "./InMemoryOrdersRepository";
import { DefaultIdGenerator } from "../ids/DefaultIdGenerator";
import { SystemClock } from "../time/SystemClock";

const FALLBACK_LIMIT = 500;
const READONLY_FS_ERROR_CODES = new Set(["EACCES", "EPERM", "EROFS", "ENOSPC"]);

const ensureDir = async (filepath: string) => {
  const dir = path.dirname(filepath);
  await fs.mkdir(dir, { recursive: true });
};

const cloneOrder = (order: Order): Order => JSON.parse(JSON.stringify(order));

export class FileOrdersRepository implements OrdersRepository {
  constructor(
    private filePath: string,
    private readonly idGenerator: IdGenerator = new DefaultIdGenerator("NG"),
    private readonly clock: Clock = new SystemClock()
  ) {}

  private async readAll(): Promise<Order[]> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      if (!raw.trim()) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Order[]) : [];
    } catch (error: any) {
      if (error && error.code === "ENOENT") return [];
      console.warn("[orders:fallback] failed to read cache file", error);
      return [];
    }
  }

  private async writeAll(orders: Order[]) {
    await ensureDir(this.filePath);
    const trimmed = orders.slice(-FALLBACK_LIMIT);
    await fs.writeFile(this.filePath, JSON.stringify(trimmed, null, 2), "utf8");
  }

  async list(limit = 50): Promise<Order[]> {
    const orders = await this.readAll();
    const sorted = orders
      .slice()
      .sort(
        (a, b) =>
          new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime()
      );
    return sorted.slice(0, limit);
  }

  async findRecentCashOrderByPhone(phone: string, sinceIso: string | Date): Promise<Order | null> {
    const orders = await this.readAll();
    const since = new Date(sinceIso).getTime();
    return (
      orders.find(
        (order) =>
          order?.paymentMethod === "cash_on_delivery" &&
          (order?.customer?.phone ?? "") === phone &&
          new Date(order?.createdAt ?? 0).getTime() >= since
      ) ?? null
    );
  }

  async create(doc: Order): Promise<Order> {
    const orders = await this.readAll();
    const stored = cloneOrder({ ...doc, id: doc.id || this.idGenerator.nextId() });
    orders.push(stored);
    await this.writeAll(orders);
    return stored;
  }

  async updateStatus(id: string, status: string): Promise<Order | null> {
    const orders = await this.readAll();
    const index = orders.findIndex((order) => order?.id === id);
    if (index === -1) return null;
    const updated = {
      ...orders[index],
      status,
      updatedAt: this.clock.now().toISOString(),
    };
    orders[index] = updated;
    await this.writeAll(orders);
    return updated;
  }
}

export class ReadonlyGuardRepository implements OrdersRepository {
  private active: OrdersRepository;
  private type: "file" | "memory" = "file";

  constructor(
    private readonly fileRepo: FileOrdersRepository,
    private readonly memoryRepo: InMemoryOrdersRepository
  ) {
    this.active = fileRepo;
  }

  private isReadonlyFsError(error: any) {
    return READONLY_FS_ERROR_CODES.has(error?.code);
  }

  private async switchToMemory(error: any) {
    if (this.type === "memory") throw error;
    console.warn(
      `[orders:fallback] write failed (${error?.code ?? error}). Switching to in-memory store.`
    );
    const existing = await this.fileRepo["readAll"]().catch(() => [] as Order[]);
    const memorySnapshot = this.memoryRepo.snapshot();
    const seen = new Set(existing.map((order) => order?.id).filter(Boolean));
    for (const order of memorySnapshot) {
      if (!seen.has(order?.id)) {
        existing.push(order);
        if (order?.id) seen.add(order.id);
      }
    }
    this.memoryRepo.replaceAll(existing);
    this.active = this.memoryRepo;
    this.type = "memory";
  }

  private withGuard<T extends keyof OrdersRepository>(method: T) {
    return async (...args: Parameters<OrdersRepository[T]>) => {
      try {
        const fn = this.active[method] as any;
        return await fn.apply(this.active, args);
      } catch (error: any) {
        if (this.active === this.fileRepo && this.isReadonlyFsError(error)) {
          await this.switchToMemory(error);
          const fn = this.active[method] as any;
          return fn.apply(this.active, args);
        }
        throw error;
      }
    };
  }

  list = this.withGuard("list");
  findRecentCashOrderByPhone = this.withGuard("findRecentCashOrderByPhone");
  create = this.withGuard("create");
  updateStatus = this.withGuard("updateStatus");
}

export const fallbackFilePath = fileURLToPath(
  new URL("../../../config/orders-fallback.json", import.meta.url)
);
