"use client";
import { Localized } from "@/components/Localization";


import { FormEvent, Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteChrome } from "@/components/SiteChrome";
import { cities, formatINR, type Product } from "@/lib/catalog";

function CheckoutForm() {
  const query = useSearchParams();
  const productSlug = query.get("product");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  useEffect(() => {
    let active = true; setProductLoading(true); setSelectedProduct(null);
    if (!productSlug) { setProductLoading(false); return; }
    fetch(`/api/products?slug=${encodeURIComponent(productSlug)}`, { cache: "no-store" }).then(async response => { if (!response.ok) return null; return (await response.json()).product; }).then(product => { if (active) setSelectedProduct(product); }).catch(() => {}).finally(() => { if (active) setProductLoading(false); });
    return () => { active = false; };
  }, [productSlug]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(720); // 12 minutes countdown

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (productLoading) return <Localized><main className="shell section"><h1>Loading product details…</h1></main></Localized>;
  if (!selectedProduct) {
    return <Localized><main className="shell section" style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>⚠️</div>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "12px" }}>Product Not Found</h1>
        <p style={{ color: "var(--ink-muted)", marginBottom: "24px" }}>
          The appliance you selected is no longer available or was removed.
        </p>
        <Link href="/products" className="btn btn-dark btn-lg">
          Browse Available Stock →
        </Link>
      </main></Localized>;
  }

  const grandTotal = selectedProduct.price + selectedProduct.delivery;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        ...Object.fromEntries(formData),
        productSlug: selectedProduct.slug,
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout order.");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to begin checkout");
      setLoading(false);
    }
  }

  return <Localized><main style={{ paddingBottom: "80px" }}>
      {/* Checkout Page Header */}
      <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", padding: "36px 0 28px" }}>
        <div className="shell" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="section-eyebrow">🔒 256-Bit SSL Encrypted Checkout</div>
            <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 700, letterSpacing: "-1px", margin: "4px 0" }}>
              Secure Delivery &amp; Reservation
            </h1>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
              Complete your details below to reserve this appliance and schedule doorstep delivery.
            </p>
          </div>

          {/* Countdown Reservation Badge */}
          <div
            style={{
              background: "#fff3e9",
              border: "1px solid #e7c7ad",
              borderRadius: "3px",
              padding: "10px 20px",
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 6px 20px rgba(0, 201, 167, 0.2)",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>⏱️</span>
            <div>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--teal)", fontWeight: 800 }}>
                Unit Held for You
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "0.5px" }}>
                {formatTimer(timeLeft)} mins remaining
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="shell section" style={{ paddingTop: "40px" }}>
        <div className="checkout-grid">
          
          {/* Left Column: Form */}
          <form onSubmit={handleSubmit} className="checkout-card">
            
            {/* Step 1: Contact Details */}
            <div className="checkout-step-title">
              <span className="checkout-step-num">1</span>
              <span>Customer Contact Information</span>
            </div>

            <div className="form-group-grid">
              <div className="form-group-full">
                <label className="form-label">Full Name *</label>
                <input
                  name="name"
                  className="form-input"
                  placeholder="e.g. Aman Sharma"
                  required
                  minLength={2}
                />
              </div>

              <div>
                <label className="form-label">10-Digit Mobile Number *</label>
                <input
                  name="phone"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  required
                  pattern="[6-9][0-9]{9}"
                  inputMode="numeric"
                />
                <div className="form-hint">Used for delivery updates &amp; technician confirmation.</div>
              </div>

              <div>
                <label className="form-label">Email Address *</label>
                <input
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. aman@example.com"
                  required
                />
                <div className="form-hint">Order receipt &amp; warranty certificate will be sent here.</div>
              </div>
            </div>

            {/* Step 2: Delivery & Shipping */}
            <div className="checkout-step-title" style={{ marginTop: "16px" }}>
              <span className="checkout-step-num">2</span>
              <span>Doorstep Delivery Address</span>
            </div>

            <div className="form-group-grid">
              <div>
                <label className="form-label">Select Delivery City *</label>
                <select
                  name="city"
                  className="form-input"
                  defaultValue={selectedProduct.stockMode === "CITY" ? selectedProduct.city : "Lucknow"}
                  required
                >
                  <option value="" disabled>Choose your city</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">6-Digit PIN Code *</label>
                <input
                  name="pincode"
                  className="form-input"
                  placeholder="e.g. 226001"
                  required
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                />
              </div>

              <div className="form-group-full">
                <label className="form-label">Complete Flat / House Address *</label>
                <textarea
                  name="address"
                  className="form-input"
                  rows={3}
                  placeholder="House no., Building name, Street, Landmark, Area details..."
                  required
                  minLength={12}
                />
                <div className="form-hint">Please provide detailed address for same-week installation by RB Care technicians.</div>
              </div>
            </div>

            {/* Step 3: Payment Options */}
            <div className="checkout-step-title" style={{ marginTop: "16px" }}>
              <span className="checkout-step-num">3</span>
              <span>Payment &amp; Confirmation</span>
            </div>

            <div
              style={{
                background: "var(--teal-light)",
                border: "1.5px solid var(--teal)",
                borderRadius: "14px",
                padding: "16px 20px",
                marginBottom: "28px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div style={{ fontSize: "1.8rem" }}>💳</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--teal-dark)" }}>
                  Instant Online Payment (UPI, Credit/Debit Cards, Netbanking)
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                  Secured by Razorpay. 100% money-back guarantee if delivery is delayed beyond 5 business days.
                </div>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1.5px solid #EF4444",
                  borderRadius: "3px",
                  padding: "14px 18px",
                  color: "#991B1B",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  marginBottom: "20px",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-teal btn-lg"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "16px 24px",
                fontSize: "1.05rem",
                fontWeight: 800,
                borderRadius: "3px",
                boxShadow: "var(--shadow-md)",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? (
                <span>⚡ Reserving Appliance &amp; Connecting Gateway…</span>
              ) : (
                <span>🔒 Proceed to Pay {formatINR(grandTotal)} →</span>
              )}
            </button>

            <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: "14px" }}>
              By clicking proceed, you agree to RB Care Service Warranty &amp; Delivery Policies.
            </p>
          </form>

          {/* Right Column: Order Summary Card */}
          <div className="checkout-summary-card">
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px", letterSpacing: "-0.5px" }}>
              Order Summary
            </h3>

            {/* Product Preview Card */}
            <div
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "center",
                paddingBottom: "20px",
                borderBottom: "1px solid var(--border)",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background: "var(--cream)",
                  borderRadius: "3px",
                  padding: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: "1px solid var(--border)",
                }}
              >
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  style={{ maxWidth: "100%", maxHeight: "64px", objectFit: "contain" }}
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=900&q=80";
                  }}
                />
              </div>

              <div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", color: "var(--teal-dark)", background: "var(--teal-light)", padding: "2px 8px", borderRadius: "3px" }}>
                    {selectedProduct.category}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>📍 {selectedProduct.city}</span>
                </div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.3, marginBottom: "4px" }}>
                  {selectedProduct.name}
                </h4>
                <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                  Condition: <strong>{selectedProduct.condition}</strong>
                </div>
              </div>
            </div>

            {/* Itemized Price Table */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--ink-muted)" }}>
                <span>Appliance Price</span>
                <strong style={{ color: "var(--ink)" }}>{formatINR(selectedProduct.price)}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--ink-muted)" }}>
                <span>Doorstep Delivery &amp; Setup</span>
                <strong style={{ color: "var(--ink)" }}>{formatINR(selectedProduct.delivery)}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--ink-muted)" }}>
                <span>40-Point Diagnostic Check</span>
                <strong style={{ color: "var(--teal)" }}>FREE</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--ink-muted)" }}>
                <span>{selectedProduct.warrantyDays}-Day Functional Warranty</span>
                <strong style={{ color: "var(--teal)" }}>INCLUDED</strong>
              </div>
            </div>

            {/* Grand Total */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "24px" }}>
              <div>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>Total Amount</span>
                <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>Includes GST, Taxes &amp; Installation</div>
              </div>
              <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.5px" }}>
                {formatINR(grandTotal)}
              </span>
            </div>

            {/* Trust Badges Panel */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                background: "var(--cream)",
                padding: "18px",
                borderRadius: "14px",
                fontSize: "0.82rem",
                color: "var(--ink-muted)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.1rem" }}>🛡️</span>
                <span><strong>{selectedProduct.warrantyDays}-Day Warranty:</strong> Complete parts &amp; labor coverage</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.1rem" }}>🚚</span>
                <span><strong>Fast Doorstep Install:</strong> Technician delivered</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.1rem" }}>🔒</span>
                <span><strong>Safe Payments:</strong> SSL Encrypted via Razorpay</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main></Localized>;
}

export default function CheckoutPage() {
  return <Localized><SiteChrome>
      <Suspense fallback={<main className="shell section" style={{ textAlign: "center", padding: "80px 0" }}>Loading Checkout…</main>}>
        <CheckoutForm />
      </Suspense>
    </SiteChrome></Localized>;
}


