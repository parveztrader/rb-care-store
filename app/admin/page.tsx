"use client";
import { Localized, useLanguage } from "@/components/Localization";
import { translateText } from "@/lib/i18n/translate";
import { parseDetailLines, parsePhotoLines, parseSpecifications } from "@/lib/product-details";


import { useState, useEffect } from "react";
import { formatINR, cities, type Product, type City, type ProductCategory } from "@/lib/catalog";
import Link from "next/link";

/* ─── glassmorphism admin styles injected via style tag ─── */
const ADMIN_CSS = `
  .ag-root {
    min-height: 100vh;
    background: #f5f5f5;
    font-family: 'Inter', -apple-system, sans-serif;
    color: #252b35;
    -webkit-font-smoothing: antialiased;
  }
  /* sidebar */
  .ag-sidebar {
    position: fixed; top: 0; left: 0; bottom: 0; width: 240px;
    background: #252b35;
    border-right: 1px solid #dddddd;
    display: flex; flex-direction: column;
    z-index: 40; padding: 0;
    box-shadow: 4px 0 24px rgba(0,0,0,0.5);
  }
  .ag-sidebar-logo {
    padding: 20px 20px 16px;
    border-bottom: 1px solid #dddddd;
    display: flex; align-items: center; gap: 10px;
    background: #f4f4f4;
  }
  .ag-logo-icon {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg,#a94408,#f97015);
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 0.8rem; color: #fff; flex-shrink: 0;
    box-shadow: 0 0 12px rgba(249,112,21,0.4);
  }
  .ag-logo-text strong { display:block; font-size:0.88rem; font-weight:800; color:#252b35; line-height:1.1; }
  .ag-logo-text span   { display:block; font-size:0.62rem; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#666666; }
  .ag-nav { flex:1; padding: 16px 12px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; }
  .ag-nav-label { font-size:0.65rem; font-weight:800; letter-spacing:1.4px; text-transform:uppercase; color:#64748B; padding: 12px 8px 6px; }
  .ag-nav-item {
    display:flex; align-items:center; gap:10px;
    padding: 10px 12px; border-radius: 10px;
    font-size:0.88rem; font-weight:600; color:#444444;
    cursor:pointer; text-decoration:none; border:1px solid transparent; background:transparent;
    transition: all 0.2s; width:100%; text-align:left;
  }
  .ag-nav-item:hover {
    background: #eeeeee;
    color: #252b35;
    border-color: #bbbbbb;
  }
  .ag-nav-item.active {
    background: rgba(249,112,21,0.16);
    color: #91400b;
    border-color: rgba(249,112,21,0.35);
    font-weight: 700;
  }
  .ag-nav-item .nav-icon { font-size:1.05rem; flex-shrink:0; }
  .ag-nav-footer { padding: 14px 14px; border-top: 1px solid #dddddd; background: #f4f4f4; }
  .ag-nav-footer a { font-size:0.82rem; font-weight:600; color:#666666; display:flex; align-items:center; gap:6px; transition:color 0.2s; }
  .ag-nav-footer a:hover { color:#252b35; }
  /* main area */
  .ag-main { margin-left: 240px; min-height: 100vh; background: #f5f5f5; }
  /* topbar */
  .ag-topbar {
    background: #252b35;
    border-bottom: 1px solid #dddddd;
    padding: 16px 28px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top:0; z-index:30;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .ag-topbar-title { font-size:1.1rem; font-weight:900; color:#252b35; letter-spacing:-0.3px; }
  .ag-topbar-sub { font-size:0.78rem; font-weight:600; color:#666666; margin-top:2px; }
  .ag-badge {
    display:inline-flex; align-items:center; gap:6px;
    background: rgba(249,112,21,0.18); border: 1px solid rgba(249,112,21,0.4);
    color:#91400b; font-size:0.75rem; font-weight:800; padding:5px 12px; border-radius:100px;
  }
  .ag-badge.pulse { animation: pulse-teal 2s infinite; }
  @keyframes pulse-teal { 0%,100%{box-shadow:0 0 0 0 rgba(249,112,21,0.5)} 50%{box-shadow:0 0 0 8px rgba(249,112,21,0)} }
  /* content */
  .ag-content { padding: 28px; }
  /* glass card */
  .glass-card {
    background: #252b35;
    border: 1px solid #dddddd;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
  }
  .glass-card-header {
    padding: 18px 24px;
    border-bottom: 1px solid #dddddd;
    display:flex; align-items:center; justify-content:space-between;
    background: #f3f3f3;
  }
  /* stat cards */
  .stat-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; margin-bottom:24px; }
  .stat-glass {
    background: #252b35;
    border: 1px solid #dddddd;
    border-radius: 16px; padding: 20px 18px;
    position: relative; overflow:hidden;
    transition: all 0.2s ease;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }
  .stat-glass:hover { transform: translateY(-3px); border-color: #bbbbbb; background: #f3f3f3; }
  .stat-glass::before {
    content:''; position:absolute; top:0; left:0; right:0; height:3px;
    background: var(--accent, #a94408);
  }
  .stat-num { font-size:1.85rem; font-weight:900; color:#252b35; letter-spacing:-1px; line-height:1; }
  .stat-lbl { font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#666666; margin-top:6px; }
  .stat-icon { font-size:1.3rem; margin-bottom:10px; }
  /* table */
  .ag-table { width:100%; border-collapse:collapse; }
  .ag-table th { padding:12px 16px; font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#666666; border-bottom:1px solid #dddddd; text-align:left; background:#f3f3f3; }
  .ag-table td { padding:14px 16px; font-size:0.88rem; font-weight:500; color:#252b35; border-bottom:1px solid #dddddd; vertical-align:middle; }
  .ag-table tr:hover td { background:#eeeeee; }
  /* status pills */
  .pill-available { background:rgba(249,112,21,0.18); color:#91400b; border:1px solid rgba(249,112,21,0.4); padding:4px 12px; border-radius:100px; font-size:0.72rem; font-weight:800; }
  .pill-reserved  { background:rgba(245,158,11,0.18); color:#FBBF24; border:1px solid rgba(245,158,11,0.4); padding:4px 12px; border-radius:100px; font-size:0.72rem; font-weight:800; }
  .pill-sold      { background:rgba(239,68,68,0.18); color:#F87171; border:1px solid rgba(239,68,68,0.4); padding:4px 12px; border-radius:100px; font-size:0.72rem; font-weight:800; }
  /* glass buttons */
  .btn-glass {
    display:inline-flex; align-items:center; gap:6px;
    padding: 9px 16px; border-radius: 100px;
    font-size: 0.82rem; font-weight: 700; cursor: pointer; border: 1px solid transparent;
    transition: all 0.2s; text-decoration: none; white-space: nowrap;
  }
  .btn-glass-teal { background:rgba(249,112,21,0.22); color:#91400b; border-color:rgba(249,112,21,0.4); }
  .btn-glass-teal:hover { background:rgba(249,112,21,0.35); }
  .btn-glass-white { background:#dddddd; color:#252b35; border-color:#bbbbbb; }
  .btn-glass-white:hover { background:#bbbbbb; color:#252b35; }
  .btn-glass-red { background:rgba(239,68,68,0.2); color:#F87171; border-color:rgba(239,68,68,0.35); }
  .btn-glass-red:hover { background:rgba(239,68,68,0.35); }
  .btn-glass-solid { background:linear-gradient(135deg,#a94408,#f97015); color:#fff; box-shadow:0 4px 14px rgba(249,112,21,0.4); }
  .btn-glass-solid:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(249,112,21,0.6); }
  /* modal */
  .ag-modal-backdrop {
    position:fixed; top:0; left:0; right:0; bottom:0;
    background:rgba(0,0,0,0.85); backdrop-filter:blur(10px);
    z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px;
  }
  .ag-modal {
    background: #252b35;
    border: 1px solid #dddddd;
    border-radius: 20px;
    width:100%; max-width:680px; max-height:90vh; overflow-y:auto; padding:32px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(249,112,21,0.2);
  }
  .ag-modal h2 { color:#252b35; font-size:1.25rem; font-weight:900; margin:0; letter-spacing:-0.3px; }
  .ag-field { display:flex; flex-direction:column; gap:6px; }
  .ag-field label { font-size:0.75rem; font-weight:800; color:#666666; text-transform:uppercase; letter-spacing:0.8px; }
  .ag-field input, .ag-field select, .ag-field textarea {
    background:#eeeeee; border:1px solid #bbbbbb;
    border-radius:10px; padding:11px 14px; color:#252b35; font-size:0.92rem; font-weight:500;
    transition:all 0.2s; width:100%;
  }
  .ag-field input::placeholder, .ag-field textarea::placeholder { color:#64748B; }
  .ag-field input:focus, .ag-field select:focus, .ag-field textarea:focus {
    outline:none; border-color:#a94408; background:#252b35; box-shadow:0 0 0 3px rgba(249,112,21,0.2);
  }
  .ag-field select option { background:#252b35; color:#252b35; }
  code.ag-code {
    font-family: 'Courier New', monospace; font-size:0.75rem; font-weight:700;
    background:#eeeeee; color:#91400b;
    padding:4px 8px; border-radius:6px; border:1px solid #bbbbbb;
  }
  @media(max-width:900px) {
    .ag-sidebar { display:none; }
    .ag-main { margin-left:0; }
    .stat-grid { grid-template-columns:repeat(2,1fr); }
  }
`;

export default function Admin() {
  const { language } = useLanguage();
  const tr = (text: string) => translateText(text, language);
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState("");

  const [formData, setFormData] = useState<{
    name: string; category: ProductCategory; brand: string; model: string;
    city: City; stockMode: "CITY" | "CENTRAL"; condition: "Excellent" | "Very Good";
    price: number; delivery: number; warrantyDays: number; age: string;
    description: string; highlights: string; specifications: string; capacity: string; color: string; included: string; packaging: string; repairHistory: string; installation: string; photos: string; photoSource: "ACTUAL" | "REFERENCE";
    defects: string; tested: string; image: string; status: "AVAILABLE" | "RESERVED" | "SOLD";
  }>({
    name: "", category: "Washing Machine", brand: "", model: "",
      description: "", highlights: "", specifications: "", capacity: "", color: "", included: "", packaging: "", repairHistory: "", installation: "", photos: "", photoSource: "REFERENCE",
    city: "Lucknow", stockMode: "CITY", condition: "Excellent",
    price: 15000, delivery: 700, warrantyDays: 90, age: "Not provided",
    defects: "Not provided",
    tested: "",
    image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=900&q=80",
    status: "AVAILABLE",
  });

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString("en-IN"));
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString("en-IN")), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.products) setProductList(data.products);
    } catch (e) { console.error("Failed to load products", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: "", category: "Washing Machine", brand: "", model: "",
      description: "", highlights: "", specifications: "", capacity: "", color: "", included: "", packaging: "", repairHistory: "", installation: "", photos: "", photoSource: "REFERENCE",
      city: "Lucknow", stockMode: "CITY", condition: "Excellent",
      price: 15000, delivery: 700, warrantyDays: 90, age: "Not provided",
      defects: "Not provided",
      tested: "",
      image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=900&q=80",
      status: "AVAILABLE",
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name, category: p.category, brand: p.brand, model: p.model,
      city: p.city, stockMode: p.stockMode, condition: p.condition,
      price: p.price, delivery: p.delivery, warrantyDays: p.warrantyDays,
      age: p.age, defects: p.defects,
      tested: p.tested ? p.tested.join(", ") : "",
      description: p.description || "", highlights: (p.highlights || []).join("\n"), specifications: (p.specifications || []).map(row => `${row.label}: ${row.value}`).join("\n"),
      capacity: p.capacity || "", color: p.color || "", included: (p.included || []).join("\n"), packaging: p.packaging || "", repairHistory: p.repairHistory || "", installation: p.installation || "",
      photos: (p.photos || []).map(photo => `${photo.label} | ${photo.url}`).join("\n"), photoSource: p.photoSource || "REFERENCE",
      image: p.image, status: p.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tr(`Delete product ${id}?`))) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchProducts(); else alert(tr(data.error || "Failed to delete"));
    } catch { alert(tr("Error deleting product")); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    const payload = {
      ...formData, price: Number(formData.price), delivery: Number(formData.delivery),
      warrantyDays: Number(formData.warrantyDays),
      tested: formData.tested.split(",").map(s => s.trim()).filter(Boolean),
      photos: parsePhotoLines(formData.photos), highlights: parseDetailLines(formData.highlights), specifications: parseSpecifications(formData.specifications), included: parseDetailLines(formData.included),
    };
      const res = await fetch("/api/admin/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const data = await res.json();
      if (data.success) { setShowModal(false); fetchProducts(); }
      else alert(tr(data.error || "Failed to save"));
    } catch (error) { alert(tr(error instanceof Error ? error.message : "Error saving product")); }
  };

  const total = productList.length;
  const available = productList.filter(p => p.status === "AVAILABLE").length;
  const reserved = productList.filter(p => p.status === "RESERVED").length;
  const sold = productList.filter(p => p.status === "SOLD").length;
  const totalValue = productList.reduce((s, p) => s + p.price, 0);

  return <Localized><>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_CSS }} />
      <div className="ag-root">
        {/* ─── SIDEBAR ─── */}
        <aside className="ag-sidebar">
          <div className="ag-sidebar-logo">
            <div className="ag-logo-icon">RB</div>
            <div className="ag-logo-text">
              <strong>RB Care</strong>
              <span>Admin Panel</span>
            </div>
          </div>

          <nav className="ag-nav">
            <div className="ag-nav-label">Inventory</div>
            <Link href="/admin" className="ag-nav-item active">
              <span className="nav-icon">📦</span> Products
            </Link>
            <Link href="/admin/sell" className="ag-nav-item">Seller requests &amp; valuations</Link><Link href="/admin/orders" className="ag-nav-item">
              <span className="nav-icon">🛒</span> Orders
            </Link>

            <div className="ag-nav-label" style={{ marginTop: "8px" }}>Store</div>
            <Link href="/products" className="ag-nav-item" target="_blank">
              <span className="nav-icon">🏪</span> View Store
            </Link>
            <Link href="/" className="ag-nav-item" target="_blank">
              <span className="nav-icon">🏠</span> Homepage
            </Link>

            <div className="ag-nav-label" style={{ marginTop: "8px" }}>Support</div>
            <Link href="/faq" className="ag-nav-item" target="_blank">
              <span className="nav-icon">❓</span> FAQ Page
            </Link>
            <Link href="/contact" className="ag-nav-item" target="_blank">
              <span className="nav-icon">📞</span> Contact Page
            </Link>
          </nav>

          <div className="ag-nav-footer">
            <a href="https://rbcareservice.in" target="_blank" rel="noreferrer">
              ↗ rbcareservice.in
            </a>
          </div>
        </aside>

        {/* ─── MAIN ─── */}
        <div className="ag-main">
          {/* Topbar */}
          <div className="ag-topbar">
            <div>
              <h1 className="ag-topbar-title">Inventory Dashboard</h1>
              <div className="ag-topbar-sub">Manage your refurbished appliance listings</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)" }}>🕐 {currentTime}</span>
              <Link href="/admin/orders" className="btn-glass btn-glass-white">🛒 Orders</Link>
              <button onClick={handleOpenAddModal} className="btn-glass btn-glass-solid">+ Add Unit</button>
            </div>
          </div>

          {/* Content */}
          <div className="ag-content">
            {/* Notice */}
            <div style={{ background: "rgba(249,112,21,0.08)", border: "1px solid rgba(249,112,21,0.2)", borderRadius: "3px", padding: "12px 16px", marginBottom: "20px", fontSize: "0.82rem", color: "rgba(249,112,21,0.9)", display: "flex", alignItems: "center", gap: "8px" }}>
              🔒 <span>Admin Inventory Control — Add, Edit and Delete appliance listings in real-time.</span>
            </div>

            {/* Stats */}
            <div className="stat-grid">
              {[
                { icon: "📦", label: "Total Units", val: total, accent: "rgba(100,149,237,0.8)" },
                { icon: "✅", label: "Available",   val: available, accent: "rgba(249,112,21,0.8)" },
                { icon: "⏳", label: "Reserved",    val: reserved, accent: "rgba(250,173,20,0.8)" },
                { icon: "🏷️", label: "Sold",        val: sold, accent: "rgba(255,77,79,0.8)" },
                { icon: "💰", label: "Catalog Value", val: formatINR(totalValue), accent: "rgba(167,130,255,0.8)" },
              ].map(s => (
                <div key={s.label} className="stat-glass" style={{ "--accent": s.accent } as React.CSSProperties}>
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-num">{s.val}</div>
                  <div className="stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Products Table */}
            <div className="glass-card">
              <div className="glass-card-header">
                <div>
                  <span style={{ fontWeight: 800, color: "#252b35", fontSize: "0.95rem" }}>All Stock Units</span>
                  <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginLeft: "8px" }}>({total} listings)</span>
                </div>
                <button onClick={handleOpenAddModal} className="btn-glass btn-glass-teal">+ Add Appliance</button>
              </div>

              {loading ? (
                <div style={{ padding: "48px", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>⟳ Loading inventory...</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="ag-table">
                    <thead>
                      <tr>
                        <th>Stock ID</th>
                        <th>Appliance</th>
                        <th>Brand / Model</th>
                        <th>Location</th>
                        <th>Age</th>
                        <th>Price</th>
                        <th>Delivery</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productList.map(p => (
                        <tr key={p.id}>
                          <td><code className="ag-code">{p.id}</code></td>
                          <td>
                            <span style={{ fontWeight: 700, color: "#252b35", display: "block" }}>{p.name}</span>
                            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>{p.category}</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{p.brand}</span><br />
                            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>{p.model}</span>
                          </td>
                          <td>
                            <span style={{ color: "rgba(255,255,255,0.75)" }}>{p.city}</span><br />
                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>{p.stockMode}</span>
                          </td>
                          <td><span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>{p.age}</span></td>
                          <td><strong style={{ color: "#a94408" }}>{formatINR(p.price)}</strong></td>
                          <td><span style={{ color: "rgba(255,255,255,0.45)" }}>{formatINR(p.delivery)}</span></td>
                          <td>
                            <span className={`pill-${p.status.toLowerCase()}`}>{p.status}</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleOpenEditModal(p)} className="btn-glass btn-glass-white" style={{ padding: "5px 10px", fontSize: "0.75rem" }}>✏️ Edit</button>
                              <button onClick={() => handleDelete(p.id)} className="btn-glass btn-glass-red" style={{ padding: "5px 10px", fontSize: "0.75rem" }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── MODAL ─── */}
        {showModal && (
          <div className="ag-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="ag-modal">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2>{editingId ? `Edit Appliance · ${editingId}` : "Add New Appliance Unit"}</h2>
                <button onClick={() => setShowModal(false)} style={{ border: "none", background: "rgba(255,255,255,0.08)", color: "#252b35", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "var(--form-columns, 1fr 1fr)", gap: "14px" }}>
                <div className="ag-field" style={{ gridColumn: "1/-1" }}>
                  <label htmlFor="product-product-title-name">Product Title / Name</label>
                  <input id="product-product-title-name" type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. LG 7kg Front Load Washing Machine" />
                </div>

                <div className="ag-field">
                  <label htmlFor="product-category">Category</label>
                  <select id="product-category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as ProductCategory })}>
                    <option value="Washing Machine">Washing Machine</option>
                    <option value="Refrigerator">Refrigerator</option>
                    <option value="Air Conditioner">Air Conditioner</option>
                    <option value="Microwave">Microwave</option>
                  </select>
                </div>

                <div className="ag-field">
                  <label htmlFor="product-brand">Brand</label>
                  <input id="product-brand" type="text" required value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. LG, Samsung" />
                </div>

                <div className="ag-field">
                  <label htmlFor="product-model-number">Model Number</label>
                  <input id="product-model-number" type="text" required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="e.g. FHM1207BDL" />
                </div>

                <div className="ag-field">
                  <label htmlFor="product-city-location">City / Location</label>
                  <select id="product-city-location" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value as City })}>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="ag-field">
                  <label htmlFor="product-stock-type">Stock Type</label>
                  <select id="product-stock-type" value={formData.stockMode} onChange={e => setFormData({ ...formData, stockMode: e.target.value as "CITY" | "CENTRAL" })}>
                    <option value="CITY">CITY (City Specific)</option>
                    <option value="CENTRAL">CENTRAL (Central Warehouse)</option>
                  </select>
                </div>

                <div className="ag-field">
                  <label htmlFor="product-condition-grade">Condition Grade</label>
                  <select id="product-condition-grade" value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value as "Excellent" | "Very Good" })}>
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                  </select>
                </div>

                <div className="ag-field">
                  <label htmlFor="product-status">Status</label>
                  <select id="product-status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as "AVAILABLE" | "RESERVED" | "SOLD" })}>
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="RESERVED">RESERVED</option>
                    <option value="SOLD">SOLD</option>
                  </select>
                </div>

                <div className="ag-field">
                  <label htmlFor="product-price-inr">Price (INR)</label>
                  <input id="product-price-inr" type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                </div>

                <div className="ag-field">
                  <label htmlFor="product-delivery-charge-inr">Delivery Charge (INR)</label>
                  <input id="product-delivery-charge-inr" type="number" required value={formData.delivery} onChange={e => setFormData({ ...formData, delivery: Number(e.target.value) })} />
                </div>

                <div className="ag-field">
                  <label htmlFor="product-warranty-days">Warranty (Days)</label>
                  <input id="product-warranty-days" type="number" required value={formData.warrantyDays} onChange={e => setFormData({ ...formData, warrantyDays: Number(e.target.value) })} />
                </div>

                <div className="ag-field">
                  <label htmlFor="product-age">Age</label>
                  <input id="product-age" type="text" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} placeholder="e.g. Approx. 2 years" />
                </div>

                <div className="ag-field" style={{ gridColumn: "1/-1" }}>
                  <label htmlFor="product-cover-image-url">Cover image URL</label>
                  <input id="product-cover-image-url" type="text" required value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." />
                </div>

                <div className="ag-field" style={{ gridColumn: "1/-1" }}>
                  <label htmlFor="product-defects-condition-notes">Defects / Condition Notes</label>
                  <textarea id="product-defects-condition-notes" rows={2} value={formData.defects} onChange={e => setFormData({ ...formData, defects: e.target.value })} placeholder="Minor scratches..." />
                </div>

                <div className="ag-field" style={{ gridColumn: "1/-1" }}>
                  <label htmlFor="product-tested-features-comma-separated">Tested Features (comma-separated)</label>
                  <input id="product-tested-features-comma-separated" type="text" value={formData.tested} onChange={e => setFormData({ ...formData, tested: e.target.value })} placeholder="Spin cycle, Drainage, Door lock" />
                </div>

                <section className="admin-product-details" style={{ gridColumn: "1/-1" }}><h3>Detailed product listing</h3><p>Add the actual specifications and photos for this individual unit. Leave unknown details blank.</p></section>
                <div className="ag-field"><label htmlFor="product-capacity">Capacity</label><input id="product-capacity" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} placeholder="For example: 7 kg, 190 litres, 1.5 ton"/></div>
                <div className="ag-field"><label htmlFor="product-color">Color</label><input id="product-color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })}/></div>
                <div className="ag-field" style={{ gridColumn: "1/-1" }}><label htmlFor="product-product-description">Product description</label><textarea id="product-product-description" rows={3} maxLength={4000} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}/></div>
                <div className="ag-field" style={{ gridColumn: "1/-1" }}><label htmlFor="product-key-features-one-per-line">Key features — one per line</label><textarea id="product-key-features-one-per-line" rows={3} value={formData.highlights} onChange={e => setFormData({ ...formData, highlights: e.target.value })}/></div>
                <div className="ag-field" style={{ gridColumn: "1/-1" }}><label htmlFor="product-technical-specifications-label-value">Technical specifications — Label: Value</label><textarea id="product-technical-specifications-label-value" rows={4} value={formData.specifications} onChange={e => setFormData({ ...formData, specifications: e.target.value })} placeholder={"Dimensions: add verified dimensions\nPower: add label rating\nVoltage: add label rating\nLoading type: front load / top load"}/></div>
                <div className="ag-field" style={{ gridColumn: "1/-1" }}><label htmlFor="product-gallery-images-label-url-one-per-line">Gallery images — Label | URL, one per line</label><textarea id="product-gallery-images-label-url-one-per-line" rows={5} value={formData.photos} onChange={e => setFormData({ ...formData, photos: e.target.value })} placeholder={"Front view | https://example.com/front.jpg\nRear view | https://example.com/rear.jpg\nInside view | https://example.com/inside.jpg\nModel label | https://example.com/label.jpg\nWear and scratches | https://example.com/wear.jpg"}/><small>Up to 10 distinct images. Add a front view, rear view, inside view, model label and close-ups of wear.</small></div>
                <div className="ag-field" style={{ gridColumn: "1/-1" }}><label htmlFor="product-photo-source">Photo source</label><select id="product-photo-source" value={formData.photoSource} onChange={e => setFormData({ ...formData, photoSource: e.target.value as "ACTUAL" | "REFERENCE" })}><option value="REFERENCE">Reference images — not photos of this unit</option><option value="ACTUAL">Actual photos of this exact unit</option></select><small>Only select actual photos when every gallery image shows the listed unit.</small></div>
                <div className="ag-field" style={{ gridColumn: "1/-1" }}><label htmlFor="product-included-accessories-one-per-line">Included accessories — one per line</label><textarea id="product-included-accessories-one-per-line" rows={2} value={formData.included} onChange={e => setFormData({ ...formData, included: e.target.value })}/></div>
                <div className="ag-field" style={{ gridColumn: "1/-1" }}><label htmlFor="product-packaging">Packaging</label><textarea id="product-packaging" rows={2} value={formData.packaging} onChange={e => setFormData({ ...formData, packaging: e.target.value })}/></div>
                <div className="ag-field" style={{ gridColumn: "1/-1" }}><label htmlFor="product-repair-history">Repair history</label><textarea id="product-repair-history" rows={2} value={formData.repairHistory} onChange={e => setFormData({ ...formData, repairHistory: e.target.value })}/></div>
                <div className="ag-field" style={{ gridColumn: "1/-1" }}><label htmlFor="product-installation-notes">Installation notes</label><textarea id="product-installation-notes" rows={2} value={formData.installation} onChange={e => setFormData({ ...formData, installation: e.target.value })}/></div>

                <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-glass btn-glass-white">Cancel</button>
                  <button type="submit" className="btn-glass btn-glass-solid">{editingId ? "💾 Save Changes" : "✨ Create Product"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </></Localized>;
}





