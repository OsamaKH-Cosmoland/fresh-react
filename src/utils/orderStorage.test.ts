import {
  ORDER_STORAGE_KEY,
  addOrder,
  readOrders,
  writeOrders,
} from "@/utils/orderStorage";
import { getLogger, setLogger } from "@/logging/globalLogger";
import { TestLogger } from "@/infrastructure/logging/TestLogger";
import type { CartItem } from "@/cart/cartStore";
import type { LocalOrder } from "@/types/localOrder";

const sampleItem: CartItem = {
  id: "item-1",
  name: "Sample Product",
  price: 120,
  quantity: 1,
};

const createOrder = (overrides?: Partial<LocalOrder>): LocalOrder => ({
  id: overrides?.id ?? "order-1",
  createdAt: new Date().toISOString(),
  items: overrides?.items ?? [sampleItem],
  totals: {
    subtotal: 120,
    shippingCost: 10,
    total: 130,
    currency: "EGP",
  },
  customer: {
    name: "Test",
    email: "test@example.com",
  },
  shippingAddress: {
    country: "EG",
    city: "Cairo",
    street: "123 Street",
    postalCode: "12345",
  },
  shippingMethod: {
    id: "ship-1",
    label: "Standard",
    description: "Standard shipping",
    eta: "3-5 days",
    cost: 10,
  },
  paymentSummary: {
    methodLabel: "Card",
    status: "paid",
  },
  ...overrides,
});

describe("orderStorage helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty array when no orders stored or malformed data present", () => {
    expect(readOrders()).toEqual([]);
    window.localStorage.setItem(ORDER_STORAGE_KEY, "broken-json");
    expect(readOrders()).toEqual([]);
  });

  it("logs a warning when stored data is malformed", () => {
    const originalLogger = getLogger();
    const logger = new TestLogger();
    setLogger(logger);
    try {
      window.localStorage.setItem(ORDER_STORAGE_KEY, "not-json");
      const result = readOrders();
      expect(result).toEqual([]);
      expect(logger.getEntries().some((entry) => entry.message.includes("Failed to parse saved orders"))).toBe(true);
    } finally {
      setLogger(originalLogger);
    }
  });

  it("writeOrders and readOrders keep orders stored", () => {
    const order = createOrder();
    writeOrders([order]);
    const stored = readOrders();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(order.id);
  });

  it("addOrder saves the new order at the front of the list", () => {
    const existing = createOrder({ id: "order-old" });
    writeOrders([existing]);
    const newOrder = createOrder({ id: "order-new" });
    const returned = addOrder(newOrder);
    expect(returned).toEqual(newOrder);
    const stored = readOrders();
    expect(stored[0].id).toBe("order-new");
    expect(stored[1].id).toBe("order-old");
  });
});
