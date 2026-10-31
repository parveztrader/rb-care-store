import type { Metadata } from "next";
import { Localized } from "@/components/Localization";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatINR } from "@/lib/catalog";
import { getProducts } from "@/lib/inventory";
import { productPhotos, productSpecifications } from "@/lib/product-details";
import { SiteChrome } from "@/components/SiteChrome";
import { AddToCartActions } from "@/components/AddToCartActions";
import { ProductGallery } from "@/components/ProductGallery";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProducts().find(product => product.slug === slug);
  return p ? { title: `${p.name} | Used in ${p.city} | RB Care`, description: `View ${p.name}, condition ${p.condition}, ${p.age}, ${p.warrantyDays}-day service warranty. Price ${formatINR(p.price)}. Check unit details with RB Care.` } : { title: "Product not found | RB Care" };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const p = getProducts().find(product => product.slug === slug); if (!p) notFound();
  const photos = productPhotos(p); const available = p.status === "AVAILABLE";
  const details = productSpecifications(p);
  const enquiry = `Hello RB Care, please share the actual photos and details for ${p.name} (${p.id}).`;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://store.rbcareservice.in";
  const structuredData = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.id,
    brand: { "@type": "Brand", name: p.brand }, model: p.model,
    ...(p.photoSource === "ACTUAL" ? { image: photos.map(photo => photo.url) } : {}),
    description: p.description || `${p.name}. ${p.age}. Condition: ${p.condition}. ${p.defects}`,
    offers: { "@type": "Offer", priceCurrency: "INR", price: p.price, itemCondition: "https://schema.org/UsedCondition", availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${site}/products/${p.slug}`, seller: { "@type": "Organization", name: "RB Care Service" } },
  };
  return <Localized><SiteChrome><main className="shell product-listing-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}/>
    <p className="breadcrumb"><Link href="/">Home</Link> / <Link href={`/products?category=${encodeURIComponent(p.category)}`}>{p.category}</Link> / {p.name}</p>
    <nav className="product-section-nav" aria-label="Product page sections"><a href="#overview">Overview</a><a href="#condition-report">Condition report</a><a href="#specifications">Specifications</a><a href="#delivery-warranty">Delivery & warranty</a></nav>
    <div className="product-purchase-layout" id="overview">
      <ProductGallery photos={photos} productName={p.name} actual={p.photoSource === "ACTUAL"}/>
      <section className="product-summary"><p className="product-brand-line">{p.brand} · <Link href={`/products?category=${encodeURIComponent(p.category)}`}>{p.category}</Link></p><h1>{p.name}</h1><p className="product-model-line">Model: <span translate="no">{p.model}</span> · Stock ID: <span translate="no">{p.id}</span></p>
        <div className="product-condition-strip"><strong>Used / Refurbished</strong><span>{p.condition}</span><a href="#condition-report">Read the condition report</a></div>
        <p className="product-age-line">{p.age} · {p.city}</p><div className="product-main-price">{formatINR(p.price)}</div><p className="product-price-note">Appliance price. Delivery and installation charges shown separately.</p>
        <dl className="product-quick-facts"><div><dt>Brand</dt><dd>{p.brand}</dd></div><div><dt>Model</dt><dd translate="no">{p.model}</dd></div><div><dt>Capacity</dt><dd>{p.capacity || "Not provided"}</dd></div><div><dt>Color</dt><dd>{p.color || "Not provided"}</dd></div></dl>
        <h2>About this item</h2>{p.description ? <p className="product-description" translate="no">{p.description}</p> : <p>Pre-owned appliance. Review the age, working checks, visible wear and warranty details for this individual unit before buying.</p>}
        <ul className="product-highlights">{p.highlights?.length ? p.highlights.map(point => <li key={point} translate="no">{point}</li>) : <><li>{p.warrantyDays}<span>-day service warranty</span></li><li>Listed condition: <strong>{p.condition}</strong></li><li>Known wear: <span>{p.defects}</span></li></>}</ul>
        <div className="product-test-summary"><h3>Working checks listed for this unit</h3><div>{p.tested.map(test => <span key={test}>{test}</span>)}</div></div>
      </section>
      <aside className="product-buy-box"><span className="buy-box-label">THIS UNIT</span><strong className="buy-box-price">{formatINR(p.price)}</strong><dl><div><dt>Delivery & installation</dt><dd>{formatINR(p.delivery)}</dd></div><div className="buy-box-total"><dt>Total</dt><dd>{formatINR(p.price + p.delivery)}</dd></div></dl><p className={`buy-box-stock ${available ? "in-stock" : ""}`}>{available ? "In stock — one used unit" : p.status}</p><p><strong>Delivery location</strong><br/>{p.stockMode === "CITY" ? p.city : "Supported cities, subject to confirmation"}</p><p className="buy-box-delivery-note">Share your PIN code with RB Care to confirm delivery and installation arrangements.</p><p><strong>Sold and supplied by</strong><br/>RB Care Service</p>{available ? <AddToCartActions product={p}/> : <Link className="btn btn-outline" href="/products">Browse available stock</Link>}<a className="product-enquiry" href={`https://wa.me/918503939715?text=${encodeURIComponent(enquiry)}`} target="_blank" rel="noreferrer">Ask about this unit on WhatsApp</a><a className="product-call" href="tel:+918503939715">Call 08503939715</a></aside>
    </div>
    <section className="product-info-section" id="condition-report"><div className="product-section-heading"><p className="banner-kicker">KNOW EXACTLY WHAT YOU ARE BUYING</p><h2>Condition report for this unit</h2></div><div className="product-condition-grid"><article><h3>Overall condition</h3><strong>{p.condition}</strong><p>{p.age}</p><p>Pre-owned; signs of use may be present.</p></article><article><h3>Visible wear and known issues</h3><p>{p.defects}</p></article><article><h3>Repair history</h3><p translate={p.repairHistory ? "no" : undefined}>{p.repairHistory || "Not provided. Ask RB Care about previous repairs and replaced parts."}</p></article><article><h3>Photos and inspection</h3><p>{p.photoSource === "ACTUAL" ? "The gallery is labelled as photos of this unit. Inspect all views before buying." : "The current gallery contains reference images. Ask for actual unit photos, including any marks or damage."}</p></article></div></section>
    <section className="product-info-section" id="specifications"><div className="product-section-heading"><h2>Product information & technical specifications</h2><p>Specifications apply to the listed model. Missing information is shown clearly.</p></div><div className="product-specification-layout"><dl className="product-specification-table">{details.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl><aside className="product-box-contents"><h3>What&apos;s included</h3>{p.included?.length ? <ul>{p.included.map(item => <li key={item} translate="no">{item}</li>)}</ul> : <p>Accessories have not been specified. Confirm hoses, cables, remotes and other fittings before purchase.</p>}<h3>Packaging</h3><p translate={p.packaging ? "no" : undefined}>{p.packaging || "Original box and packaging have not been confirmed."}</p><p className="field-help">Dimensions, power requirements and energy ratings should be added by the team after checking the model label.</p></aside></div></section>
    <section className="product-info-section" id="delivery-warranty"><div className="product-section-heading"><h2>Delivery, installation & warranty</h2></div><div className="product-service-grid"><article><h3>Delivery & installation</h3><strong>{formatINR(p.delivery)}</strong><p translate={p.installation ? "no" : undefined}>{p.installation || "Confirm access, floor/lift details and installation requirements with RB Care before ordering."}</p><Link href="/policies/delivery">Read delivery policy</Link></article><article><h3>Service warranty</h3><strong>{p.warrantyDays}<span>-day service warranty</span></strong><p>Read the warranty coverage and exclusions for verified functional faults.</p><Link href="/policies/warranty">Read warranty policy</Link></article><article><h3>Returns and support</h3><p>Check return eligibility, cancellation terms and the process for reporting a functional issue.</p><Link href="/policies/returns">Read returns policy</Link></article></div></section>
  </main></SiteChrome></Localized>;
}
