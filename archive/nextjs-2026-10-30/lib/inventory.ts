import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getProducts as memoryProducts, addProduct as memoryAdd, updateProduct as memoryUpdate, deleteProduct as memoryDelete, type Product } from "./catalog";
// File access stays on the server; client components only import catalog types and formatting.
const file = process.env.PRODUCT_DATA_FILE || path.join(process.cwd(), ".data", "inventory.json");
const persistent = process.env.NODE_ENV !== "test" || !!process.env.PRODUCT_DATA_FILE;
export function getProducts(): Product[] {
  const products = memoryProducts();
  if (persistent && fs.existsSync(file)) {
    const saved = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(saved)) throw new Error("Inventory data is invalid.");
    products.splice(0, products.length, ...saved);
  }
  return products;
}
export function saveInventory() {
  if (!persistent) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try { fs.writeFileSync(temporary, JSON.stringify(memoryProducts()), { mode: 0o600 }); fs.renameSync(temporary, file); }
  catch (error) { try { fs.rmSync(temporary, { force: true }); } catch {} throw error; }
}
function coverImage<T extends Partial<Product>>(input: T): T {
  return input.photos?.length ? { ...input, image: input.photos[0].url } : input;
}
function mutate<T>(operation: () => T): T {
  const before = [...getProducts()];
  try { const result = operation(); saveInventory(); return result; }
  catch (error) { memoryProducts().splice(0, memoryProducts().length, ...before); throw error; }
}
export function addProduct(input: Parameters<typeof memoryAdd>[0]) { return mutate(() => memoryAdd(coverImage(input))); }
export function updateProduct(id: string, input: Partial<Product>) { return mutate(() => memoryUpdate(id, coverImage(input))); }
export function deleteProduct(id: string) { return mutate(() => memoryDelete(id)); }
