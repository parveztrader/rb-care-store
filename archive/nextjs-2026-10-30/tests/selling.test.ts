import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

let directory: string;
let create: typeof import("../app/api/sell/route");
let admin: typeof import("../app/api/admin/sell/route");
let status: typeof import("../app/api/sell/status/route");
let photo: typeof import("../app/api/sell/photos/[id]/route");
let store: typeof import("../lib/sell-store");
const token = "owner-test-secret-please-do-not-use";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY5kAAAAASUVORK5CYII=", "base64");
const fields = { category: "Refrigerator", brand: "Test brand", model: "Test 190L", capacity: "190 litres", age: "3–5 years", condition: "Working with issues", description: "Cooling works but door seal needs repair.", repairs: "No previous repairs", expectedPrice: "5000", name: "Test Seller", phone: "9876543210", city: "Gonda", area: "Test area", pincode: "271001", publishConsent: "true", contactConsent: "true" };
function submission(overrides: Record<string, string> = {}, bytes = png, mime = "image/png") {
  const body = new FormData();
  Object.entries({ ...fields, ...overrides }).forEach(([key, value]) => body.set(key, value));
  body.append("photos", new Blob([bytes], { type: mime }), "photo.png");
  return new Request("http://localhost/api/sell", { method: "POST", body });
}
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
beforeAll(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "rbcare-selling-test-"));
  vi.stubEnv("SELL_DATA_DIR", directory); vi.stubEnv("ADMIN_SELL_TOKEN", token);
  create = await import("../app/api/sell/route"); admin = await import("../app/api/admin/sell/route");
  status = await import("../app/api/sell/status/route"); photo = await import("../app/api/sell/photos/[id]/route");
  store = await import("../lib/sell-store");
});
afterAll(async () => {
  vi.unstubAllEnvs();
  if (directory && path.dirname(path.resolve(directory)) === path.resolve(os.tmpdir()) && path.basename(directory).startsWith("rbcare-selling-test-")) await rm(directory, { recursive: true, force: true });
});
describe("customer selling workflow", () => {
  it("rejects invalid seller data and forged image uploads", async () => {
    expect((await create.POST(submission({ phone: "123" }))).status).toBe(400);
    expect((await create.POST(submission({}, Buffer.from("not an image at all")))).status).toBe(400);
    expect((await create.POST(submission({}, png, "image/jpeg"))).status).toBe(400);
    expect((await create.POST(submission({ contactConsent: "false" }))).status).toBe(400);
  });
  it("persists a request, protects private details and photos, and publishes only after owner review", async () => {
    const response = await create.POST(submission({ teamPrice: "99999", status: "PUBLISHED" })); expect(response.status).toBe(201);
    const receipt = await response.json();
    const listing = (await store.getSellListing(receipt.id))!;
    expect(listing.status).toBe("NEW"); expect(listing.phone).toBe(fields.phone);
    expect(listing.teamPrice).toBe(0);
    expect(listing).not.toHaveProperty("expectedPrice");
    expect(() => store.publicListing(listing)).toThrow("awaiting team approval");
    const dashboard = await (await admin.GET(new Request("http://localhost/api/admin/sell", { headers }))).json();
    expect(dashboard.notifications.some((n: { id: string }) => n.id === listing.id)).toBe(true);
    expect(listing.tokenHash).not.toBe(receipt.token);
    const imageUrl = `http://localhost/api/sell/photos/${listing.photos[0].id}?listing=${listing.id}`;
    const params = { params: Promise.resolve({ id: listing.photos[0].id }) };
    expect((await admin.GET(new Request("http://localhost/api/admin/sell"))).status).toBe(401);
    expect((await status.GET(new Request(`http://localhost/api/sell/status?id=${listing.id}`))).status).toBe(404);
    expect((await photo.GET(new Request(imageUrl), params)).status).toBe(404);
    expect((await photo.GET(new Request(imageUrl, { headers }), params)).status).toBe(200);
    const review = { id: listing.id, status: "QUOTED", teamPrice: 3500, ownerNote: "Team rate after review." };
    expect((await admin.PATCH(new Request("http://localhost/api/admin/sell", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(review) }))).status).toBe(401);
    expect((await admin.PATCH(new Request("http://localhost/api/admin/sell", { method: "PATCH", headers, body: JSON.stringify({ ...review, status: "PUBLISHED" }) }))).status).toBe(400);
    expect((await admin.PATCH(new Request("http://localhost/api/admin/sell", { method: "PATCH", headers, body: JSON.stringify({ ...review, teamPrice: 0 }) }))).status).toBe(400);
    expect((await admin.PATCH(new Request("http://localhost/api/admin/sell", { method: "PATCH", headers, body: JSON.stringify(review) }))).status).toBe(200);
    const own = await status.GET(new Request(`http://localhost/api/sell/status?id=${listing.id}`, { headers: { Authorization: `Bearer ${receipt.token}` } }));
    expect((await own.json()).teamPrice).toBe(3500);
    const reviewedDashboard = await (await admin.GET(new Request("http://localhost/api/admin/sell", { headers }))).json();
    expect(reviewedDashboard.notifications.some((n: { id: string }) => n.id === listing.id)).toBe(false);
    // Sending a rate does not publish the listing or photos.
    expect((await photo.GET(new Request(imageUrl), params)).status).toBe(404);
    expect((await admin.PATCH(new Request("http://localhost/api/admin/sell", { method: "PATCH", headers, body: JSON.stringify({ ...review, status: "PUBLISHED" }) }))).status).toBe(200);
    expect((await photo.GET(new Request(imageUrl), params)).status).toBe(200);
    const published = store.publicListing((await store.getSellListing(listing.id))!);
    for (const key of ["phone", "name", "area", "pincode", "tokenHash", "ownerNote", "valuationMin"]) expect(published).not.toHaveProperty(key);
    expect(published.teamPrice).toBe(3500);
    expect(published).not.toHaveProperty("expectedPrice");
    expect((await admin.PATCH(new Request("http://localhost/api/admin/sell", { method: "PATCH", headers, body: JSON.stringify({ ...review, status: "CLOSED" }) }))).status).toBe(200);
    expect((await photo.GET(new Request(imageUrl), params)).status).toBe(404);
  });
  it("blocks publication when the seller opted for valuation only", async () => {
    const receipt = await (await create.POST(submission({ publishConsent: "false" }))).json();
    const response = await admin.PATCH(new Request("http://localhost/api/admin/sell", { method: "PATCH", headers, body: JSON.stringify({ id: receipt.id, status: "PUBLISHED", teamPrice: 2500, ownerNote: "" }) }));
    expect(response.status).toBe(400);
    expect((await store.getSellListing(receipt.id))!.status).toBe("NEW");
  });
});
