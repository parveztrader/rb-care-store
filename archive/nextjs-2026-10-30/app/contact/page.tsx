
import { Localized } from "@/components/Localization";
import { SiteChrome } from "@/components/SiteChrome";

export default function ContactPage() {
  return <Localized><SiteChrome>
      <main>
        {/* Hero */}
        <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", padding: "56px 0 40px" }}>
          <div className="shell">
            <div className="section-eyebrow">Get in Touch</div>
            <h1 style={{ fontSize: "clamp(2.2rem,4vw,3.2rem)", fontWeight: 700, letterSpacing: "-1.5px", marginBottom: "12px" }}>
              We&apos;re here to help.
            </h1>
            <p style={{ color: "var(--ink-muted)", fontSize: "1rem", lineHeight: "1.7", maxWidth: "560px" }}>
              Questions about a product? Need a bulk quote? Want to trade in your old appliance? Reach out — our team responds fast.
            </p>
          </div>
        </div>

        <div className="shell section">
          <div style={{ display: "grid", gridTemplateColumns: "var(--contact-columns, 1fr 1.4fr)", gap: "60px", alignItems: "start" }}>

            {/* Left — Contact Info */}
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "24px", letterSpacing: "-0.3px" }}>Contact channels</h2>

              {[
                {
                  icon: "💬",
                  title: "WhatsApp (Fastest)",
                  detail: "08503939715",
                  sub: "Replies within 2 hours · 9am–8pm",
                  href: "https://wa.me/919999999999",
                  cta: "Open WhatsApp →",
                  color: "#25D366"
                },
                {
                  icon: "📞",
                  title: "Phone",
                  detail: "08503939715",
                  sub: "Mon–Sat · 10am–7pm IST",
                  href: "tel:+918503939715",
                  cta: "Call now →",
                  color: "var(--teal)"
                },
                {
                  icon: "📍",
                  title: "Workshop & Showroom",
                  detail: "Uttar Pradesh, India",
                  sub: "Lucknow · Gonda · Mumbai · Pune",
                  href: null,
                  cta: null,
                  color: "var(--ink)"
                },
                {
                  icon: "⏰",
                  title: "Response Time",
                  detail: "Under 2 hours",
                  sub: "WhatsApp · Mon–Sat during business hours",
                  href: null,
                  cta: null,
                  color: "var(--ink)"
                },
              ].map(item => (
                <div key={item.title} style={{
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  padding: "20px 22px",
                  marginBottom: "14px",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                }}>
                  <div style={{ fontSize: "1.4rem", flexShrink: 0, lineHeight: 1, marginTop: "2px" }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--ink-light)", marginBottom: "4px" }}>{item.title}</div>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: item.color, marginBottom: "2px" }}>{item.detail}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--ink-muted)" }}>{item.sub}</div>
                    {item.href && item.cta && (
                      <a href={item.href} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "8px", fontSize: "0.82rem", fontWeight: 700, color: item.color, textDecoration: "underline" }}>
                        {item.cta}
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {/* Serving cities */}
              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--teal)", marginBottom: "10px" }}>Serving cities</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {["Lucknow", "Mumbai", "Pune", "Gonda"].map(city => (
                    <span key={city} style={{
                      background: "var(--teal-light)",
                      color: "var(--teal-dark)",
                      padding: "5px 14px",
                      borderRadius: "3px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                    }}>📍 {city}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Contact Form */}
            <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "3px", padding: "36px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "6px", letterSpacing: "-0.3px" }}>Send us a message</h2>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.88rem", marginBottom: "28px" }}>We&apos;ll get back to you on WhatsApp or call within 2 hours.</p>

              <form action="https://formspree.io/f/contactrbcare" method="POST" style={{ display: "grid", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "var(--form-columns, 1fr 1fr)", gap: "14px" }}>
                  <div className="field">
                    <label>Your Name *</label>
                    <input type="text" name="name" required placeholder="e.g. Ramesh Kumar" />
                  </div>
                  <div className="field">
                    <label>Phone / WhatsApp *</label>
                    <input type="tel" name="phone" required placeholder="+91 9999999999" />
                  </div>
                </div>

                <div className="field">
                  <label>Email Address</label>
                  <input type="email" name="email" placeholder="optional — for invoice copy" />
                </div>

                <div className="field">
                  <label>Your City *</label>
                  <select name="city" required>
                    <option value="">Select city</option>
                    <option>Lucknow</option>
                    <option>Mumbai</option>
                    <option>Pune</option>
                    <option>Gonda</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="field">
                  <label>What can we help with? *</label>
                  <select name="type" required>
                    <option value="">Select topic</option>
                    <option>Product enquiry</option>
                    <option>Order status / tracking</option>
                    <option>Warranty / service request</option>
                    <option>Bulk / B2B quote</option>
                    <option>Trade-in enquiry</option>
                    <option>Something else</option>
                  </select>
                </div>

                <div className="field">
                  <label>Message *</label>
                  <textarea name="message" rows={4} required placeholder="Tell us what appliance you're looking for, or describe your issue..." style={{ resize: "vertical" }} />
                </div>

                <button type="submit" className="btn btn-dark btn-lg" style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}>
                  Send Message →
                </button>
                <p style={{ fontSize: "0.78rem", color: "var(--ink-light)", textAlign: "center" }}>By submitting, you agree to be contacted via WhatsApp or phone.</p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </SiteChrome></Localized>;
}


