import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const request = {
  productSlug: "lg-7kg-front-load-washing-machine",
  name: "Aman Khan", phone: "9876543210", email: "aman@example.com",
  address: "12 Example Road, Lucknow", city: "Lucknow", pincode: "226001",
};

describe("unique appliance reservation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("rejects delivery to a different city", async () => {
    const { createPendingOrder } = await import("../lib/orders");
    expect(() => createPendingOrder({ ...request, city: "Mumbai" })).toThrow("Lucknow only");
  });

  it("prevents a second reservation of the same unit", async () => {
    const { createPendingOrder } = await import("../lib/orders");
    createPendingOrder(request);
    expect(() => createPendingOrder(request)).toThrow("being purchased");
  });

  it("expires at the exact deadline and protects a replacement reservation", async () => {
    const { createPendingOrder, markPaid, getOrders } = await import("../lib/orders");
    const old = createPendingOrder(request);
    vi.advanceTimersByTime(12 * 60 * 1000);
    const current = createPendingOrder(request);
    expect(getOrders().find(o => o.orderId === old.orderId)?.status).toBe("CANCELLED");
    expect(() => markPaid(old.orderId, "pay_old")).toThrow();
    expect(() => createPendingOrder(request)).toThrow("being purchased");
    expect(markPaid(current.orderId, "pay_current").status).toBe("PAID");
  });

  it.each(["FAILED", "CANCELLED"] as const)("releases stock when %s", async status => {
    const { createPendingOrder, updateOrderStatus, markPaid } = await import("../lib/orders");
    const old = createPendingOrder(request);
    updateOrderStatus(old.orderId, status);
    const current = createPendingOrder(request);
    expect(() => markPaid(old.orderId, "pay_old")).toThrow();
    expect(markPaid(current.orderId, "pay_current").status).toBe("PAID");
  });

  it("accepts duplicate confirmation only for the same payment", async () => {
    const { createPendingOrder, markPaid } = await import("../lib/orders");
    const pending = createPendingOrder(request);
    const paid = markPaid(pending.orderId, "pay_one");
    expect(markPaid(pending.orderId, "pay_one")).toBe(paid);
    expect(() => markPaid(pending.orderId, "pay_two")).toThrow();
    expect(() => createPendingOrder(request)).toThrow("no longer available");
  });

  it("keeps inventory consistent when an admin marks an order paid", async () => {
    const { createPendingOrder, updateOrderStatus } = await import("../lib/orders");
    const pending = createPendingOrder(request);
    updateOrderStatus(pending.orderId, "PAID");
    expect(() => createPendingOrder(request)).toThrow("no longer available");
    expect(() => updateOrderStatus(pending.orderId, "PENDING")).toThrow("completed order");
  });

  it("rejects invalid statuses without changing the order", async () => {
    const { createPendingOrder, updateOrderStatus, getOrders } = await import("../lib/orders");
    const pending = createPendingOrder(request);
    expect(() => updateOrderStatus(pending.orderId, "UNKNOWN" as never)).toThrow("Invalid order status");
    expect(() => updateOrderStatus(pending.orderId, "PAID", "UNKNOWN" as never)).toThrow("Invalid delivery status");
    expect(getOrders().find(o => o.orderId === pending.orderId)?.status).toBe("PENDING");
  });
});
