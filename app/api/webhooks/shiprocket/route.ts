import { NextResponse } from "next/server";
import { updateOrderStatus, type DeliveryStatus } from "@/lib/orders";

/**
 * Shiprocket Webhook Receiver
 * Shiprocket sends HTTP POST notifications whenever a shipment status changes
 * (e.g. CANCELED, DELIVERED, OUT FOR DELIVERY, DISPATCHED, PICKED UP)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = request.headers.get("x-shiprocket-token");
    const secret = process.env.SHIPROCKET_WEBHOOK_TOKEN;

    // Validate security token if configured
    if (secret && token !== secret) {
      return NextResponse.json({ error: "Unauthorized webhook token" }, { status: 401 });
    }

    const { order_id, current_status } = body;
    if (!order_id || !current_status) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    // Map Shiprocket status string to internal DeliveryStatus
    let deliveryStatus: DeliveryStatus = "ORDER_PLACED";
    const statusUpper = String(current_status).toUpperCase();

    if (statusUpper.includes("DELIVERED")) {
      deliveryStatus = "DELIVERED";
    } else if (statusUpper.includes("OUT FOR DELIVERY")) {
      deliveryStatus = "OUT_FOR_DELIVERY";
    } else if (statusUpper.includes("DISPATCHED") || statusUpper.includes("IN TRANSIT") || statusUpper.includes("PICKED UP")) {
      deliveryStatus = "DISPATCHED";
    }

    updateOrderStatus(order_id, undefined, deliveryStatus);

    return NextResponse.json({ success: true, message: `Updated ${order_id} to ${deliveryStatus}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process Shiprocket webhook" }, { status: 400 });
  }
}
