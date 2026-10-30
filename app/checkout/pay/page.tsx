"use client";
import { Localized } from "@/components/Localization";


import Script from "next/script";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { formatINR } from "@/lib/catalog";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function PaymentLauncher() {
  const query = useSearchParams();
  const router = useRouter();
  const orderId = query.get("order");
  const payment = query.get("payment");

  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [error, setError] = useState("");

  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const isLiveRazorpay = Boolean(razorpayKey && !razorpayKey.includes("xxx") && payment);

  useEffect(() => {
    if (!ready || !isLiveRazorpay || !orderId || !payment || !window.Razorpay) return;

    try {
      const checkout = new window.Razorpay({
        key: razorpayKey,
        order_id: payment,
        name: "RB Care Refurbished Appliances",
        description: `Order Payment #${orderId}`,
        theme: { color: "#066b61" },
        handler: async (response: any) => {
          await fetch("/api/checkout/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, paymentId: response.razorpay_payment_id }),
          });
          router.push(`/checkout/confirmation?order=${encodeURIComponent(orderId)}`);
        },
        modal: {
          ondismiss: () => setError("Payment was cancelled. Your stock reservation will expire automatically."),
        },
      });
      checkout.open();
    } catch (e: any) {
      setError(e.message || "Failed to initialize Razorpay checkout");
    }
  }, [ready, isLiveRazorpay, orderId, payment, razorpayKey, router]);

  const handleSimulatedPayment = async () => {
    if (!orderId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentId: `pay_${paymentMethod}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment confirmation failed");
      router.push(`/checkout/confirmation?order=${encodeURIComponent(orderId)}`);
    } catch (err: any) {
      setError(err.message || "Failed to process payment");
      setSubmitting(false);
    }
  };

  if (!orderId) {
    return <Localized><main className="shell section">
        <h1>Invalid payment request</h1>
        <p className="muted">Order reference is missing. Please start checkout from the catalog.</p>
      </main></Localized>;
  }

  return <Localized><main className="shell section" style={{ maxWidth: "680px", margin: "auto" }}>
      {isLiveRazorpay && <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setReady(true)} />}

      <div className="eyebrow">Payment Gateway</div>
      <h1 style={{ fontSize: "2.2rem", margin: "8px 0" }}>Complete Order Payment</h1>
      <p className="lead" style={{ fontSize: "1rem" }}>
        Order ID: <strong>{orderId}</strong> · Locked stock reservation active.
      </p>

      {error && <div className="notice" style={{ background: "#fee2e2", borderLeftColor: "#991b1b", color: "#991b1b" }}>{error}</div>}

      {isLiveRazorpay ? (
        <div style={{ padding: "32px", textAlign: "center", background: "#f7f4ec", borderRadius: "3px", border: "1px solid #d9e2ec" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>💳</div>
          <strong>Opening Secure Razorpay Popup…</strong>
          <p className="muted" style={{ margin: "6px 0 0" }}>If popup doesn't open automatically, please check your browser popup blocker.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #d9e2ec", borderRadius: "14px", padding: "28px", boxShadow: "0 4px 14px rgba(0,0,0,0.06)", marginTop: "20px" }}>
          
          <div style={{ background: "#e7f8f5", padding: "12px 16px", borderRadius: "3px", borderLeft: "4px solid #066b61", marginBottom: "20px", fontSize: ".88rem" }}>
            🔒 <strong>Secure Razorpay Payment Interface</strong><br />
            Select your preferred payment method below to complete payment and lock your appliance order.
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {[
              { id: "UPI", label: "📱 UPI / GPay / PhonePe / Paytm" },
              { id: "CARD", label: "💳 Credit / Debit Card" },
              { id: "NETBANKING", label: "🏦 Net Banking" },
            ].map(method => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as any)}
                style={{
                  flex: 1, padding: "12px 8px", borderRadius: "3px", border: `2px solid ${paymentMethod === method.id ? "#066b61" : "#d9e2ec"}`,
                  background: paymentMethod === method.id ? "#e7f8f5" : "#fff",
                  fontWeight: 700, fontSize: ".82rem", cursor: "pointer", color: paymentMethod === method.id ? "#066b61" : "#486581"
                }}
              >
                {method.label}
              </button>
            ))}
          </div>

          {paymentMethod === "UPI" && (
            <div style={{ background: "#f7f4ec", padding: "20px", borderRadius: "3px", textAlign: "center", marginBottom: "20px" }}>
              <div style={{ background: "#fff", width: "120px", height: "120px", margin: "auto", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #066b61", borderRadius: "3px", fontWeight: 800, fontSize: "1.2rem", color: "#066b61" }}>
                [ UPI QR ]
              </div>
              <p style={{ margin: "10px 0 0", fontSize: ".85rem", fontWeight: 700 }}>Scan QR or click Pay Now below</p>
            </div>
          )}

          {paymentMethod === "CARD" && (
            <div style={{ background: "#f7f4ec", padding: "16px", borderRadius: "3px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <input type="text" placeholder="Card Number (4000 1234 5678 9010)" defaultValue="4000 1234 5678 9010" style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d9e2ec" }} />
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="text" placeholder="MM/YY" defaultValue="12/28" style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #d9e2ec" }} />
                <input type="password" placeholder="CVV" defaultValue="123" style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #d9e2ec" }} />
              </div>
            </div>
          )}

          {paymentMethod === "NETBANKING" && (
            <div style={{ background: "#f7f4ec", padding: "16px", borderRadius: "3px", marginBottom: "20px" }}>
              <select style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d9e2ec", background: "#fff" }}>
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>State Bank of India</option>
                <option>Axis Bank</option>
              </select>
            </div>
          )}

          <button
            onClick={handleSimulatedPayment}
            disabled={submitting}
            className="button full"
            style={{ width: "100%", padding: "16px", fontSize: "1.1rem", background: "#066b61" }}
          >
            {submitting ? "Processing Payment & Reserving Unit…" : "🔒 Confirm Payment & Complete Order"}
          </button>

        </div>
      )}
    </main></Localized>;
}

export default function PaymentPage() {
  return <Localized><SiteChrome>
      <Suspense fallback={<main className="shell section">Preparing secure payment…</main>}>
        <PaymentLauncher />
      </Suspense>
    </SiteChrome></Localized>;
}


