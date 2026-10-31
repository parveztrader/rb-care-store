"use client";
import { Localized } from "@/components/Localization";


import Link from "next/link";
import { useState } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/catalog";

function CartContent() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartSubtotal,
    cartDeliveryTotal,
    cartGrandTotal,
  } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    const code = promoCode.trim().toUpperCase();
    if (code === "RBGIFT500" || code === "FIRST500") {
      setDiscountAmount(500);
      setPromoApplied(true);
    } else if (code === "WELCOME10") {
      const disc = Math.round(cartSubtotal * 0.1);
      setDiscountAmount(disc);
      setPromoApplied(true);
    } else if (!code) {
      setPromoError("Please enter a valid coupon code.");
    } else {
      setPromoError("Invalid coupon code. Try 'RBGIFT500' for ₹500 OFF!");
    }
  };

  const finalTotal = Math.max(0, cartGrandTotal - discountAmount);

  return <Localized><main>
        {/* Page Header */}
        <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", padding: "40px 0 32px" }}>
          <div className="shell" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div className="section-eyebrow">Shopping Cart</div>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-1px", marginBottom: "4px" }}>
                Your Selected Appliances ({cartCount})
              </h1>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.95rem" }}>
                All units are single inventory items — reserved for you during checkout.
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  background: "transparent",
                  border: "1.5px solid var(--border)",
                  borderRadius: "3px",
                  padding: "8px 18px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--ink-muted)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="shell section">
          {cart.length === 0 ? (
            /* Empty Cart View */
            <div style={{ textAlign: "center", padding: "80px 24px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "3px" }}>
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🛒</div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-0.5px", marginBottom: "12px", color: "var(--ink)" }}>
                Your cart is currently empty
              </h2>
              <p style={{ color: "var(--ink-muted)", fontSize: "1rem", maxWidth: "460px", margin: "0 auto 28px", lineHeight: 1.6 }}>
                Explore our technician-tested refurbished refrigerators, washing machines, ACs, and microwaves with 90-day warranty.
              </p>
              <Link href="/products" className="btn btn-dark btn-lg">
                Browse Stock &amp; Appliances →
              </Link>
            </div>
          ) : (
            /* Active Cart View */
            <div style={{ display: "grid", gridTemplateColumns: "var(--checkout-columns, 1.6fr 1fr)", gap: "40px", alignItems: "start" }}>

              {/* Left: Cart Items List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {cart.map(({ product: p, quantity }) => {
                  return <Localized key={p.id}><div
                      style={{
                        background: "var(--white)",
                        border: "1px solid var(--border)",
                        borderRadius: "3px",
                        padding: "24px",
                        display: "grid",
                        gridTemplateColumns: "var(--cart-columns, 100px 1fr auto)",
                        gap: "20px",
                        alignItems: "center",
                        position: "relative",
                      }}
                    >
                      {/* Image */}
                      <div
                        style={{
                          background: "var(--cream)",
                          borderRadius: "3px",
                          padding: "12px",
                          width: "100px",
                          height: "100px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{ maxWidth: "100%", maxHeight: "80px", objectFit: "contain", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.1))" }}
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=900&q=80";
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--teal)", background: "var(--teal-light)", padding: "2px 8px", borderRadius: "3px" }}>
                            {p.category}
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>📍 {p.city}</span>
                        </div>
                        <Link href={`/products/${p.slug}`} style={{ textDecoration: "none" }}>
                          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.3, marginBottom: "6px" }}>
                            {p.name}
                          </h3>
                        </Link>
                        <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginBottom: "8px" }}>
                          Condition: <strong>{p.condition}</strong> · 🛡️ {p.warrantyDays}-Day Warranty
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                          <span style={{ fontWeight: 800, color: "var(--ink)", fontSize: "1.05rem" }}>
                            {formatINR(p.price)}
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                            (+{formatINR(p.delivery)} delivery)
                          </span>
                        </div>
                      </div>

                      {/* Controls & Total */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "16px" }}>
                        <button
                          onClick={() => removeFromCart(p.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          aria-label="Remove item"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          Remove
                        </button>

                        {/* Quantity controls */}
                        <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: "3px", padding: "2px 8px", background: "var(--cream)" }}>
                          <button
                            onClick={() => updateQuantity(p.id, quantity - 1)}
                            style={{ border: "none", background: "transparent", width: "26px", height: "26px", borderRadius: "50%", cursor: "pointer", fontWeight: 800, color: "var(--ink)", fontSize: "0.9rem" }}
                            aria-label="Decrease quantity"
                          >
                            –
                          </button>
                          <span style={{ width: "24px", textAlign: "center", fontWeight: 800, fontSize: "0.88rem", color: "var(--ink)" }}>
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(p.id, quantity + 1)}
                            style={{ border: "none", background: "transparent", width: "26px", height: "26px", borderRadius: "50%", cursor: "pointer", fontWeight: 800, color: "var(--ink)", fontSize: "0.9rem" }}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal for line */}
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--ink-light)", fontWeight: 700 }}>Line Total</div>
                          <div style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--ink)" }}>
                            {formatINR((p.price + p.delivery) * quantity)}
                          </div>
                        </div>
                      </div>
                    </div></Localized>;
                })}
              </div>

              {/* Right: Order Summary Sidebar */}
              <div
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                  padding: "28px",
                  position: "sticky",
                  top: "90px",
                }}
              >
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px", letterSpacing: "-0.5px" }}>
                  Order Summary
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--ink-muted)" }}>
                    <span>Items Subtotal ({cartCount})</span>
                    <strong style={{ color: "var(--ink)" }}>{formatINR(cartSubtotal)}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--ink-muted)" }}>
                    <span>Delivery &amp; Installation</span>
                    <strong style={{ color: "var(--ink)" }}>{formatINR(cartDeliveryTotal)}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--ink-muted)" }}>
                    <span>90-Day Warranty Protection</span>
                    <strong style={{ color: "var(--teal)" }}>INCLUDED (FREE)</strong>
                  </div>

                  {promoApplied && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--teal-dark)", background: "var(--teal-light)", padding: "6px 10px", borderRadius: "3px" }}>
                      <span>Coupon Discount</span>
                      <strong>– {formatINR(discountAmount)}</strong>
                    </div>
                  )}
                </div>

                {/* Coupon Form */}
                <form onSubmit={handleApplyPromo} style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--ink-muted)", marginBottom: "6px" }}>
                    Have a coupon code?
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="e.g. RBGIFT500"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "3px",
                        border: "1.5px solid var(--border)",
                        fontSize: "0.85rem",
                        textTransform: "uppercase",
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        background: "var(--ink)",
                        color: "var(--white)",
                        border: "none",
                        borderRadius: "3px",
                        padding: "8px 18px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && <p style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "4px" }}>{promoError}</p>}
                  {promoApplied && <p style={{ color: "var(--teal-dark)", fontSize: "0.78rem", marginTop: "4px", fontWeight: 700 }}>✓ Coupon &apos;{promoCode.toUpperCase()}&apos; applied successfully!</p>}
                </form>

                {/* Total */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "24px", borderTop: "2px solid var(--ink)", paddingTop: "16px" }}>
                  <div>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>Grand Total</span>
                    <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>Includes all taxes &amp; delivery</div>
                  </div>
                  <span style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.5px" }}>
                    {formatINR(finalTotal)}
                  </span>
                </div>

                {/* Checkout Link */}
                <Link
                  href={`/checkout?product=${cart[0]?.product.slug}`}
                  className="btn btn-dark btn-lg"
                  style={{ width: "100%", justifyContent: "center", marginBottom: "16px" }}
                >
                  Proceed to Checkout →
                </Link>

                {/* Trust Badges */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "var(--cream)", padding: "16px", borderRadius: "3px", fontSize: "0.8rem", color: "var(--ink-muted)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🛡️</span>
                    <span><strong>90-Day Warranty:</strong> Covers motor &amp; key parts</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🔒</span>
                    <span><strong>100% Safe Payment:</strong> Secured via Razorpay</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🚚</span>
                    <span><strong>Free Doorstep Install:</strong> Technician delivered</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main></Localized>;
}

export default function CartPage() {
  return <Localized><SiteChrome>
      <CartContent />
    </SiteChrome></Localized>;
}


