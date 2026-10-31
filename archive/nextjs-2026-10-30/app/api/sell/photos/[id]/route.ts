import { adminAuthorized, getSellListing, getSellPhoto, isPublicListing, tokenMatches } from "@/lib/sell-store";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const listing = await getSellListing(url.searchParams.get("listing") || "");
  const photo = listing?.photos.find(p => p.id === id);
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!listing || !photo || !isPublicListing(listing) &&
      !tokenMatches(token, listing.tokenHash) && !await adminAuthorized(request)) return new Response("Not found", { status: 404 });
  const data = await getSellPhoto(id);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), { headers: { "Content-Type": photo.type, "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'" } });
}
