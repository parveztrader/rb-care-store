import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getProducts as seeds } from "../lib/catalog";
import { parsePhotoLines, parseSpecifications, productInputSchema, productPhotos, productSpecifications } from "../lib/product-details";
let directory: string;
beforeAll(async () => { directory = await mkdtemp(path.join(os.tmpdir(), "rbcare-product-test-")); vi.stubEnv("PRODUCT_DATA_FILE", path.join(directory, "inventory.json")); });
afterAll(async () => { vi.unstubAllEnvs(); if (directory && path.dirname(path.resolve(directory)) === path.resolve(os.tmpdir()) && path.basename(directory).startsWith("rbcare-product-test-")) await rm(directory, { recursive: true, force: true }); });
describe("detailed appliance inventory", () => {
  it("parses photo views and technical specifications without losing URL or value content", () => {
    expect(parsePhotoLines("Front view | https://example.com/front.jpg\nhttps://example.com/back.jpg")).toEqual([{ label: "Front view", url: "https://example.com/front.jpg" }, { label: "Product photo", url: "https://example.com/back.jpg" }]);
    expect(parseSpecifications("Dimensions: 60 x 55 x 85 cm\nPower: See label: 230 V")[1]).toEqual({ label: "Power", value: "See label: 230 V" });
    expect(() => parseSpecifications("Dimensions missing separator")).toThrow("Label: Value");
  });
  it("validates gallery limits and rejects executable URLs", () => {
    const base = { ...seeds()[0], photos: [{ label: "Front view", url: "https://example.com/front.jpg" }], photoSource: "ACTUAL" };
    expect(productInputSchema.safeParse(base).success).toBe(true);
    expect(productInputSchema.safeParse({ ...base, photos: [{ label: "Front", url: "javascript:alert(1)" }] }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, photos: Array.from({ length: 11 }, () => base.photos[0]) }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, price: -1 }).success).toBe(false);
  });
  it("does not invent specifications or duplicate photos to fill a gallery", () => {
    const product = { ...seeds()[0], color: undefined, photos: undefined };
    expect(productSpecifications(product).find(row => row.label === "Color")?.value).toBe("Not provided");
    expect(productPhotos(product)).toHaveLength(1);
    expect(productPhotos({ ...product, photos: [{ url: product.image, label: "Front" }, { url: product.image, label: "Duplicate" }] })).toHaveLength(1);
  });
  it("persists detailed admin edits across module reloads and exposes them to checkout", async () => {
    const inventory = await import("../lib/inventory");
    const product = inventory.getProducts()[0];
    inventory.updateProduct(product.id, { description: "Test unit description", photos: [{ label: "Actual front", url: "https://example.com/actual.jpg" }], photoSource: "ACTUAL", included: ["Drain hose"], color: "White", specifications: [{ label: "Dimensions", value: "Verified test value" }] });
    vi.resetModules();
    const reloaded = await import("../lib/inventory");
    const saved = reloaded.getProducts().find(item => item.id === product.id)!;
    expect(saved.description).toBe("Test unit description"); expect(saved.photos?.[0].label).toBe("Actual front"); expect(saved.included).toEqual(["Drain hose"]);
    expect(saved.image).toBe(saved.photos?.[0].url);
    const api = await import("../app/api/products/route");
    const response = await api.GET(new Request(`http://localhost/api/products?slug=${product.slug}`));
    expect((await response.json()).product.specifications[0].value).toBe("Verified test value");
    expect((await api.GET(new Request("http://localhost/api/products?slug=missing"))).status).toBe(404);
  });
});
