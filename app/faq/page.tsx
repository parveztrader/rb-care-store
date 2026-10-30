
import { Localized } from "@/components/Localization";
import { SiteChrome } from "@/components/SiteChrome";

const FAQS = [
  {
    cat: "Products & Quality",
    icon: "🔧",
    items: [
      { q: "Are the appliances tested before delivery?", a: "Every unit passes a 40-point diagnostic — motor, compressor, cooling coils, electronics and finish. Nothing ships without a green light from our senior technician. We strip the appliance down, restore it, and stress-test it under load before listing." },
      { q: "What brands do you carry?", a: "We stock Godrej, Samsung, LG, Whirlpool, Voltas, Haier, IFB, Bosch, Panasonic and Bluestar across all categories including washing machines, ACs, refrigerators and microwaves." },
      { q: "Are these appliances genuine or assembled locally?", a: "All appliances are genuine OEM units — original branded appliances that have been returned, traded in, or sourced from verified channels. We do not deal in assembled or counterfeit goods." },
      { q: "How old are the appliances typically?", a: "Most units are 1–4 years old. Each product listing mentions the approximate age. You'll always know exactly what you're buying." },
    ]
  },
  {
    cat: "Warranty & Support",
    icon: "🛡️",
    items: [
      { q: "What warranty do you offer?", a: "All appliances come with a 6-month parts and labour warranty from the date of delivery. You can extend this to 24 months at the time of checkout for a small additional fee." },
      { q: "What does the warranty cover?", a: "The warranty covers verified functional faults — if a covered component fails under normal use, we fix or replace it at no cost. It does not cover physical damage, power surge damage, or misuse." },
      { q: "How do I claim warranty service?", a: "WhatsApp us at 08503939715 with your order ID and a short video of the issue. A technician will be assigned within 24 hours for in-home repair." },
      { q: "Do you offer Annual Maintenance Contracts (AMC)?", a: "Yes! After your warranty expires, you can opt for our AMC which includes 2 free servicing visits per year and priority support. Contact us for pricing." },
    ]
  },
  {
    cat: "Delivery & Installation",
    icon: "🚚",
    items: [
      { q: "Do you deliver across India?", a: "We currently deliver to Lucknow, Mumbai, Pune, and Gonda. Our technicians handle delivery and installation personally — we don't use third-party couriers for appliances." },
      { q: "How long does delivery take?", a: "Most orders are delivered within 2–5 business days depending on your city. Same-week delivery is available in Lucknow and Gonda in most cases." },
      { q: "Is installation included?", a: "Yes! Free installation by our certified RB Care technicians is included with every appliance. For ACs, we include installation up to a standard single-unit setup." },
      { q: "Can I inspect the appliance before accepting delivery?", a: "Absolutely. Our delivery technician will demonstrate the appliance functioning before you sign off. You can refuse delivery if the unit doesn't match the listing description." },
    ]
  },
  {
    cat: "Orders & Payments",
    icon: "💳",
    items: [
      { q: "What payment methods do you accept?", a: "We accept all major payment methods including UPI, credit/debit cards, net banking and EMI through Razorpay. We do not accept cash on delivery." },
      { q: "Is online payment safe?", a: "Completely. All payments are processed through Razorpay, a PCI-DSS compliant payment gateway. Your card details are never stored on our servers." },
      { q: "Can I cancel my order after placing it?", a: "Yes, within 24 hours of placing your order. After that, the unit may already be prepped for delivery. Contact us via WhatsApp immediately if you need to cancel." },
      { q: "What is your return policy?", a: "We accept returns within 7 days of delivery if the appliance has a verified functional defect that we cannot resolve. Cosmetic issues mentioned in the listing are not grounds for return." },
    ]
  },
  {
    cat: "Trade-in & Bulk",
    icon: "🔄",
    items: [
      { q: "Can I trade in my old appliance?", a: "Yes! Contact us via WhatsApp or the bulk enquiry form. Our team will assess your old appliance remotely (via photos/video) and offer a trade-in value that you can use against your purchase." },
      { q: "Do you offer bulk pricing for businesses?", a: "Yes. Hotels, hostels, offices, PG owners and landlords can contact us for bulk pricing on 10+ units. We offer significant discounts, priority delivery and extended warranties on bulk orders." },
    ]
  }
];

export default function FAQPage() {
  return <Localized><SiteChrome>
      <main>
        {/* Hero */}
        <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", padding: "56px 0 40px" }}>
          <div className="shell" style={{ maxWidth: "780px" }}>
            <div className="section-eyebrow">Help Centre</div>
            <h1 style={{ fontSize: "clamp(2.2rem,4vw,3.2rem)", fontWeight: 700, letterSpacing: "-1.5px", marginBottom: "12px" }}>
              Frequently asked questions.
            </h1>
            <p style={{ color: "var(--ink-muted)", fontSize: "1rem", lineHeight: "1.7" }}>
              Everything you need to know about our refurbished appliances, delivery, warranty and support. Can&apos;t find the answer? <a href="/#contact" style={{ color: "var(--teal)", fontWeight: 700 }}>Contact us directly →</a>
            </p>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="shell section" style={{ maxWidth: "860px" }}>
          {FAQS.map((section) => (
            <div key={section.cat} style={{ marginBottom: "48px" }}>
              {/* Section header */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", paddingBottom: "16px", borderBottom: "2px solid var(--teal)" }}>
                <span style={{ fontSize: "1.4rem" }}>{section.icon}</span>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.3px", color: "var(--ink)", margin: 0 }}>{section.cat}</h2>
              </div>

              {/* Q&A items */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {section.items.map((item, i) => (
                  <details key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <summary style={{
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      listStyle: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "18px 0",
                      color: "var(--ink)",
                      userSelect: "none",
                    }}>
                      <span>{item.q}</span>
                      <span style={{ fontSize: "1.2rem", fontWeight: 300, color: "var(--ink-muted)", marginLeft: "16px", flexShrink: 0, lineHeight: 1 }}>+</span>
                    </summary>
                    <p style={{ margin: "0 0 18px", color: "var(--ink-muted)", lineHeight: 1.8, fontSize: "0.92rem", maxWidth: "680px" }}>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}

          {/* Still need help */}
          <div style={{
            background: "var(--dark-bg)",
            borderRadius: "3px",
            padding: "40px 36px",
            textAlign: "center",
            marginTop: "16px"
          }}>
            <h2 style={{ color: "white", fontSize: "1.5rem", fontWeight: 700, marginBottom: "8px", letterSpacing: "-0.5px" }}>Still have questions?</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.92rem", marginBottom: "24px" }}>Our team responds within 2 hours on WhatsApp.</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="btn btn-teal btn-lg">💬 WhatsApp Us</a>
              <a href="tel:+918503939715" className="btn btn-outline-white btn-lg">📞 Call Now</a>
            </div>
          </div>
        </div>
      </main>
    </SiteChrome></Localized>;
}


