import fs from "fs/promises";
import os from "os";
import path from "path";
import { FileOrdersRepository } from "./FileOrdersRepository";
import { runOrdersRepositoryContract } from "./testing/ordersRepository.contract";

describe("FileOrdersRepository", () => {
  let dir: string;
  let filePath: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "orders-file-"));
    filePath = path.join(dir, "orders.json");
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  runOrdersRepositoryContract("FileOrdersRepository", () => new FileOrdersRepository(filePath));
});
