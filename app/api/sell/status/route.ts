import { NextResponse } from "next/server";
import { getSellListing, tokenMatches } from "@/lib/sell-store";
export async function GET(request: Request) {
  const listing = await getSellListing(new URL(request.url).searchParams.get("id") || "");
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!listing || !tokenMatches(token, listing.tokenHash)) return NextResponse.json({ error: "The tracking link is invalid. Check your saved link." }, { status: 404 });
  return NextResponse.json({ id: listing.id, brand: listing.brand, model: listing.model, status: listing.status,
    teamPrice: listing.status === "NEW" ? 0 : listing.teamPrice, ownerNote: listing.ownerNote,
    updatedAt: listing.updatedAt }, { headers: { "Cache-Control": "no-store" } });
}
