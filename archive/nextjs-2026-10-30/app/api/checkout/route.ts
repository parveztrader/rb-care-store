import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createPendingOrder } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const pending = createPendingOrder(payload);

    // If live Razorpay keys are configured, create Razorpay Order
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_ID.includes("xxx")) {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const payment = await razorpay.orders.create({
        amount: pending.amount,
        currency: "INR",
        receipt: pending.orderId,
        notes: { orderId: pending.orderId, productId: pending.product.id },
      });
      return NextResponse.json({
        checkoutUrl: `/checkout/pay?order=${pending.orderId}&payment=${payment.id}`,
      });
    }

    // Interactive Payment Gateway Mode (when Razorpay live keys are pending)
    return NextResponse.json({
      checkoutUrl: `/checkout/pay?order=${pending.orderId}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create checkout" },
      { status: 400 }
    );
  }
}

