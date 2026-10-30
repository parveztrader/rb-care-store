import { NextResponse } from "next/server";
import { getProducts, addProduct, updateProduct, deleteProduct } from "@/lib/inventory";
import { productInputSchema } from "@/lib/product-details";
import { ZodError } from "zod";

export async function GET() {
  return NextResponse.json({ products: getProducts() });
}

export async function POST(request: Request) {
  try {
    const data = productInputSchema.parse(await request.json());
    const newProduct = addProduct(data);
    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: any) {
    return NextResponse.json({ error: err instanceof ZodError ? err.issues[0].message : err.message || "Failed to add product" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...rawUpdates } = data;
    const updates = productInputSchema.partial().parse(rawUpdates);
    if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    const updated = updateProduct(id, updates);
    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err instanceof ZodError ? err.issues[0].message : err.message || "Failed to update product" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete product" }, { status: 400 });
  }
}
