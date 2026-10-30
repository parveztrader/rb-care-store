"use client";
import { Localized } from "@/components/Localization";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteChrome } from "@/components/SiteChrome";
import { formatINR } from "@/lib/catalog";
type Result = { id: string; brand: string; model: string; status: string; teamPrice: number; ownerNote: string; updatedAt: string };
const statuses: Record<string, string> = { NEW: "Team review pending — your listing is private", QUOTED: "Your team price is ready — the listing is still private", PUBLISHED: "Your listing is now published", CLOSED: "This request has been closed", REJECTED: "We cannot proceed with this request at present" };
export default function TrackingPage() {
  const [result, setResult] = useState<Result | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(true);
  async function load() {
    setBusy(true); setError("");
    try {
      const [id, key] = window.location.hash.slice(1).split(":");
      if (!id || !key) throw new Error("Open the complete private tracking link you received after submitting your request.");
      const response = await fetch(`/api/sell/status?id=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
      const data = await response.json(); if (!response.ok) throw new Error(data.error); setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load the request status."); } finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  return <Localized><SiteChrome><main className="shell sell-page"><section className="sell-form tracking-card"><p className="banner-kicker">YOUR PRIVATE REQUEST</p><h1>View your team's price</h1>{busy && <p role="status">Loading request status…</p>}{error && <p className="sell-error" role="alert">{error}</p>}{result && <><h2 translate="no">{result.brand} {result.model}</h2><p className="sell-status">{statuses[result.status]}</p><p className="field-help">Request ID: {result.id}</p>{result.teamPrice > 0 && <div className="valuation-box"><span>Price approved by the RB Care team</span><strong>{formatINR(result.teamPrice)}</strong><p>This price was set by the RB Care team after review. See the team's message for any inspection or pickup conditions.</p></div>}{result.ownerNote && <div className="seller-note"><h3>Message from RB Care</h3><p translate="no">{result.ownerNote}</p></div>}{result.status === "PUBLISHED" && <Link href={`/community/${result.id}`}>View your published listing ›</Link>}<p className="field-help">Last updated: {new Date(result.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p></>}<div className="sell-form-actions"><button className="btn btn-outline" onClick={load} disabled={busy}>Refresh request status</button><a className="btn btn-teal" href="tel:+918503939715">Call RB Care</a></div></section></main></SiteChrome></Localized>;
}
