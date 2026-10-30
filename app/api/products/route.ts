import { NextResponse } from "next/server";
import { getProducts } from "@/lib/inventory";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug"); const products = getProducts();
  if (slug) { const product = products.find(item => item.slug === slug); return product ? NextResponse.json({ product }, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: "Product not found" }, { status: 404 }); }
  return NextResponse.json({ products }, { headers: { "Cache-Control": "no-store" } });
}
