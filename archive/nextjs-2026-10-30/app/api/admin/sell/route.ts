import { NextResponse } from "next/server";
import { adminAuthorized, getSellListings, reviewSellListing } from "@/lib/sell-store";
import { reviewSchema } from "@/lib/sell-schema";
export const runtime = "nodejs";
export async function GET(request: Request) {
  if (!await adminAuthorized(request)) return NextResponse.json({ error: "Enter a valid owner access key." }, { status: 401 });
  const listings = (await getSellListings()).map(({ tokenHash, ...listing }) => listing);
  const notifications = listings.filter(listing => listing.status === "NEW").map(listing => ({
    id: listing.id, title: `${listing.brand} ${listing.model}`, city: listing.city, createdAt: listing.createdAt,
  }));
  return NextResponse.json({ listings, notifications }, { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(request: Request) {
  if (!await adminAuthorized(request)) return NextResponse.json({ error: "Enter a valid owner access key." }, { status: 401 });
  try {
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const { tokenHash, ...listing } = await reviewSellListing(parsed.data);
    return NextResponse.json({ listing });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save review." }, { status: 400 }); }
}
