"use client";
import { Localized } from "@/components/Localization";

import Link from "next/link";
import { LanguageToggle } from "@/components/Localization";
import { CartProvider, useCart } from "@/context/CartContext";
const categories = ["Washing Machine", "Refrigerator", "Air Conditioner", "Microwave"];
function Header() {
  const { cartCount } = useCart();
  return <Localized><header className="store-header">
    <div className="utility-bar"><div className="shell utility-inner"><span>RB Care · 2nd hand appliances · Lucknow & Gonda</span><a href="https://rbcareservice.in">Appliance repair services</a><LanguageToggle compact/></div></div>
    <div className="shell store-masthead">
      <Link href="/" className="store-brand"><span className="store-monogram">RB</span><span><strong>RB Care Service</strong><small>Home Appliance Store</small></span></Link>
      <form action="/products" className="store-search" role="search"><input name="q" aria-label="Search appliances" placeholder="Search appliances, brands or models" type="search"/><button type="submit">Search</button></form>
      <a className="store-phone" href="tel:+918503939715"><small>Call for assistance</small><strong>08503939715</strong></a>
      <Link href="/cart" className="store-cart">Cart ({cartCount})</Link>
    </div>
    <nav className="store-nav" aria-label="Main navigation"><div className="shell"><Link href="/products">Buy appliances</Link><Link href="/sell" className="sell-nav-link">Sell your appliance</Link><Link href="/community">Customer appliances</Link>{categories.map(c=><Link key={c} href={`/products?category=${encodeURIComponent(c)}`}>{c === "Microwave" ? "Microwaves" : c + "s"}</Link>)}<Link href="/bulk">Bulk enquiry</Link><Link href="/contact">Contact us</Link></div></nav>
  </header></Localized>;
}
export function SiteChrome({children}:{children:React.ReactNode}) {
  return <Localized><CartProvider><Header/>{children}<footer className="footer"><div className="shell"><div className="footer-grid">
    <div><h3>RB Care Service</h3><p className="footer-brand-desc">Second-hand washing machines, fridges, used ACs and microwaves. Understand the condition, price and warranty before buying.</p><a href="https://rbcareservice.in">Visit our service website</a></div>
    <div><h3 className="footer-col-title">Shop appliances</h3><ul className="footer-links">{categories.map(c=><li key={c}><Link href={`/products?category=${encodeURIComponent(c)}`}>{c}</Link></li>)}</ul></div>
    <div><h3 className="footer-col-title">Customer help</h3><ul className="footer-links"><li><Link href="/sell">Sell your old appliance</Link></li><li><Link href="/community">Customer appliances</Link></li><li><Link href="/faq">Frequently asked questions</Link></li><li><Link href="/policies/warranty">Warranty policy</Link></li><li><Link href="/policies/delivery">Shipping policy</Link></li><li><Link href="/contact">Contact us</Link></li></ul></div>
    <div><h3 className="footer-col-title">Contact RB Care</h3><p>Lucknow, Uttar Pradesh</p><p><a href="tel:+918503939715">08503939715</a></p><p><Link href="/bulk">Business &amp; bulk enquiries</Link></p></div>
    </div><div className="footer-bottom"><span>© 2026 RB Care Service</span><span>2nd hand / Used appliances · Lucknow & Gonda</span></div></div></footer></CartProvider></Localized>;
}




