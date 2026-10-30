import { z } from "zod";
import type { Product, ProductPhoto } from "./catalog";
const publicImageUrl = z.string().trim().url().max(2000).refine(value => {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}, "Use an HTTP or HTTPS image URL.");
export const productDetailsSchema = z.object({
  photos: z.array(z.object({ url: publicImageUrl, label: z.string().trim().min(1).max(80) })).max(10).optional(),
  photoSource: z.enum(["ACTUAL", "REFERENCE"]).optional(),
  description: z.string().trim().max(4000).optional(),
  highlights: z.array(z.string().trim().min(1).max(300)).max(12).optional(),
  specifications: z.array(z.object({ label: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(300) })).max(30).optional(),
  capacity: z.string().trim().max(80).optional(), color: z.string().trim().max(80).optional(),
  included: z.array(z.string().trim().min(1).max(160)).max(20).optional(),
  packaging: z.string().trim().max(1000).optional(), repairHistory: z.string().trim().max(2000).optional(),
  installation: z.string().trim().max(1000).optional(),
});
export const productInputSchema = z.object({
  name: z.string().trim().min(3).max(200), category: z.enum(["Washing Machine", "Refrigerator", "Air Conditioner", "Microwave"]),
  city: z.enum(["Lucknow", "Gonda", "Mumbai", "Pune"]), stockMode: z.enum(["CITY", "CENTRAL"]),
  condition: z.enum(["Excellent", "Very Good"]), price: z.number().int().positive().max(1000000),
  delivery: z.number().int().min(0).max(100000), warrantyDays: z.number().int().min(0).max(3650),
  brand: z.string().trim().min(1).max(80), model: z.string().trim().min(1).max(100), age: z.string().trim().min(1).max(100),
  defects: z.string().trim().min(1).max(2000), tested: z.array(z.string().trim().min(1).max(100)).max(30),
  image: publicImageUrl, status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]),
}).merge(productDetailsSchema);
export function productPhotos(product: Product): ProductPhoto[] {
  const supplied = product.photos?.length ? product.photos : [{ url: product.image, label: "Overview" }];
  return supplied.filter((photo, i, list) => photo.url && list.findIndex(p => p.url === photo.url) === i);
}
export function productSpecifications(product: Product) {
  const base = [
    { label: "Brand", value: product.brand }, { label: "Model", value: product.model },
    { label: "Appliance", value: product.category }, { label: "Capacity", value: product.capacity || "Not provided" },
    { label: "Color", value: product.color || "Not provided" }, { label: "Age", value: product.age },
    { label: "Condition", value: product.condition }, { label: "Stock ID", value: product.id },
    { label: "Location", value: product.city },
  ];
  return [...base, ...(product.specifications || []).filter(row => !base.some(item => item.label.toLowerCase() === row.label.toLowerCase()))];
}
export function parseDetailLines(text: string) { return text.split("\n").map(line => line.trim()).filter(Boolean); }
export function parseSpecifications(text: string) {
  return parseDetailLines(text).map(line => { const separator = line.indexOf(":"); if (separator < 1 || !line.slice(separator + 1).trim()) throw new Error("Enter each specification as Label: Value."); return { label: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() }; });
}
export function parsePhotoLines(text: string): ProductPhoto[] {
  return parseDetailLines(text).map(line => { const separator = line.indexOf(" | "); return separator < 0 ? { url: line, label: "Product photo" } : { label: line.slice(0, separator).trim(), url: line.slice(separator + 3).trim() }; });
}
