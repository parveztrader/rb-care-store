import { NextResponse } from "next/server";
import { sellSchema } from "@/lib/sell-schema";
import { createSellListing, imageType } from "@/lib/sell-store";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 20 * 1024 * 1024) return NextResponse.json({ error: "Keep the total photo size below 18 MB." }, { status: 413 });
  try {
    const form = await request.formData();
    const raw = Object.fromEntries(form.entries());
    const parsed = sellSchema.safeParse({ ...raw, publishConsent: raw.publishConsent === "true", contactConsent: raw.contactConsent === "true" });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const files = form.getAll("photos");
    if (files.length < 1 || files.length > 6 || files.some(f => !(f instanceof File))) return NextResponse.json({ error: "Please upload between one and six photos." }, { status: 400 });
    const images = [];
    for (const entry of files) {
      const file = entry as File;
      if (!file.size || file.size > 3 * 1024 * 1024) return NextResponse.json({ error: "Each photo must be no larger than 3 MB." }, { status: 400 });
      const data = Buffer.from(await file.arrayBuffer());
      const type = imageType(data);
      if (!type || type !== file.type) return NextResponse.json({ error: "Upload valid JPG, PNG or WebP images only." }, { status: 400 });
      images.push({ data, type });
    }
    const { listing, token } = await createSellListing(parsed.data, images);
    return NextResponse.json({ id: listing.id, token }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Seller request could not be saved", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Your request could not be saved. Try again or call us." }, { status: 500 });
  }
}
