import { NextResponse } from "next/server";
import { markPaid, updateOrderStatus } from "@/lib/orders";

/**
 * Confirm Payment API endpoint
 * Used when a customer completes payment (via Razorpay or interactive Payment Gateway simulator)
 */
export async function POST(request: Request) {
  try {
    const { orderId, paymentId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const payId = paymentId || `pay_SIM_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const order = markPaid(orderId, payId);
    updateOrderStatus(orderId, "PAID", "ORDER_PLACED");

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to confirm payment" }, { status: 400 });
  }
}
