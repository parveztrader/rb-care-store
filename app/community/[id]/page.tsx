
import { Localized } from "@/components/Localization";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/SiteChrome";
import { getSellListing, isPublicListing, publicListing } from "@/lib/sell-store";
import { formatINR } from "@/lib/catalog";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const item = await getSellListing((await params).id);
  if (!item || !isPublicListing(item)) return { title: "Listing unavailable | RB Care", robots: { index: false } };
  return { title: `${item.brand} ${item.model} — Used ${item.category} in ${item.city} | RB Care`, description: `Customer-owned ${item.category}, ${item.capacity}, ${item.age}. View seller photos and condition details; enquire through RB Care.` };
}
export default async function CommunityDetail({ params }: { params: Promise<{ id: string }> }) {
  const listing = await getSellListing((await params).id);
  if (!listing || !isPublicListing(listing)) notFound();
  const item = publicListing(listing);
  const enquiry = `Hello RB Care, I would like information about customer listing ${item.id} (${item.brand} ${item.model}) please.`;
  return <Localized><SiteChrome><main className="shell sell-page"><p className="breadcrumb"><Link href="/community">Customer appliances</Link> / {item.brand} {item.model}</p><p className="community-notice">Customer-owned used appliance · Seller-reported condition · RB Care stock warranty is not included.</p><div className="community-detail"><div className="community-photos">{item.photos.map((photo, i) => <a key={photo.id} href={`/api/sell/photos/${photo.id}?listing=${item.id}`} target="_blank" rel="noreferrer"><img src={`/api/sell/photos/${photo.id}?listing=${item.id}`} alt={`${item.brand} ${item.model}, seller photo ${i + 1}`}/></a>)}</div><section><p className="banner-kicker">CUSTOMER LISTING · {item.city}</p><h1 translate="no">{item.brand} {item.model}</h1><p className="community-price">{formatINR(item.teamPrice)}</p><p className="field-help">Price approved by the RB Care team. Confirm availability and pickup details with RB Care.</p><dl className="detail-specs"><div><dt>Appliance</dt><dd>{item.category}</dd></div><div><dt>Capacity</dt><dd>{item.capacity}</dd></div><div><dt>Age</dt><dd>{item.age}</dd></div><div><dt>Condition</dt><dd>{item.condition}</dd></div><div><dt>City</dt><dd>{item.city}</dd></div></dl><h2>Seller's description</h2><p className="seller-description">{item.description}</p>{item.repairs && <><h3>Repair and replacement history</h3><p className="seller-description">{item.repairs}</p></>}<a className="btn btn-teal" href={`https://wa.me/918503939715?text=${encodeURIComponent(enquiry)}`} target="_blank" rel="noreferrer">Enquire about this appliance with RB Care</a><p className="field-help">The seller's phone number is private. Confirm inspection, payment and pickup arrangements with RB Care first.</p></section></div></main></SiteChrome></Localized>;
}

