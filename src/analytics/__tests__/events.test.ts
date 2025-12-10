import { clearEventBuffer, getEventBuffer, trackEvent } from "../events";

describe("trackEvent", () => {
  beforeEach(() => {
    clearEventBuffer();
  });

  it("logs a variety of events without throwing", () => {
    const consoleSpy = jest.spyOn(console, "info").mockImplementation(() => {});

    trackEvent({ type: "view_product", productId: "p-1", source: "shop" });
    trackEvent({
      type: "add_to_cart",
      itemType: "product",
      id: "p-1",
      quantity: 1,
      price: 45,
      source: "shop",
    });
    trackEvent({
      type: "start_checkout",
      subtotal: 90,
      itemCount: 2,
    });

    expect(getEventBuffer().length).toBe(3);
    consoleSpy.mockRestore();
  });
});
