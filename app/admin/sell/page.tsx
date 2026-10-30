"use client";
import { Localized } from "@/components/Localization";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SellListing } from "@/lib/sell-store";
type Listing = Omit<SellListing, "tokenHash">;
function PrivatePhoto({ photo, listing, accessKey }: { photo: string; listing: string; accessKey: string }) {
  const [source, setSource] = useState(""); const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true; let objectUrl = "";
    fetch(`/api/sell/photos/${photo}?listing=${listing}`, { headers: { Authorization: `Bearer ${accessKey}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(blob => { objectUrl = URL.createObjectURL(blob); if (active) setSource(objectUrl); else URL.revokeObjectURL(objectUrl); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [photo, listing, accessKey]);
  return <Localized>{source ? <a href={source} target="_blank" rel="noreferrer"><img src={source} alt="Customer appliance; open full photo"/></a> : <span>{failed ? "Photo could not load" : "Loading photo…"}</span>}</Localized>;
}
function Review({ listing, accessKey, onSaved }: { listing: Listing; accessKey: string; onSaved: (listing: Listing) => void }) {
  const [price, setPrice] = useState(String(listing.teamPrice || ""));
  const [note, setNote] = useState(listing.ownerNote); const [status, setStatus] = useState(listing.status);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => {
    setPrice(String(listing.teamPrice || ""));
    setNote(listing.ownerNote); setStatus(listing.status);
  }, [listing.updatedAt, listing.teamPrice, listing.ownerNote, listing.status]);
  return <Localized><article className="owner-listing" id={`request-${listing.id}`}><div className="owner-listing-heading"><div><span className="guide-label">{listing.status} · {new Date(listing.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</span><h2 translate="no">{listing.brand} {listing.model}</h2><p>{listing.category} · {listing.capacity} · {listing.age}</p></div><span>{listing.city} · {listing.pincode}</span></div><div className="owner-photo-grid">{listing.photos.map(photo => <PrivatePhoto key={photo.id} photo={photo.id} listing={listing.id} accessKey={accessKey}/>)}</div><div className="owner-review-grid"><section><h3>Seller & condition</h3><p><strong translate="no">{listing.name}</strong> · <a href={`tel:+91${listing.phone}`}>{listing.phone}</a></p><p>{listing.area}, {listing.city} · {listing.pincode}</p><p><strong>Working:</strong> {listing.condition}</p><p className="seller-description">{listing.description}</p><p><strong>Repairs:</strong> {listing.repairs || "Not supplied"}</p><p><strong>Public listing consent:</strong> {listing.publishConsent ? "Yes" : "No — valuation only"}</p><p className="field-help">ID: {listing.id}</p></section><form onSubmit={async e => {
    e.preventDefault(); setBusy(true); setMessage("");
    try { const response = await fetch("/api/admin/sell", { method: "PATCH", headers: { Authorization: `Bearer ${accessKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ id: listing.id, status, teamPrice: Number(price), ownerNote: note }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); onSaved(data.listing); setMessage("Saved. The customer can view this update on their private tracking link."); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Could not save review."); } finally { setBusy(false); }
  }}><h3>Your valuation & decision</h3><div className="sell-fields"><label className="wide">Team-approved price (₹)<input type="number" min={0} max={1000000} step={1} value={price} onChange={e => setPrice(e.target.value)} required={["QUOTED", "PUBLISHED"].includes(status)}/><small>Only this price is shown to the customer. Pending listings have no price.</small></label><label className="wide">Status<select value={status} onChange={e => setStatus(e.target.value as Listing["status"])}><option value="NEW">New / pending review</option><option value="QUOTED">Send team rate — keep listing private</option><option value="PUBLISHED" disabled={!listing.publishConsent || !["QUOTED", "PUBLISHED"].includes(listing.status)}>Publish customer listing (after sending rate)</option><option value="CLOSED">Closed / sold / withdrawn</option><option value="REJECTED">Declined</option></select></label><label className="wide">Message to customer (visible on tracking page)<textarea rows={3} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder="Explain inspection conditions, pickup or next steps."/></label></div><button className="btn btn-teal" disabled={busy}>{busy ? "Saving…" : "Save team rate & status"}</button>{message && <p role="status" className="owner-message">{message}</p>}{listing.status === "PUBLISHED" && <Link href={`/community/${listing.id}`} target="_blank">View public listing ›</Link>}</form></div></article></Localized>;
}
export default function SellAdmin() {
  const [key, setKey] = useState(""); const [activeKey, setActiveKey] = useState(""); const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [filter, setFilter] = useState("ALL");
  const knownIds = useRef(new Set<string>());
  const accessEpoch = useRef(0); const reviewVersion = useRef(0);
  const [notice, setNotice] = useState(""); const [lastSync, setLastSync] = useState("");
  async function load(accessKey: string, background = false) {
    const epoch = accessEpoch.current; const version = reviewVersion.current;
    if (!background) setBusy(true); setError("");
    try { const response = await fetch("/api/admin/sell", { headers: { Authorization: `Bearer ${accessKey}` }, cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); if (epoch !== accessEpoch.current || version !== reviewVersion.current) return; const incoming = data.listings as Listing[]; const added = incoming.filter(item => !knownIds.current.has(item.id)); if (background && added.length) setNotice(`${added.length} new seller requests received. Team review and pricing are pending.`); knownIds.current = new Set(incoming.map(item => item.id)); setListings(incoming); setActiveKey(accessKey); setLastSync(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load seller requests."); } finally { if (!background) setBusy(false); }
  }
  useEffect(() => {
    if (!activeKey) return;
    const timer = window.setInterval(() => { if (!document.hidden) void load(activeKey, true); }, 15000);
    const refreshOnReturn = () => { if (!document.hidden) void load(activeKey, true); };
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refreshOnReturn); };
  }, [activeKey]);
  return <Localized><main className="shell sell-page owner-page"><p className="breadcrumb"><Link href="/admin">Admin</Link> / Seller requests</p><div className="community-heading"><div><p className="banner-kicker">RB CARE · OWNER DESK</p><h1>Seller requests & valuations</h1><p>New request → team review → send team rate → separate publication approval.</p></div><Link className="btn btn-outline" href="/sell">View sell page</Link></div>{!activeKey ? <form className="sell-form owner-login" onSubmit={e => { e.preventDefault(); void load(key); }}><h2>Owner access</h2><label>Owner access key<input type="password" value={key} onChange={e => setKey(e.target.value)} required autoComplete="off"/></label><p className="field-help">Local setup: use the key in .data/sell/admin-token.txt, generated on the first login attempt. Production uses ADMIN_SELL_TOKEN.</p><button className="btn btn-teal" disabled={busy}>{busy ? "Opening…" : "Open seller requests"}</button></form> : <><section className="owner-notifications" aria-label="Seller request notifications"><div role="status" aria-live="polite"><h2>{listings.filter(l => l.status === "NEW").length} pending seller requests</h2><p>{notice || "New requests appear here automatically while this dashboard is open."}</p></div><p className="field-help">Checks every 15 seconds · Last checked: {lastSync}</p>{listings.some(l => l.status === "NEW") && <ul>{listings.filter(l => l.status === "NEW").map(l => <li key={l.id}><a href={`#request-${l.id}`}>{l.brand} {l.model} · {l.city}</a><span>Team rate pending</span></li>)}</ul>}</section><div className="owner-toolbar"><label>Show status<select value={filter} onChange={e => setFilter(e.target.value)}>{["ALL", "NEW", "QUOTED", "PUBLISHED", "CLOSED", "REJECTED"].map(s => <option key={s}>{s}</option>)}</select></label><span>{listings.length} requests · {listings.filter(l => l.status === "NEW").length} awaiting review</span><button className="btn btn-outline" disabled={busy} onClick={() => load(activeKey)}>Refresh</button><button className="btn btn-outline" onClick={() => { accessEpoch.current += 1; setActiveKey(""); setKey(""); setListings([]); setNotice(""); knownIds.current.clear(); }}>Lock</button></div>{listings.filter(l => filter === "ALL" || l.status === filter).map(listing => <Review key={listing.id} listing={listing} accessKey={activeKey} onSaved={updated => { reviewVersion.current += 1; setNotice(updated.status === "QUOTED" ? "The team price is now available on the customer's private tracking page. The listing is still private." : "The team has updated this request."); setListings(current => current.map(item => item.id === updated.id ? updated : item)); }}/>)}{!listings.some(l => filter === "ALL" || l.status === filter) && <div className="empty-state"><h2>No requests in this view</h2><p>New customer submissions will appear here after you refresh.</p></div>}</>}{error && <p className="sell-error" role="alert">{error}</p>}</main></Localized>;
}
