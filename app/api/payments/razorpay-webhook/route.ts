import crypto from "crypto";
import { NextResponse } from "next/server";
import { markPaid } from "@/lib/orders";
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  const event = JSON.parse(raw);
  if (event.event === "payment.captured") {
    const entity = event.payload?.payment?.entity;
    const orderId = entity?.notes?.orderId;
    const razorpayPaymentId = entity?.id;
    if (orderId) markPaid(orderId, razorpayPaymentId);
  }
  return NextResponse.json({ ok: true });
}

