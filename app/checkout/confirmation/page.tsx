
import { Localized } from "@/components/Localization";
import Link from "next/link";
import { SiteChrome } from "@/components/SiteChrome";
import { getOrders, type OrderRecord } from "@/lib/orders";
import { formatINR } from "@/lib/catalog";

export default async function Confirmation({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; demo?: string }>;
}) {
  const query = await searchParams;
  const orderId = query.order;

  const orders = getOrders();
  const matchedOrder = orders.find((o) => o.orderId === orderId);

  return <Localized><SiteChrome>
      <main className="shell section" style={{ maxWidth: "760px", margin: "auto" }}>
        
        {/* Top Celebration Badge */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "8px" }}>🎉</div>
          <div className="eyebrow" style={{ fontSize: ".85rem" }}>Order Confirmed & Unit Reserved</div>
          <h1 style={{ fontSize: "2.3rem", margin: "6px 0 10px" }}>Thank you for choosing RB Care!</h1>
          <p className="lead" style={{ margin: "auto", fontSize: "1.05rem" }}>
            Your refurbished appliance has been locked for your address. Below is your official order receipt and delivery summary.
          </p>
        </div>

        {matchedOrder ? (
          <div style={{ background: "#fff", border: "1px solid #d9e2ec", borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
            
            {/* Receipt Bar Header */}
            <div style={{
              padding: "16px 24px", background: matchedOrder.status === "PAID" ? "#e8f7ef" : "#fef3c7",
              borderBottom: "1px solid #d9e2ec", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px"
            }}>
              <div>
                <span className="muted" style={{ fontSize: ".8rem", display: "block" }}>Order Reference</span>
                <code style={{ fontWeight: 800, fontSize: "1.1rem" }}>{matchedOrder.orderId}</code>
              </div>
              <span style={{
                padding: "6px 14px", borderRadius: "3px", fontWeight: 800, fontSize: ".85rem",
                background: matchedOrder.status === "PAID" ? "#1a7f4e" : "#b45309", color: "#fff"
              }}>
                {matchedOrder.status === "PAID" ? "✅ PAYMENT CONFIRMED" : "⏳ PAYMENT PENDING"}
              </span>
            </div>

            {/* Receipt Body */}
            <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "var(--form-columns, 1fr 1fr)", gap: "24px" }}>
              
              {/* Left Column: Customer & Delivery */}
              <div>
                <strong style={{ fontSize: ".82rem", textTransform: "uppercase", color: "#066b61", letterSpacing: ".8px", display: "block", marginBottom: "10px" }}>
                  📍 Delivery Address
                </strong>
                <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{matchedOrder.customer.name}</div>
                <div style={{ color: "#627d98", fontSize: ".9rem", marginTop: "4px" }}>📞 {matchedOrder.customer.phone}</div>
                <div style={{ color: "#627d98", fontSize: ".9rem", marginTop: "2px" }}>✉️ {matchedOrder.customer.email}</div>
                <div style={{ background: "#f7f4ec", padding: "12px", borderRadius: "3px", marginTop: "12px", fontSize: ".88rem", lineHeight: 1.5 }}>
                  {matchedOrder.customer.address},<br />
                  {matchedOrder.customer.city} — <strong>{matchedOrder.customer.pincode}</strong>
                </div>
              </div>

              {/* Right Column: Purchased Product */}
              <div>
                <strong style={{ fontSize: ".82rem", textTransform: "uppercase", color: "#066b61", letterSpacing: ".8px", display: "block", marginBottom: "10px" }}>
                  📦 Reserved Appliance
                </strong>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.3 }}>{matchedOrder.productName}</div>
                <div style={{ marginTop: "4px" }}>
                  <code style={{ fontSize: ".8rem", background: "#f0f4f8", padding: "3px 6px", borderRadius: "5px" }}>Stock ID: {matchedOrder.productId}</code>
                </div>

                <div style={{ marginTop: "16px", borderTop: "1px dashed #d9e2ec", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".9rem" }}>
                    <span className="muted">Appliance Price</span>
                    <strong>{formatINR((matchedOrder.amount - matchedOrder.deliveryCharge) / 100)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".9rem" }}>
                    <span className="muted">Delivery & Setup</span>
                    <strong>{formatINR(matchedOrder.deliveryCharge / 100)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", borderTop: "1px solid #d9e2ec", paddingTop: "8px", marginTop: "4px" }}>
                    <span style={{ fontWeight: 800 }}>Total Paid</span>
                    <strong style={{ color: "#066b61" }}>{formatINR(matchedOrder.amount / 100)}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Delivery Timeline Notice */}
            <div style={{ padding: "16px 24px", background: "#f0faf8", borderTop: "1px solid #d9e2ec", display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ fontSize: "1.5rem" }}>🚚</div>
              <div style={{ fontSize: ".88rem", lineHeight: 1.4 }}>
                <strong>Delivery & Installation Schedule:</strong><br />
                Our technician from <strong>{matchedOrder.customer.city} warehouse</strong> will call you at <strong>{matchedOrder.customer.phone}</strong> within 4 hours to confirm your preferred delivery time window.
              </div>
            </div>

            {/* Receipt Footer Action Bar */}
            <div style={{ padding: "18px 24px", background: "#fafafa", borderTop: "1px solid #d9e2ec", display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
              <a
                href={`https://wa.me/919876543210?text=Hello%20RB%20Care,%20I%20just%20placed%20Order%20${matchedOrder.orderId}%20for%20${encodeURIComponent(matchedOrder.productName)}`}
                target="_blank"
                rel="noreferrer"
                className="button"
                style={{ background: "#1a7f4e" }}
              >
                💬 Chat on WhatsApp for Delivery Updates
              </a>

              <div style={{ display: "flex", gap: "10px" }}>
                <Link className="button secondary" href="/admin/orders">
                  View in Admin Portal →
                </Link>
                <Link className="button secondary" href="/products">
                  Shop More Stock
                </Link>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #d9e2ec", borderRadius: "14px", padding: "32px", textAlign: "center" }}>
            <h2>Order {orderId || "Reference"} Registered</h2>
            <p className="lead">Our RB Care team will process your delivery schedule shortly.</p>
            <div style={{ marginTop: "20px", display: "flex", gap: "12px", justifyContent: "center" }}>
              <Link className="button" href="/products">Browse Stock</Link>
              <Link className="button secondary" href="/admin/orders">View Admin Orders</Link>
            </div>
          </div>
        )}

      </main>
    </SiteChrome></Localized>;
}


