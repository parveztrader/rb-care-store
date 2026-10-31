
import { Localized } from "@/components/Localization";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteChrome } from "@/components/SiteChrome";
import { getSellListings, isPublicListing, publicListing } from "@/lib/sell-store";
import { formatINR } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer Appliances | Used Fridge, Washing Machine & AC | RB Care" };
export default async function CommunityPage() {
  const listings = (await getSellListings()).filter(isPublicListing).map(publicListing);
  return <Localized><SiteChrome><main className="shell sell-page"><p className="breadcrumb"><Link href="/">Home</Link> / Customer appliances</p><div className="community-heading"><div><p className="banner-kicker">USED APPLIANCES IN YOUR CITY</p><h1>Customer appliances</h1><p>Customer-submitted appliances, reviewed by RB Care.</p></div><Link className="btn btn-teal" href="/sell">Sell your appliance</Link></div><p className="community-notice">These are customer-owned units, separate from RB Care&apos;s refurbished stock. Condition details are supplied by the seller. Confirm inspection, availability and warranty before buying.</p>{listings.length ? <div className="community-grid">{listings.map(l => <article className="community-card" key={l.id}><Link href={`/community/${l.id}`}><img src={`/api/sell/photos/${l.photos[0].id}?listing=${l.id}`} alt={`${l.brand} ${l.model} — customer photo`}/></Link><div><span className="guide-label">Customer listing · {l.city}</span><h2><Link href={`/community/${l.id}`}>{l.brand} {l.model}</Link></h2><p>{l.category} · {l.capacity} · {l.age}</p><p>{l.condition}</p><strong>{formatINR(l.teamPrice)} · RB Care team price</strong><Link href={`/community/${l.id}`}>View photos and details ›</Link></div></article>)}</div> : <section className="empty-state"><h2>No customer appliances are listed yet</h2><p>Submit your used washing machine, fridge, AC or microwave. With your consent, approved listings will appear here after RB Care&apos;s review.</p><Link className="btn btn-teal" href="/sell">Submit your appliance</Link></section>}</main></SiteChrome></Localized>;
}
