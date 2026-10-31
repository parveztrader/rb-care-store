import { randomBytes, randomUUID, createHash, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { SellInput, reviewSchema } from "./sell-schema";
import { z } from "zod";

// Persistent local storage. Deploy with a persistent disk; see docs/selling.md.
const root = process.env.SELL_DATA_DIR || path.join(process.cwd(), ".data", "sell");
const records = path.join(root, "records");
const photos = path.join(root, "photos");
export type SellPhoto = { id: string; type: string };
export type SellListing = SellInput & {
  id: string; createdAt: string; updatedAt: string; tokenHash: string;
  photos: SellPhoto[]; status: "NEW" | "QUOTED" | "PUBLISHED" | "CLOSED" | "REJECTED";
  teamPrice: number; ownerNote: string;
};
const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
export function tokenMatches(token: string, expected: string) {
  const a = Buffer.from(hash(token)); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function init() { await Promise.all([mkdir(records, { recursive: true }), mkdir(photos, { recursive: true })]); }
async function save(listing: SellListing) {
  await init();
  const temporary = path.join(records, `${listing.id}.${randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify(listing), { mode: 0o600 });
  await rename(temporary, path.join(records, `${listing.id}.json`));
}
export async function getSellListing(id: string): Promise<SellListing | null> {
  if (!validId(id)) return null;
  try {
    const stored = JSON.parse(await readFile(path.join(records, `${id}.json`), "utf8"));
    // Old draft expectations and ranges must never become a team-approved price.
    const { expectedPrice, valuationMin, valuationMax, ...listing } = stored;
    return { ...listing, teamPrice: Number.isInteger(listing.teamPrice) ? listing.teamPrice : 0 };
  }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
export async function getSellListings() {
  await init();
  const files = (await readdir(records)).filter(f => f.endsWith(".json"));
  const list = await Promise.all(files.map(file => getSellListing(file.slice(0, -5))));
  return list.filter((v): v is SellListing => !!v).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function publicListing(listing: SellListing) {
  if (!isPublicListing(listing)) throw new Error("Listing is awaiting team approval.");
  return {
    id: listing.id, category: listing.category, brand: listing.brand, model: listing.model,
    capacity: listing.capacity, age: listing.age, condition: listing.condition,
    description: listing.description, repairs: listing.repairs, city: listing.city,
    teamPrice: listing.teamPrice, photos: listing.photos, createdAt: listing.createdAt,
  };
}
export function isPublicListing(listing: SellListing) {
  return listing.status === "PUBLISHED" && listing.publishConsent && listing.teamPrice > 0;
}
export async function createSellListing(input: SellInput, files: { data: Buffer; type: string }[]) {
  await init();
  const token = randomBytes(32).toString("hex");
  const listing: SellListing = { ...input, id: randomUUID(), tokenHash: hash(token),
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), photos: [],
    status: "NEW", teamPrice: 0, ownerNote: "" };
  try {
    for (const file of files) {
      const photo = { id: randomUUID(), type: file.type };
      await writeFile(path.join(photos, photo.id), file.data, { mode: 0o600 });
      listing.photos.push(photo);
    }
    await save(listing);
    return { listing, token };
  } catch (error) {
    await Promise.all(listing.photos.map(photo => rm(path.join(photos, photo.id), { force: true })));
    throw error;
  }
}
export async function reviewSellListing(input: z.infer<typeof reviewSchema>) {
  const listing = await getSellListing(input.id);
  if (!listing) throw new Error("Listing not found");
  if (input.status === "PUBLISHED" && !listing.publishConsent) throw new Error("Seller has not agreed to a public listing.");
  if (input.status === "PUBLISHED" && !["QUOTED", "PUBLISHED"].includes(listing.status)) throw new Error("Send the customer the team price first. The listing stays private until then.");
  const updated = { ...listing, ...input, teamPrice: input.status === "NEW" ? 0 : input.teamPrice, updatedAt: new Date().toISOString() };
  await save(updated);
  return updated;
}
export async function getSellPhoto(id: string) {
  if (!validId(id)) return null;
  try { return await readFile(path.join(photos, id)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
export function imageType(data: Buffer): string | null {
  if (data.length < 12) return null;
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
  if (data.toString("ascii",0,4) === "RIFF" && data.toString("ascii",8,12) === "WEBP") return "image/webp";
  return null;
}
export async function adminAuthorized(request: Request) {
  let secret = process.env.ADMIN_SELL_TOKEN;
  if (!secret && process.env.NODE_ENV !== "production") {
    await init();
    const filename = path.join(root, "admin-token.txt");
    try { await writeFile(filename, randomBytes(32).toString("hex"), { flag: "wx", mode: 0o600 }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
    secret = (await readFile(filename, "utf8")).trim();
  }
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  return !!secret && tokenMatches(supplied, hash(secret));
}
