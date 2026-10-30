"use client";
import { Localized, useLanguage } from "@/components/Localization";
import { translateText } from "@/lib/i18n/translate";


import { useState, useEffect } from "react";
import { formatINR } from "@/lib/catalog";
import type { OrderRecord, OrderStatus, DeliveryStatus } from "@/lib/orders";
import Link from "next/link";

const ORDERS_CSS = `
  .ag-root { min-height:100vh; background:#f5f5f5; font-family:'Inter',-apple-system,sans-serif; color:#252b35; -webkit-font-smoothing:antialiased; }
  .ag-sidebar { position:fixed;top:0;left:0;bottom:0;width:240px; background:#252b35; border-right:1px solid #dddddd; display:flex;flex-direction:column; z-index:40; box-shadow:4px 0 24px rgba(0,0,0,0.5); }
  .ag-sidebar-logo { padding:20px 20px 16px; border-bottom:1px solid #dddddd; display:flex;align-items:center;gap:10px; background:#f4f4f4; }
  .ag-logo-icon { width:36px;height:36px;border-radius:50%; background:linear-gradient(135deg,#a94408,#f97015); display:flex;align-items:center;justify-content:center; font-weight:900;font-size:0.8rem;color:#fff;flex-shrink:0; box-shadow:0 0 12px rgba(249,112,21,0.4); }
  .ag-logo-text strong { display:block;font-size:0.88rem;font-weight:800;color:#252b35;line-height:1.1; }
  .ag-logo-text span { display:block;font-size:0.62rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#666666; }
  .ag-nav { flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:4px;overflow-y:auto; }
  .ag-nav-label { font-size:0.65rem;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#64748B;padding:12px 8px 6px; }
  .ag-nav-item { display:flex;align-items:center;gap:10px; padding:10px 12px;border-radius:10px; font-size:0.88rem;font-weight:600;color:#444444; cursor:pointer;text-decoration:none;border:1px solid transparent;background:transparent; transition:all 0.2s;width:100%;text-align:left; }
  .ag-nav-item:hover { background:#eeeeee; color:#252b35; border-color:#bbbbbb; }
  .ag-nav-item.active { background:rgba(249,112,21,0.16);color:#91400b; border-color:rgba(249,112,21,0.35); font-weight:700; }
  .ag-nav-footer { padding:14px;border-top:1px solid #dddddd; background:#f4f4f4; }
  .ag-nav-footer a { font-size:0.82rem;font-weight:600;color:#666666;display:flex;align-items:center;gap:6px; transition:color 0.2s; }
  .ag-nav-footer a:hover { color:#252b35; }
  .ag-main { margin-left:240px;min-height:100vh; background:#f5f5f5; }
  .ag-topbar { background:#252b35;border-bottom:1px solid #dddddd;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:30; box-shadow:0 4px 20px rgba(0,0,0,0.3); }
  .ag-content { padding:28px; }
  .glass-card { background:#252b35;border:1px solid #dddddd;border-radius:16px;overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.5); }
  .glass-card-header { padding:18px 24px;border-bottom:1px solid #dddddd;display:flex;align-items:center;justify-content:space-between; background:#f3f3f3; }
  .stat-grid { display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-bottom:24px; }
  .stat-glass { background:#252b35;border:1px solid #dddddd;border-radius:16px;padding:20px 18px;position:relative;overflow:hidden;transition:all 0.2s ease; box-shadow:0 8px 24px rgba(0,0,0,0.4); }
  .stat-glass:hover { transform:translateY(-3px);background:#f3f3f3; border-color:#bbbbbb; }
  .stat-glass::before { content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--accent,#a94408); }
  .stat-num { font-size:1.85rem;font-weight:900;color:#252b35;letter-spacing:-1px;line-height:1; }
  .stat-lbl { font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#666666;margin-top:6px; }
  .stat-icon { font-size:1.3rem;margin-bottom:10px; }
  .order-card { background:#252b35;border:1px solid #dddddd;border-radius:16px;overflow:hidden;margin-bottom:20px;transition:all 0.2s ease; box-shadow:0 8px 24px rgba(0,0,0,0.4); }
  .order-card:hover { border-color:rgba(249,112,21,0.4); box-shadow:0 12px 32px rgba(0,0,0,0.6); }
  .order-header { padding:16px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px; border-bottom:1px solid #dddddd; background:#f3f3f3; }
  .order-header.paid   { background:rgba(249,112,21,0.12); border-bottom-color:rgba(249,112,21,0.25); }
  .order-header.pending { background:rgba(245,158,11,0.12); border-bottom-color:rgba(245,158,11,0.25); }
  .order-header.failed  { background:rgba(239,68,68,0.12); border-bottom-color:rgba(239,68,68,0.25); }
  .order-body { display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:0; }
  .order-col { padding:20px 24px; }
  .order-col + .order-col { border-left:1px solid #dddddd; }
  .order-col-label { font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:#91400b;margin-bottom:12px; }
  .order-footer { padding:14px 24px;border-top:1px solid #dddddd;display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#f3f3f3; }
  code.ag-code { font-family:'Courier New',monospace;font-size:0.75rem;font-weight:700;background:#eeeeee;color:#91400b;padding:4px 8px;border-radius:6px;border:1px solid #bbbbbb; }
  .pill-paid      { background:rgba(249,112,21,0.18);color:#91400b;border:1px solid rgba(249,112,21,0.4);padding:4px 12px;border-radius:100px;font-size:0.72rem;font-weight:800; }
  .pill-pending   { background:rgba(245,158,11,0.18);color:#FBBF24;border:1px solid rgba(245,158,11,0.4);padding:4px 12px;border-radius:100px;font-size:0.72rem;font-weight:800; }
  .pill-cancelled { background:rgba(239,68,68,0.18);color:#F87171;border:1px solid rgba(239,68,68,0.4);padding:4px 12px;border-radius:100px;font-size:0.72rem;font-weight:800; }
  .btn-glass { display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:100px;font-size:0.82rem;font-weight:700;cursor:pointer;border:1px solid transparent;transition:all 0.2s;text-decoration:none;white-space:nowrap; }
  .btn-glass-teal { background:rgba(249,112,21,0.22);color:#91400b;border-color:rgba(249,112,21,0.4); }
  .btn-glass-teal:hover { background:rgba(249,112,21,0.35); }
  .btn-glass-white { background:#dddddd;color:#252b35;border-color:#bbbbbb; }
  .btn-glass-white:hover { background:#bbbbbb;color:#252b35; }
  .btn-glass-green { background:rgba(34,197,94,0.2);color:#4ADE80;border-color:rgba(34,197,94,0.4); }
  .btn-glass-green:hover { background:rgba(34,197,94,0.35); }
  .btn-glass-red { background:rgba(239,68,68,0.2);color:#F87171;border-color:rgba(239,68,68,0.35); }
  .btn-glass-red:hover { background:rgba(239,68,68,0.35); }
  .btn-glass-solid { background:linear-gradient(135deg,#a94408,#f97015);color:#fff;box-shadow:0 4px 14px rgba(249,112,21,0.4); }
  .btn-glass-solid:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(249,112,21,0.6); }
  .ag-input { background:#eeeeee;border:1px solid #bbbbbb;border-radius:10px;padding:10px 14px;color:#252b35;font-size:0.9rem;font-weight:500;width:100%; transition:all 0.2s; }
  .ag-input::placeholder { color:#64748B; }
  .ag-input:focus { outline:none;border-color:#a94408; background:#252b35; box-shadow:0 0 0 3px rgba(249,112,21,0.2); }
  .ag-select { background:#eeeeee;border:1px solid #bbbbbb;border-radius:10px;padding:10px 14px;color:#252b35;font-size:0.9rem;font-weight:500;width:100%; transition:all 0.2s; }
  .ag-select option { background:#252b35;color:#252b35; }
  .delivery-select { background:#132E3A;border:1px solid #a94408;border-radius:8px;padding:8px 12px;color:#91400b;font-size:0.85rem;font-weight:700;width:100%; }
  .delivery-select option { background:#252b35;color:#252b35; }
  @media(max-width:900px){.ag-sidebar{display:none;}.ag-main{margin-left:0;}.stat-grid{grid-template-columns:repeat(2,1fr);}.order-body{grid-template-columns:1fr;}}
`;

export default function AdminOrders() {
  const { language } = useLanguage();
  const tr = (text: string) => translateText(text, language);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [cityFilter, setCityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [lastSynced, setLastSynced] = useState<string>("");

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.orders) { setOrders(data.orders); setLastSynced(new Date().toLocaleTimeString("en-IN")); }
    } catch (err) { console.error("Failed to load orders", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [autoSync]);

  const handleUpdateStatus = async (orderId: string, status?: OrderStatus, deliveryStatus?: DeliveryStatus) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status, deliveryStatus }),
      });
      const data = await res.json();
      if (data.success) fetchOrders(); else alert(tr(data.error || "Failed to update order"));
    } catch { alert(tr("Error updating order")); }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (cityFilter !== "ALL" && o.customer.city !== cityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return o.orderId.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q)
        || o.customer.phone.includes(q) || o.productName.toLowerCase().includes(q);
    }
    return true;
  });

  const totalRevenue = orders.filter(o => o.status === "PAID").reduce((s, o) => s + o.amount, 0);
  const paidCount = orders.filter(o => o.status === "PAID").length;
  const pendingCount = orders.filter(o => o.status === "PENDING").length;
  const deliveredCount = orders.filter(o => o.deliveryStatus === "DELIVERED").length;

  return <Localized><>
      <style dangerouslySetInnerHTML={{ __html: ORDERS_CSS }} />
      <div className="ag-root">
        {/* ─── SIDEBAR ─── */}
        <aside className="ag-sidebar">
          <div className="ag-sidebar-logo">
            <div className="ag-logo-icon">RB</div>
            <div className="ag-logo-text"><strong>RB Care</strong><span>Admin Panel</span></div>
          </div>
          <nav className="ag-nav">
            <div className="ag-nav-label">Inventory</div>
            <Link href="/admin" className="ag-nav-item"><span>📦</span> Products</Link>
            <Link href="/admin/orders" className="ag-nav-item active"><span>🛒</span> Orders</Link>
            <div className="ag-nav-label" style={{ marginTop: "8px" }}>Store</div>
            <Link href="/products" className="ag-nav-item" target="_blank"><span>🏪</span> View Store</Link>
            <Link href="/" className="ag-nav-item" target="_blank"><span>🏠</span> Homepage</Link>
            <div className="ag-nav-label" style={{ marginTop: "8px" }}>Support</div>
            <Link href="/faq" className="ag-nav-item" target="_blank"><span>❓</span> FAQ Page</Link>
            <Link href="/contact" className="ag-nav-item" target="_blank"><span>📞</span> Contact Page</Link>
          </nav>
          <div className="ag-nav-footer"><a href="https://rbcareservice.in" target="_blank" rel="noreferrer">↗ rbcareservice.in</a></div>
        </aside>

        {/* ─── MAIN ─── */}
        <div className="ag-main">
          {/* Topbar */}
          <div className="ag-topbar">
            <div>
              <h1 style={{ fontWeight: 800, color: "#252b35", fontSize: "1rem" }}>Orders &amp; Transactions</h1>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Customer payment & delivery tracking</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Live indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: autoSync ? "rgba(249,112,21,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${autoSync ? "rgba(249,112,21,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: "3px", padding: "5px 12px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: autoSync ? "#a94408" : "#666", display: "inline-block", boxShadow: autoSync ? "0 0 8px #a94408" : "none", animation: autoSync ? "pulse 2s infinite" : "none" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: autoSync ? "#a94408" : "rgba(255,255,255,0.4)" }}>
                  {autoSync ? "LIVE SYNC" : "PAUSED"}{lastSynced ? ` · ${lastSynced}` : ""}
                </span>
              </div>
              <button onClick={fetchOrders} className="btn-glass btn-glass-white" style={{ padding: "6px 12px", fontSize: "0.78rem" }}>🔄 Refresh</button>
              <Link href="/admin" className="btn-glass btn-glass-teal">📦 Inventory</Link>
            </div>
          </div>

          <div className="ag-content">
            {/* Webhook info */}
            <div style={{ background: "rgba(249,112,21,0.06)", border: "1px solid rgba(249,112,21,0.15)", borderRadius: "3px", padding: "12px 16px", marginBottom: "20px", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
              💡 <strong style={{ color: "#a94408" }}>Webhook URLs:</strong>
              {" "}<code className="ag-code">store.rbcareservice.in/api/payments/razorpay-webhook</code>
              {" "}·{" "}
              <code className="ag-code">store.rbcareservice.in/api/webhooks/shiprocket</code>
            </div>

            {/* Stats */}
            <div className="stat-grid">
              {[
                { icon: "📋", label: "Total Orders",    val: orders.length,         accent: "rgba(100,149,237,0.8)" },
                { icon: "✅", label: "Paid",            val: paidCount,              accent: "rgba(249,112,21,0.8)" },
                { icon: "⏳", label: "Pending",         val: pendingCount,           accent: "rgba(250,173,20,0.8)" },
                { icon: "🚚", label: "Delivered",       val: deliveredCount,         accent: "rgba(167,130,255,0.8)" },
                { icon: "💰", label: "Revenue Collected", val: formatINR(totalRevenue / 100), accent: "rgba(0,200,83,0.8)" },
              ].map(s => (
                <div key={s.label} className="stat-glass" style={{ "--accent": s.accent } as React.CSSProperties}>
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-num">{s.val}</div>
                  <div className="stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div className="glass-card" style={{ marginBottom: "20px" }}>
              <div style={{ padding: "16px 20px", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(255,255,255,0.35)", marginBottom: "5px" }}>🔍 Search</div>
                  <input className="ag-input" type="text" placeholder="Order ID, name, phone, product..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div style={{ minWidth: "150px" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(255,255,255,0.35)", marginBottom: "5px" }}>Payment Status</div>
                  <select className="ag-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="ALL">All Statuses</option>
                    <option value="PAID">✅ PAID</option>
                    <option value="PENDING">⏳ PENDING</option>
                    <option value="FAILED">❌ FAILED</option>
                    <option value="CANCELLED">🚫 CANCELLED</option>
                  </select>
                </div>
                <div style={{ minWidth: "130px" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(255,255,255,0.35)", marginBottom: "5px" }}>City</div>
                  <select className="ag-select" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
                    <option value="ALL">All Cities</option>
                    <option>Lucknow</option><option>Mumbai</option><option>Pune</option><option>Gonda</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", cursor: "pointer", paddingBottom: "2px" }}>
                    <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} style={{ accentColor: "#a94408", width: "15px", height: "15px" }} />
                    Auto (4s)
                  </label>
                  {(searchQuery || statusFilter !== "ALL" || cityFilter !== "ALL") && (
                    <button onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); setCityFilter("ALL"); }} className="btn-glass btn-glass-red" style={{ padding: "6px 12px", fontSize: "0.75rem" }}>✕ Reset</button>
                  )}
                </div>
              </div>
            </div>

            {/* Orders List */}
            {loading ? (
              <div style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>⟳ Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>🔍</div>
                <div style={{ fontWeight: 800, color: "#252b35", marginBottom: "6px" }}>No matching orders</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.88rem" }}>Adjust filters or search query</div>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.orderId} className="order-card">
                  {/* Header */}
                  <div className={`order-header ${order.status.toLowerCase()}`}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <code className="ag-code" style={{ fontSize: "0.88rem", fontWeight: 800 }}>{order.orderId}</code>
                      <span className={`pill-${order.status.toLowerCase()}`}>
                        {order.status === "PAID" ? "✅" : order.status === "PENDING" ? "⏳" : "❌"} {order.status}
                      </span>
                      <span style={{ background: "rgba(249,112,21,0.15)", color: "#a94408", border: "1px solid rgba(249,112,21,0.3)", padding: "3px 10px", borderRadius: "3px", fontSize: "0.7rem", fontWeight: 700 }}>
                        🚚 {order.deliveryStatus?.replace(/_/g, " ") ?? "ORDER PLACED"}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>
                      {new Date(order.createdAt).toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="order-body">
                    {/* Customer */}
                    <div className="order-col">
                      <div className="order-col-label">👤 Customer Info</div>
                      <div style={{ fontWeight: 800, color: "#252b35", fontSize: "1rem", marginBottom: "6px" }}>{order.customer.name}</div>
                      <div style={{ fontSize: "0.85rem", marginBottom: "3px" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>Phone: </span>
                        <a href={`tel:${order.customer.phone}`} style={{ color: "#a94408", fontWeight: 700 }}>{order.customer.phone}</a>
                      </div>
                      <div style={{ fontSize: "0.85rem", marginBottom: "10px" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>Email: </span>
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>{order.customer.email}</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "3px", padding: "10px 12px", fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.6)" }}>
                        <strong style={{ color: "rgba(255,255,255,0.8)" }}>Delivery:</strong><br />
                        {order.customer.address},<br />
                        {order.customer.city} — <strong style={{ color: "#252b35" }}>{order.customer.pincode}</strong>
                      </div>
                    </div>

                    {/* Product */}
                    <div className="order-col">
                      <div className="order-col-label">📦 Product Details</div>
                      <div style={{ fontWeight: 800, color: "#252b35", fontSize: "0.95rem", lineHeight: 1.4, marginBottom: "6px" }}>{order.productName}</div>
                      <code className="ag-code" style={{ display: "inline-block", marginBottom: "14px" }}>ID: {order.productId}</code>
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        {[
                          { l: "Item Price", v: formatINR((order.amount - order.deliveryCharge) / 100) },
                          { l: "Delivery", v: formatINR(order.deliveryCharge / 100) },
                        ].map(r => (
                          <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                            <span style={{ color: "rgba(255,255,255,0.4)" }}>{r.l}</span>
                            <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{r.v}</span>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "8px" }}>
                          <span style={{ fontWeight: 800, color: "#252b35" }}>Total Paid</span>
                          <strong style={{ color: "#a94408", fontSize: "1rem" }}>{formatINR(order.amount / 100)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Payment & Gateway */}
                    <div className="order-col">
                      <div className="order-col-label">💳 Gateway & Webhook</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: "4px" }}>RAZORPAY ORDER ID</div>
                          <code className="ag-code">{order.razorpayOrderId ?? "—"}</code>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: "4px" }}>PAYMENT ID</div>
                          <code className="ag-code" style={{ color: order.razorpayPaymentId ? "#a94408" : undefined }}>
                            {order.razorpayPaymentId ?? "Awaiting Webhook"}
                          </code>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: "4px" }}>PAYMENT TIME</div>
                          <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>
                            {order.paidAt ? new Date(order.paidAt).toLocaleString("en-IN") : "Not yet paid"}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: "5px" }}>DELIVERY TRACKER (Shiprocket)</div>
                          <select
                            className="delivery-select"
                            value={order.deliveryStatus || "ORDER_PLACED"}
                            onChange={e => handleUpdateStatus(order.orderId, undefined, e.target.value as DeliveryStatus)}
                          >
                            <option value="ORDER_PLACED">📦 ORDER PLACED</option>
                            <option value="DISPATCHED">🚚 DISPATCHED</option>
                            <option value="OUT_FOR_DELIVERY">🛵 OUT FOR DELIVERY</option>
                            <option value="DELIVERED">✅ DELIVERED</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="order-footer">
                    <a href={`tel:${order.customer.phone}`} className="btn-glass btn-glass-white" style={{ fontSize: "0.78rem", padding: "6px 12px" }}>📞 Call</a>
                    <a href={`https://wa.me/91${order.customer.phone}?text=Hello%20${encodeURIComponent(order.customer.name)},%20regarding%20your%20RB%20Care%20order%20${order.orderId}...`} target="_blank" rel="noreferrer" className="btn-glass btn-glass-green" style={{ fontSize: "0.78rem", padding: "6px 12px" }}>💬 WhatsApp</a>
                    <a href={`mailto:${order.customer.email}`} className="btn-glass btn-glass-white" style={{ fontSize: "0.78rem", padding: "6px 12px" }}>✉️ Email</a>
                    <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                      {order.status !== "PAID" && (
                        <button onClick={() => handleUpdateStatus(order.orderId, "PAID")} className="btn-glass btn-glass-solid" style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
                          ⚡ Simulate Payment Received
                        </button>
                      )}
                      {order.status !== "CANCELLED" && (
                        <button onClick={() => handleUpdateStatus(order.orderId, "CANCELLED")} className="btn-glass btn-glass-red" style={{ padding: "6px 12px", fontSize: "0.78rem" }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </></Localized>;
}




