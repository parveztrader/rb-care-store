
import { Localized } from "@/components/Localization";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteChrome } from "@/components/SiteChrome";
import { SellForm } from "@/components/SellForm";
export const metadata: Metadata = { title: "Sell Your Appliance | Washing Machine, Fridge & AC | RB Care", description: "Sell used appliances in Lucknow, Gonda and nearby towns. Submit photos and condition details to receive a price from the RB Care team." };
export default function SellPage() {
  return <Localized><SiteChrome><main className="shell sell-page">
    <p className="breadcrumb"><Link href="/">Home</Link> / Apna appliance bechein</p>
    <section className="sell-hero"><div><p className="banner-kicker">OLD APPLIANCES · NEW HOMES</p><h1>Your old appliance,<br/>a useful addition to another home.</h1><p>Selling a used washing machine, fridge, AC or microwave? Submit its details and photos. The RB Care team will review it and provide a price.</p><a className="btn btn-teal" href="#sell-form">Enter appliance details ↓</a></div><aside><strong>A price based on your appliance</strong><p>The RB Care team will price your appliance after reviewing its brand, age, condition and photos. Until then, your listing stays pending and private.</p><a href="tel:+918503939715">Need help? Call 08503939715</a></aside></section>
    <ol className="sell-process"><li><b>01</b><span><strong>Share appliance details</strong>What appliance is it, and how old?</span></li><li><b>02</b><span><strong>Condition and photos</strong>Tell us honestly about any problems.</span></li><li><b>03</b><span><strong>Get a price from our team</strong>View the team's price on your tracking page.</span></li></ol>
    <div className="sell-layout"><SellForm/><aside className="sell-sidebar"><h2>How to photograph your appliance</h2><ul><li>A clear front view of the whole appliance.</li><li>The inside and side panels.</li><li>The model label, with personal details hidden.</li><li>Close-ups of scratches, dents or damaged parts.</li></ul><h2>When will your listing be visible?</h2><p>Submit your details to notify our team. The team will provide a price, then separately approve publication under Customer Appliances. Your name, phone number and exact address stay private.</p><p>This is a customer's used appliance. RB Care stock warranties do not automatically apply.</p><Link href="/community">Browse customer appliances ›</Link><hr/><h2>In Lucknow, Gonda or a nearby town?</h2><p>Share your town and PIN code. Confirm pickup, inspection and charges with our team by phone.</p><a href="tel:+918503939715">Call: 08503939715</a></aside></div>
  </main></SiteChrome></Localized>;
}
